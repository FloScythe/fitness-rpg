"""
FitnessRPG - Routes de Synchronisation
API pour sync Local-First (IndexedDB ↔ SQLite)
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, User, Workout, WorkoutExercise, ExerciseSet, exercise, SyncQueue
from utils.auth import token_required
from utils.calculations import (
    calculate_1rm, calculate_volume, calculate_xp,
    aggregate_workout_stats, calculate_level
)

sync_bp = Blueprint('sync', __name__, url_prefix='/api/sync')


# ═══════════════════════════════════════════════════════════
# SYNC PRINCIPAL - Upload des données locales vers serveur
# ═══════════════════════════════════════════════════════════

@sync_bp.route('/push', methods=['POST'])
@token_required
def sync_push(current_user):
    """
    Reçoit les données du client et les enregistre sur le serveur
    Body: { items: [{entity_type, entity_uuid, action, data}, ...] }
    """
    data = request.get_json()

    if not data or 'items' not in data:
        return jsonify({'error': 'Données manquantes'}), 400

    items = data['items']
    results = []
    errors = []

    # Récupérer l'utilisateur
    user = User.query.filter_by(uuid=current_user['uuid']).first()
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    # Traiter chaque élément de la queue
    for item in items:
        try:
            entity_type = item.get('entity_type')
            entity_uuid = item.get('entity_uuid')
            action = item.get('action')  # create, update, delete
            entity_data = item.get('data', {})

            if entity_type == 'workout':
                result = _sync_workout(user.id, entity_uuid, action, entity_data)
            elif entity_type == 'workout_exercise':
                result = _sync_workout_exercise(user.id, entity_uuid, action, entity_data)
            elif entity_type == 'exercise_set':
                result = _sync_exercise_set(user.id, entity_uuid, action, entity_data)
            elif entity_type == 'exercise':
                result = _sync_exercise(user.id, entity_uuid, action, entity_data)
            else:
                result = {'status': 'skipped', 'reason': f'Type inconnu: {entity_type}'}

            results.append({
                'entity_uuid': entity_uuid,
                'status': result.get('status', 'success')
            })

        except Exception as e:
            errors.append({
                'entity_uuid': item.get('entity_uuid'),
                'error': str(e)
            })

    # Mettre à jour la date de dernière sync
    user.last_sync = datetime.utcnow()

    # Recalculer l'XP total et le niveau
    _update_user_stats(user)

    db.session.commit()

    return jsonify({
        'success': True,
        'synced': len(results),
        'errors': len(errors),
        'results': results,
        'error_details': errors if errors else None,
        'user': {
            'total_xp': user.total_xp,
            'level': user.current_level,
            'last_sync': user.last_sync.isoformat()
        }
    }), 200


# ═══════════════════════════════════════════════════════════
# SYNC - Téléchargement des données serveur vers client
# ═══════════════════════════════════════════════════════════

@sync_bp.route('/pull', methods=['GET'])
@token_required
def sync_pull(current_user):
    """
    Envoie toutes les données de l'utilisateur au client
    Utilisé pour restauration ou synchronisation complète
    """
    user = User.query.filter_by(uuid=current_user['uuid']).first()
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    # Récupérer toutes les séances
    workouts = Workout.query.filter_by(user_id=user.id).order_by(Workout.workout_date.desc()).all()

    workouts_data = []
    for workout in workouts:
        workout_exercises = []

        for we in workout.workout_exercises:
            sets_data = [
                {
                    'uuid': s.uuid,
                    'set_number': s.set_number,
                    'weight_kg': s.weight_kg,
                    'reps': s.reps,
                    'rpe': s.rpe,
                    'volume': s.volume,
                    'estimated_1rm': s.estimated_1rm,
                    'is_warmup': s.is_warmup,
                    'is_pr': s.is_pr,
                    'rest_seconds': s.rest_seconds,
                    'created_at': s.created_at.isoformat()
                }
                for s in we.sets
            ]

            workout_exercises.append({
                'uuid': we.uuid,
                'exercise_uuid': we.exercise.uuid,
                'exercise_name': we.exercise.name,
                'order_index': we.order_index,
                'total_sets': we.total_sets,
                'total_volume': we.total_volume,
                'estimated_1rm': we.estimated_1rm,
                'sets': sets_data
            })

        workouts_data.append({
            'uuid': workout.uuid,
            'name': workout.name,
            'workout_date': workout.workout_date.isoformat(),
            'duration_minutes': workout.duration_minutes,
            'total_volume': workout.total_volume,
            'xp_earned': workout.xp_earned,
            'is_completed': workout.is_completed,
            'notes': workout.notes,
            'exercises': workout_exercises
        })

    return jsonify({
        'success': True,
        'user': {
            'uuid': user.uuid,
            'username': user.username,
            'total_xp': user.total_xp,
            'current_level': user.current_level,
            'last_sync': user.last_sync.isoformat() if user.last_sync else None
        },
        'workouts': workouts_data,
        'total_workouts': len(workouts_data)
    }), 200


# ═══════════════════════════════════════════════════════════
# FONCTIONS HELPER - Sync par type d'entité
# ═══════════════════════════════════════════════════════════

def _sync_workout(user_id, uuid, action, data):
    """Synchronise une séance"""
    if action == 'delete':
        workout = Workout.query.filter_by(uuid=uuid).first()
        if workout:
            db.session.delete(workout)
        return {'status': 'deleted'}

    # Create ou Update
    workout = Workout.query.filter_by(uuid=uuid).first()

    if not workout:
        workout = Workout(uuid=uuid, user_id=user_id)

    # Mettre à jour les champs
    workout.name = data.get('name')
    workout.workout_date = datetime.fromisoformat(data.get('workout_date').replace('Z', '+00:00'))
    workout.duration_minutes = data.get('duration_minutes')
    workout.total_volume = data.get('total_volume', 0)
    workout.xp_earned = data.get('xp_earned', 0)
    workout.is_completed = data.get('is_completed', False)
    workout.notes = data.get('notes')
    workout.updated_at = datetime.utcnow()

    db.session.add(workout)
    return {'status': 'synced'}


def _sync_workout_exercise(user_id, uuid, action, data):
    """Synchronise un exercice dans une séance"""
    if action == 'delete':
        we = WorkoutExercise.query.filter_by(uuid=uuid).first()
        if we:
            db.session.delete(we)
        return {'status': 'deleted'}

    we = WorkoutExercise.query.filter_by(uuid=uuid).first()

    if not we:
        we = WorkoutExercise(uuid=uuid)

    # Trouver la séance et l'exercice
    workout = Workout.query.filter_by(uuid=data.get('workout_uuid')).first()
    exercise = Exercise.query.filter_by(uuid=data.get('exercise_uuid')).first()

    if not workout or not exercise:
        raise ValueError('Workout ou Exercise introuvable')

    we.workout_id = workout.id
    we.exercise_id = exercise.id
    we.order_index = data.get('order_index', 0)
    we.total_sets = data.get('total_sets', 0)
    we.total_reps = data.get('total_reps', 0)
    we.total_volume = data.get('total_volume', 0)
    we.estimated_1rm = data.get('estimated_1rm')
    we.notes = data.get('notes')

    db.session.add(we)
    return {'status': 'synced'}


def _sync_exercise_set(user_id, uuid, action, data):
    """Synchronise une série individuelle"""
    if action == 'delete':
        s = ExerciseSet.query.filter_by(uuid=uuid).first()
        if s:
            db.session.delete(s)
        return {'status': 'deleted'}

    s = ExerciseSet.query.filter_by(uuid=uuid).first()

    if not s:
        s = ExerciseSet(uuid=uuid)

    # Trouver le WorkoutExercise parent
    we = WorkoutExercise.query.filter_by(uuid=data.get('workout_exercise_uuid')).first()
    if not we:
        raise ValueError('WorkoutExercise introuvable')

    s.workout_exercise_id = we.id
    s.set_number = data.get('set_number')
    s.weight_kg = data.get('weight_kg')
    s.reps = data.get('reps')
    s.rpe = data.get('rpe')
    s.is_warmup = data.get('is_warmup', False)
    s.is_pr = data.get('is_pr', False)
    s.rest_seconds = data.get('rest_seconds')

    # Calculs automatiques
    s.volume = calculate_volume(s.weight_kg, s.reps)
    s.estimated_1rm = calculate_1rm(s.weight_kg, s.reps)

    db.session.add(s)
    return {'status': 'synced'}


def _sync_exercise(user_id, uuid, action, data):
    """Synchronise un exercice personnalisé"""
    if action == 'delete':
        exercise = Exercise.query.filter_by(uuid=uuid).first()
        if exercise and exercise.is_custom:
            db.session.delete(exercise)
        return {'status': 'deleted'}

    exercise = Exercise.query.filter_by(uuid=uuid).first()

    if not exercise:
        exercise = Exercise(uuid=uuid, user_id=user_id)

    exercise.name = data.get('name')
    exercise.category = data.get('category')
    exercise.muscle_group = data.get('muscle_group')
    exercise.xp_multiplier = data.get('xp_multiplier', 1.0)
    exercise.stat_type = data.get('stat_type', 'strength')
    exercise.is_custom = data.get('is_custom', True)
    exercise.is_archived = data.get('is_archived', False)
    exercise.updated_at = datetime.utcnow()

    db.session.add(exercise)
    return {'status': 'synced'}


def _update_user_stats(user):
    """Recalcule les stats globales de l'utilisateur"""
    # Calculer l'XP total de toutes les séances
    total_xp = db.session.query(db.func.sum(Workout.xp_earned)).filter_by(
        user_id=user.id,
        is_completed=True
    ).scalar() or 0

    user.total_xp = int(total_xp)

    # Calculer le niveau
    level_data = calculate_level(user.total_xp)
    user.current_level = level_data['level']