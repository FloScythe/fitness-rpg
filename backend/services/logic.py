"""
FitnessRPG - Business Logic Service
Fonctions métier pour le calcul des statistiques et agrégations
"""
from typing import Dict, List, Optional
from models import WorkoutExercise, ExerciseSet, Workout, User
from utils.calculations import (
    calculate_1rm,
    calculate_volume,
    calculate_xp,
    aggregate_workout_stats
)


# ═══════════════════════════════════════════════════════════
# CALCULS SUR LES WORKOUT EXERCISES
# ═══════════════════════════════════════════════════════════

def calculate_exercise_volume(workout_exercise: WorkoutExercise) -> float:
    """
    Calcule le volume total d'un exercice dans une séance
    Volume = somme de (poids × reps) pour toutes les séries
    """
    total_volume = 0.0

    for exercise_set in workout_exercise.sets:
        if not exercise_set.is_warmup:  # Ignore les séries d'échauffement
            volume = calculate_volume(exercise_set.weight_kg, exercise_set.reps)
            total_volume += volume

    return round(total_volume, 2)


def calculate_exercise_best_1rm(workout_exercise: WorkoutExercise) -> Optional[float]:
    """
    Trouve le meilleur 1RM estimé pour un exercice dans une séance
    """
    best_1rm = 0.0

    for exercise_set in workout_exercise.sets:
        if not exercise_set.is_warmup:
            rm = calculate_1rm(exercise_set.weight_kg, exercise_set.reps)
            best_1rm = max(best_1rm, rm)

    return round(best_1rm, 2) if best_1rm > 0 else None


def update_workout_exercise_stats(workout_exercise: WorkoutExercise) -> None:
    """
    Met à jour les statistiques agrégées d'un WorkoutExercise
    À appeler après ajout/modification de séries
    """
    # Compter les séries (hors échauffement)
    workout_exercise.total_sets = sum(
        1 for s in workout_exercise.sets if not s.is_warmup
    )

    # Compter les reps totales
    workout_exercise.total_reps = sum(
        s.reps for s in workout_exercise.sets if not s.is_warmup
    )

    # Calculer le volume total
    workout_exercise.total_volume = calculate_exercise_volume(workout_exercise)

    # Calculer le meilleur 1RM
    workout_exercise.estimated_1rm = calculate_exercise_best_1rm(workout_exercise)


# ═══════════════════════════════════════════════════════════
# CALCULS SUR LES WORKOUTS
# ═══════════════════════════════════════════════════════════

def calculate_workout_total_volume(workout: Workout) -> float:
    """
    Calcule le volume total d'une séance
    """
    total = sum(we.total_volume for we in workout.workout_exercises)
    return round(total, 2)


def calculate_workout_xp(workout: Workout) -> int:
    """
    Calcule l'XP total gagné pendant une séance
    XP = volume × multiplicateur de l'exercice
    """
    total_xp = 0

    for workout_exercise in workout.workout_exercises:
        exercise_info = workout_exercise.exercise_info
        xp_multiplier = exercise_info.xp_multiplier if exercise_info else 1.0

        # XP = volume × multiplicateur
        xp = calculate_xp(workout_exercise.total_volume, xp_multiplier)
        total_xp += xp

    return total_xp


def update_workout_stats(workout: Workout) -> None:
    """
    Met à jour toutes les statistiques d'une séance
    À appeler quand la séance est complétée
    """
    # Mettre à jour les stats de chaque exercice
    for workout_exercise in workout.workout_exercises:
        update_workout_exercise_stats(workout_exercise)

    # Calculer le volume total de la séance
    workout.total_volume = calculate_workout_total_volume(workout)

    # Calculer l'XP gagné
    workout.xp_earned = calculate_workout_xp(workout)


# ═══════════════════════════════════════════════════════════
# CALCULS SUR LES EXERCISE SETS
# ═══════════════════════════════════════════════════════════

def calculate_set_stats(exercise_set: ExerciseSet) -> None:
    """
    Calcule et met à jour les stats d'une série individuelle
    À appeler après création/modification d'une série
    """
    # Calculer le volume
    exercise_set.volume = calculate_volume(
        exercise_set.weight_kg,
        exercise_set.reps
    )

    # Calculer le 1RM estimé
    exercise_set.estimated_1rm = calculate_1rm(
        exercise_set.weight_kg,
        exercise_set.reps
    )


def check_if_pr(exercise_set: ExerciseSet, workout_exercise: WorkoutExercise) -> bool:
    """
    Vérifie si cette série est un Personal Record pour cet exercice
    Compare le 1RM avec les séances précédentes
    """
    current_1rm = exercise_set.estimated_1rm
    if not current_1rm:
        return False

    # Récupérer l'exercice
    exercise = workout_exercise.exercise_info
    if not exercise:
        return False

    # Chercher le meilleur 1RM précédent pour cet exercice
    # (nécessite une requête vers d'autres WorkoutExercises du même exercice)
    # Pour l'instant, on marque PR si c'est le meilleur de la séance actuelle
    best_in_session = max(
        (s.estimated_1rm for s in workout_exercise.sets if s.estimated_1rm),
        default=0
    )

    return current_1rm >= best_in_session


# ═══════════════════════════════════════════════════════════
# CALCULS SUR L'UTILISATEUR
# ═══════════════════════════════════════════════════════════

def update_user_total_xp(user: User) -> None:
    """
    Recalcule l'XP total de l'utilisateur en fonction de toutes ses séances
    """
    total_xp = sum(
        workout.xp_earned
        for workout in user.workouts
        if workout.is_completed
    )

    user.total_xp = total_xp


def update_user_level(user: User) -> bool:
    """
    Met à jour le niveau de l'utilisateur en fonction de son XP total
    Retourne True si l'utilisateur a gagné un niveau
    """
    from utils.calculations import calculate_level

    old_level = user.current_level
    level_data = calculate_level(user.total_xp)
    new_level = level_data['level']

    user.current_level = new_level

    # Retourner True si level up
    return new_level > old_level


# ═══════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════

def serialize_workout_for_sync(workout: Workout) -> Dict:
    """
    Sérialise un Workout pour l'envoyer au client
    """
    return {
        'uuid': workout.uuid,
        'name': workout.name,
        'workout_date': workout.workout_date.isoformat(),
        'duration_minutes': workout.duration_minutes,
        'total_volume': workout.total_volume,
        'xp_earned': workout.xp_earned,
        'notes': workout.notes,
        'is_completed': workout.is_completed,
        'exercises': [
            serialize_workout_exercise_for_sync(we)
            for we in workout.workout_exercises
        ]
    }


def serialize_workout_exercise_for_sync(workout_exercise: WorkoutExercise) -> Dict:
    """
    Sérialise un WorkoutExercise pour l'envoyer au client
    """
    return {
        'uuid': workout_exercise.uuid,
        'exercise_uuid': workout_exercise.exercise_info.uuid if workout_exercise.exercise_info else None,
        'order_index': workout_exercise.order_index,
        'total_sets': workout_exercise.total_sets,
        'total_reps': workout_exercise.total_reps,
        'total_volume': workout_exercise.total_volume,
        'estimated_1rm': workout_exercise.estimated_1rm,
        'notes': workout_exercise.notes,
        'sets': [
            serialize_exercise_set_for_sync(s)
            for s in workout_exercise.sets
        ]
    }


def serialize_exercise_set_for_sync(exercise_set: ExerciseSet) -> Dict:
    """
    Sérialise un ExerciseSet pour l'envoyer au client
    """
    return {
        'uuid': exercise_set.uuid,
        'set_number': exercise_set.set_number,
        'weight_kg': exercise_set.weight_kg,
        'reps': exercise_set.reps,
        'rpe': exercise_set.rpe,
        'volume': exercise_set.volume,
        'estimated_1rm': exercise_set.estimated_1rm,
        'is_warmup': exercise_set.is_warmup,
        'is_pr': exercise_set.is_pr,
        'rest_seconds': exercise_set.rest_seconds
    }
