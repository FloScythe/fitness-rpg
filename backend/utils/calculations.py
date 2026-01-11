"""
FitnessRPG - Formules et Calculs (Python)
Réplique exacte des formules JavaScript pour cohérence
"""
import math
from typing import Dict, List, Optional

# ═══════════════════════════════════════════════════════════
# CONFIGURATION RPG
# ═══════════════════════════════════════════════════════════

RPG_CONFIG = {
    'MAX_LEVEL': 100,
    'XP_BASE': 100,
    'XP_EXPONENT': 1.5,
    'LEVEL_UP_BONUS': {
        'strength': 2,
        'endurance': 1,
        'health': 10
    }
}


# ═══════════════════════════════════════════════════════════
# SYSTÈME DE NIVEAUX
# ═══════════════════════════════════════════════════════════

def get_xp_for_level(level: int) -> int:
    """Calcule l'XP nécessaire pour atteindre un niveau"""
    if level <= 1:
        return 0
    return int(RPG_CONFIG['XP_BASE'] * math.pow(level, RPG_CONFIG['XP_EXPONENT']))


def calculate_level(total_xp: int) -> Dict:
    """Calcule le niveau actuel en fonction de l'XP total"""
    level = 1
    max_level = RPG_CONFIG['MAX_LEVEL']

    # Trouver le niveau actuel
    while level < max_level and total_xp >= get_xp_for_level(level + 1):
        level += 1

    xp_for_current_level = get_xp_for_level(level)
    xp_for_next_level = get_xp_for_level(level + 1)
    xp_in_current_level = total_xp - xp_for_current_level
    xp_needed_for_next = xp_for_next_level - xp_for_current_level

    progress = 0
    if xp_needed_for_next > 0:
        progress = (xp_in_current_level / xp_needed_for_next) * 100
    else:
        progress = 100

    return {
        'level': level,
        'current_xp': xp_in_current_level,
        'xp_for_next_level': xp_needed_for_next,
        'total_xp': total_xp,
        'progress': min(progress, 100)
    }


# ═══════════════════════════════════════════════════════════
# CALCULS D'ENTRAÎNEMENT
# ═══════════════════════════════════════════════════════════

def calculate_1rm(weight: float, reps: int) -> float:
    """Calcule le 1RM avec la formule de Brzycki"""
    if reps == 1:
        return weight
    if reps > 12:
        return weight  # Formule moins précise au-delà de 12 reps

    # Formule de Brzycki
    return weight / (1.0278 - 0.0278 * reps)


def calculate_volume(weight: float, reps: int) -> float:
    """Calcule le volume d'une série (poids × reps)"""
    return weight * reps


def calculate_xp(volume: float, xp_multiplier: float = 1.0) -> int:
    """Calcule l'XP gagné pour une série"""
    return int(volume * xp_multiplier)


def is_pr(current_1rm: float, previous_1rm: Optional[float]) -> bool:
    """Détermine si c'est un Personal Record"""
    if previous_1rm is None:
        return True
    return current_1rm > previous_1rm


# ═══════════════════════════════════════════════════════════
# SMART COACH - SURCHARGE PROGRESSIVE
# ═══════════════════════════════════════════════════════════

WEIGHT_INCREMENT = {
    'barbell': 2.5,
    'dumbbell': 2.0,
    'machine': 5.0,
    'bodyweight': 1
}


def suggest_progression(last_set: Dict, equipment: str = 'barbell') -> Dict:
    """Suggère le poids/reps pour la prochaine série"""
    weight = last_set.get('weight', 0)
    reps = last_set.get('reps', 0)
    rpe = last_set.get('rpe')

    increment = WEIGHT_INCREMENT.get(equipment, 2.5)

    # Si le RPE est faible (< 7), suggérer une augmentation
    if rpe and rpe < 7:
        return {
            'suggested_weight': weight + increment,
            'suggested_reps': reps,
            'reason': 'RPE faible, augmentation du poids'
        }

    # Si le RPE est élevé (> 8.5), garder le même poids
    if rpe and rpe > 8.5:
        return {
            'suggested_weight': weight,
            'suggested_reps': reps,
            'reason': 'RPE élevé, consolidation'
        }

    # Sinon, légère augmentation
    return {
        'suggested_weight': weight + increment,
        'suggested_reps': reps,
        'reason': 'Surcharge progressive'
    }


def should_deload(recent_workouts: List[Dict]) -> bool:
    """Détecte si un deload est nécessaire"""
    stagnation_threshold = 3

    if len(recent_workouts) < stagnation_threshold:
        return False

    # Vérifier si le volume diminue sur les dernières séances
    decreasing_trend = 0
    for i in range(1, len(recent_workouts)):
        if recent_workouts[i]['total_volume'] < recent_workouts[i - 1]['total_volume']:
            decreasing_trend += 1

    # Si le volume a baissé sur 2+ séances consécutives
    return decreasing_trend >= 2


def calculate_deload_weight(current_weight: float) -> float:
    """Calcule le poids de deload (85%)"""
    return math.floor(current_weight * 0.85)


# ═══════════════════════════════════════════════════════════
# STATISTIQUES RPG
# ═══════════════════════════════════════════════════════════

def calculate_strength_stat(workouts: List[Dict]) -> int:
    """Calcule la stat de Force en fonction des exercices"""
    max_strength = 0

    for workout in workouts:
        for exercise in workout.get('exercises', []):
            if exercise.get('stat_type') == 'strength' and exercise.get('best_1rm'):
                max_strength = max(max_strength, exercise['best_1rm'])

    # Normaliser sur une échelle 0-999
    return min(int(max_strength * 2), 999)


def calculate_endurance_stat(workouts: List[Dict]) -> int:
    """Calcule la stat d'Endurance en fonction du volume"""
    total_volume = sum(w.get('total_volume', 0) for w in workouts)

    # Normaliser sur une échelle 0-999
    return min(int(total_volume / 100), 999)


# ═══════════════════════════════════════════════════════════
# TIMER DE REPOS
# ═══════════════════════════════════════════════════════════

REST_TIMER_PRESETS = {
    'strength': 180,
    'hypertrophy': 90,
    'endurance': 60,
    'cardio': 30
}


def suggest_rest_time(exercise_type: str, rpe: Optional[float] = None) -> int:
    """Suggère un temps de repos en fonction du type d'exercice"""
    base_rest = REST_TIMER_PRESETS.get(exercise_type, 90)

    # Ajuster selon le RPE
    if rpe:
        if rpe >= 9:
            base_rest += 30  # +30s si très difficile
        elif rpe <= 6:
            base_rest -= 15  # -15s si facile

    return max(base_rest, 30)  # Minimum 30 secondes


# ═══════════════════════════════════════════════════════════
# AGRÉGATION DE DONNÉES
# ═══════════════════════════════════════════════════════════

def aggregate_workout_stats(workout_exercises: List[Dict]) -> Dict:
    """Agrège les statistiques d'une séance complète"""
    total_sets = 0
    total_volume = 0
    total_xp = 0
    best_1rm = 0

    for we in workout_exercises:
        sets = we.get('sets', [])
        total_sets += len(sets)

        for s in sets:
            volume = calculate_volume(s['weight_kg'], s['reps'])
            total_volume += volume

            # XP (si multiplicateur disponible)
            xp_mult = we.get('exercise', {}).get('xp_multiplier', 1.0)
            total_xp += calculate_xp(volume, xp_mult)

            # Meilleur 1RM
            rm = calculate_1rm(s['weight_kg'], s['reps'])
            best_1rm = max(best_1rm, rm)

    return {
        'total_sets': total_sets,
        'total_volume': round(total_volume, 2),
        'total_xp': total_xp,
        'best_1rm': round(best_1rm, 2)
    }


def calculate_workout_duration(workout_exercises: List[Dict]) -> int:
    """Estime la durée d'une séance en minutes"""
    total_sets = sum(len(we.get('sets', [])) for we in workout_exercises)

    # Estimation: 2 min par série (exercice + repos)
    estimated_minutes = total_sets * 2

    return estimated_minutes