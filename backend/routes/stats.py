"""
FitnessRPG - Routes de Statistiques
Calculs lourds côté serveur pour analytics avancés
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func, desc
from models import db, User, Workout, WorkoutExercise, ExerciseSet, exercise
from utils.auth import token_required
from utils.calculations import (
    calculate_strength_stat, calculate_endurance_stat,
    calculate_level, suggest_progression, should_deload
)

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')


# ═══════════════════════════════════════════════════════════
# DASHBOARD - Statistiques générales
# ═══════════════════════════════════════════════════════════

@stats_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    """Retourne les stats principales pour le dashboard"""
    user = User.query.filter_by(uuid=current_user['uuid']).first()
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    # Calculer le niveau
    level_data = calculate_level(user.total_xp)

    # Total des séances
    total_workouts = Workout.query.filter_by(user_id=user.id, is_completed=True).count()

    # Volume total soulevé (toutes séances)
    total_volume = db.session.query(func.sum(Workout.total_volume)).filter_by(
        user_id=user.id,
        is_completed=True
    ).scalar() or 0

    # Séances ce mois-ci
    start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    workouts_this_month = Workout.query.filter(
        Workout.user_id == user.id,
        Workout.is_completed == True,
        Workout.workout_date >= start_of_month
    ).count()

    # Meilleur 1RM toutes séances
    best_1rm_record = db.session.query(
        ExerciseSet.estimated_1rm,
        Exercise.name
    ).join(
        WorkoutExercise, ExerciseSet.workout_exercise_id == WorkoutExercise.id
    ).join(
        Exercise, WorkoutExercise.exercise_id == Exercise.id
    ).join(
        Workout, WorkoutExercise.workout_id == Workout.id
    ).filter(
        Workout.user_id == user.id
    ).order_by(desc(ExerciseSet.estimated_1rm)).first()

    best_1rm = None
    if best_1rm_record:
        best_1rm = {
            'value': round(best_1rm_record[0], 2),
            'exercise': best_1rm_record[1]
        }

    # Série de séances (streak)
    streak = _calculate_workout_streak(user.id)

    return jsonify({
        'success': True,
        'user': {
            'username': user.username,
            'level': level_data['level'],
            'total_xp': level_data['total_xp'],
            'current_xp': level_data['current_xp'],
            'xp_for_next_level': level_data['xp_for_next_level'],
            'progress': round(level_data['progress'], 1)
        },
        'stats': {
            'total_workouts': total_workouts,
            'total_volume_kg': round(total_volume, 2),
            'workouts_this_month': workouts_this_month,
            'best_1rm': best_1rm,
            'current_streak': streak
        }
    }), 200


# ═══════════════════════════════════════════════════════════
# PROGRESSION - Analyse des performances
# ═══════════════════════════════════════════════════════════

@stats_bp.route('/progression/<exercise_uuid>', methods=['GET'])
@token_required
def get_exercise_progression(current_user, exercise_uuid):
    """Retourne l'historique de progression pour un exercice"""
    user = User.query.filter_by(uuid=current_user['uuid']).first()
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    exercise = Exercise.query.filter_by(uuid=exercise_uuid).first()
    if not exercise:
        return jsonify({'error': 'Exercice introuvable'}), 404

    # Récupérer toutes les séances avec cet exercice
    workout_exercises = db.session.query(WorkoutExercise).join(
        Workout, WorkoutExercise.workout_id == Workout.id
    ).filter(
        Workout.user_id == user.id,
        WorkoutExercise.exercise_id == exercise.id,
        Workout.is_completed == True
    ).order_by(Workout.workout_date.asc()).all()

    progression_data = []

    for we in workout_exercises:
        sets_data = [
            {
                'set_number': s.set_number,
                'weight_kg': s.weight_kg,
                'reps': s.reps,
                'volume': s.volume,
                'estimated_1rm': s.estimated_1rm,
                'is_pr': s.is_pr
            }
            for s in we.sets if not s.is_warmup
        ]

        progression_data.append({
            'date': we.workout.workout_date.isoformat(),
            'total_volume': we.total_volume,
            'best_1rm': we.estimated_1rm,
            'total_sets': we.total_sets,
            'sets': sets_data
        })

    # Calculer les tendances
    if len(progression_data) >= 2:
        first_volume = progression_data[0]['total_volume']
        last_volume = progression_data[-1]['total_volume']
        volume_improvement = ((last_volume - first_volume) / first_volume * 100) if first_volume > 0 else 0

        first_1rm = progression_data[0]['best_1rm']
        last_1rm = progression_data[-1]['best_1rm']
        strength_improvement = ((last_1rm - first_1rm) / first_1rm * 100) if first_1rm > 0 else 0
    else:
        volume_improvement = 0
        strength_improvement = 0

    return jsonify({
        'success': True,
        'exercise': {
            'uuid': exercise.uuid,
            'name': exercise.name,
            'category': exercise.category
        },
        'total_sessions': len(progression_data),
        'progression': progression_data,
        'trends': {
            'volume_improvement_percent': round(volume_improvement, 1),
            'strength_improvement_percent': round(strength_improvement, 1)
        }
    }), 200


# ═══════════════════════════════════════════════════════════
# SMART COACH - Recommandations
# ═══════════════════════════════════════════════════════════

@stats_bp.route('/recommendations', methods=['GET'])
@token_required
def get_recommendations(current_user):
    """Retourne des recommandations basées sur l'historique"""
    user = User.query.filter_by(uuid=current_user['uuid']).first()
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    # Récupérer les 5 dernières séances
    recent_workouts = Workout.query.filter_by(
        user_id=user.id,
        is_completed=True
    ).order_by(desc(Workout.workout_date)).limit(5).all()

    recommendations = []

    # Vérifier si un deload est nécessaire
    if len(recent_workouts) >= 3:
        workouts_data = [
            {'total_volume': w.total_volume}
            for w in recent_workouts
        ]

        if should_deload(workouts_data):
            recommendations.append({
                'type': 'deload',
                'priority': 'high',
                'title': 'Décharge recommandée',
                'description': 'Vos performances baissent. Réduisez les poids de 15% cette semaine.',
                'icon': '⚠️'
            })

    # Vérifier la fréquence d'entraînement
    if recent_workouts:
        days_since_last = (datetime.now() - recent_workouts[0].workout_date).days

        if days_since_last > 5:
            recommendations.append({
                'type': 'frequency',
                'priority': 'medium',
                'title': 'Il est temps de s\'entraîner !',
                'description': f'Votre dernière séance remonte à {days_since_last} jours.',
                'icon': '💪'
            })

    # Suggestions d'exercices peu pratiqués
    # (exercices non faits depuis longtemps)
    all_exercises = Exercise.query.filter(
        (Exercise.user_id == user.id) | (Exercise.user_id == None)
    ).all()

    recent_exercise_ids = set()
    for w in recent_workouts:
        for we in w.workout_exercises:
            recent_exercise_ids.add(we.exercise_id)

    unused_exercises = [e for e in all_exercises if e.id not in recent_exercise_ids]

    if unused_exercises:
        sample_exercise = unused_exercises[0]
        recommendations.append({
            'type': 'variety',
            'priority': 'low',
            'title': 'Variez vos entraînements',
            'description': f'Essayez "{sample_exercise.name}" lors de votre prochaine séance.',
            'icon': '🎯'
        })

    return jsonify({
        'success': True,
        'recommendations': recommendations
    }), 200


# ═══════════════════════════════════════════════════════════
# RECORDS PERSONNELS (PRs)
# ═══════════════════════════════════════════════════════════

@stats_bp.route('/personal-records', methods=['GET'])
@token_required
def get_personal_records(current_user):
    """Retourne tous les records personnels de l'utilisateur"""
    user = User.query.filter_by(uuid=current_user['uuid']).first()
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    # Récupérer tous les PRs
    prs = db.session.query(
        ExerciseSet,
        Exercise.name,
        Workout.workout_date
    ).join(
        WorkoutExercise, ExerciseSet.workout_exercise_id == WorkoutExercise.id
    ).join(
        Exercise, WorkoutExercise.exercise_id == Exercise.id
    ).join(
        Workout, WorkoutExercise.workout_id == Workout.id
    ).filter(
        Workout.user_id == user.id,
        ExerciseSet.is_pr == True
    ).order_by(desc(Workout.workout_date)).all()

    pr_data = [
        {
            'exercise': pr[1],
            'weight_kg': pr[0].weight_kg,
            'reps': pr[0].reps,
            'estimated_1rm': round(pr[0].estimated_1rm, 2),
            'date': pr[2].isoformat()
        }
        for pr in prs
    ]

    return jsonify({
        'success': True,
        'total_prs': len(pr_data),
        'records': pr_data
    }), 200


# ═══════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════

def _calculate_workout_streak(user_id):
    """Calcule le nombre de jours consécutifs avec séance"""
    workouts = Workout.query.filter_by(
        user_id=user_id,
        is_completed=True
    ).order_by(desc(Workout.workout_date)).all()

    if not workouts:
        return 0

    streak = 0
    current_date = datetime.now().date()

    # Vérifier les jours consécutifs
    for workout in workouts:
        workout_date = workout.workout_date.date()
        days_diff = (current_date - workout_date).days

        if days_diff <= 1:  # Aujourd'hui ou hier
            streak += 1
            current_date = workout_date
        else:
            break

    return streak