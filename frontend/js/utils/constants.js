/**
 * FitnessRPG - Constantes et Formules
 * Toutes les règles du jeu RPG centralisées ici
 */

// ═══════════════════════════════════════════════════════════
// SYSTÈME DE NIVEAUX (LEVELING)
// ═══════════════════════════════════════════════════════════

const RPG_CONFIG = {
  // Niveau maximum atteignable
  MAX_LEVEL: 100,

  // Formule de progression XP (exponentielle)
  // XP requis = BASE × (niveau ^ EXPONENT)
  XP_BASE: 100,
  XP_EXPONENT: 1.5,

  // Bonus de niveau
  LEVEL_UP_BONUS: {
    strength: 2,      // +2 Force par niveau
    endurance: 1,     // +1 Endurance par niveau
    health: 10        // +10 HP par niveau (cosmétique)
  }
};

/**
 * Calcule l'XP nécessaire pour atteindre un niveau donné
 * @param {number} level - Niveau cible
 * @returns {number} XP total nécessaire
 */
function getXPForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(RPG_CONFIG.XP_BASE * Math.pow(level, RPG_CONFIG.XP_EXPONENT));
}

/**
 * Calcule le niveau actuel en fonction de l'XP total
 * @param {number} totalXP - XP total de l'utilisateur
 * @returns {object} { level, currentXP, xpForNextLevel, progress }
 */
function calculateLevel(totalXP) {
  let level = 1;

  // Trouver le niveau actuel
  while (level < RPG_CONFIG.MAX_LEVEL && totalXP >= getXPForLevel(level + 1)) {
    level++;
  }

  const xpForCurrentLevel = getXPForLevel(level);
  const xpForNextLevel = getXPForLevel(level + 1);
  const xpInCurrentLevel = totalXP - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  const progress = xpNeededForNext > 0 ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;

  return {
    level,
    currentXP: xpInCurrentLevel,
    xpForNextLevel: xpNeededForNext,
    totalXP,
    progress: Math.min(progress, 100)
  };
}

// ═══════════════════════════════════════════════════════════
// CALCULS D'ENTRAÎNEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Calcule le 1RM (One Rep Max) avec la formule de Brzycki
 * @param {number} weight - Poids soulevé (kg)
 * @param {number} reps - Nombre de répétitions
 * @returns {number} 1RM estimé
 */
function calculate1RM(weight, reps) {
  if (reps === 1) return weight;
  if (reps > 12) return weight; // Formule moins précise au-delà de 12 reps

  // Formule de Brzycki: 1RM = weight / (1.0278 - 0.0278 × reps)
  return weight / (1.0278 - 0.0278 * reps);
}

/**
 * Calcule le volume d'une série (poids × reps)
 * @param {number} weight - Poids soulevé (kg)
 * @param {number} reps - Nombre de répétitions
 * @returns {number} Volume en kg
 */
function calculateVolume(weight, reps) {
  return weight * reps;
}

/**
 * Calcule l'XP gagné pour une série
 * @param {number} volume - Volume (kg)
 * @param {number} xpMultiplier - Multiplicateur de l'exercice
 * @returns {number} XP gagné (arrondi)
 */
function calculateXP(volume, xpMultiplier = 1.0) {
  return Math.floor(volume * xpMultiplier);
}

/**
 * Détermine si une série est un Personal Record (PR)
 * @param {number} current1RM - 1RM actuel
 * @param {number} previous1RM - Meilleur 1RM précédent (peut être null)
 * @returns {boolean} True si c'est un PR
 */
function isPR(current1RM, previous1RM) {
  if (!previous1RM) return true; // Premier essai = toujours un PR
  return current1RM > previous1RM;
}

// ═══════════════════════════════════════════════════════════
// SMART COACH - SURCHARGE PROGRESSIVE
// ═══════════════════════════════════════════════════════════

const PROGRESSION_CONFIG = {
  // Incréments suggérés selon l'exercice
  WEIGHT_INCREMENT: {
    barbell: 2.5,      // +2.5 kg pour barre
    dumbbell: 2.0,     // +2 kg par haltère
    machine: 5.0,      // +5 kg pour machine
    bodyweight: 1      // +1 rep pour poids du corps
  },

  // Seuil de stagnation (nombre de séances sans progrès)
  STAGNATION_THRESHOLD: 3,

  // Pourcentage de décharge (Deload) en cas de fatigue
  DELOAD_PERCENTAGE: 0.85 // 85% du poids habituel
};

/**
 * Suggère le poids/reps pour la prochaine série
 * @param {object} lastSet - Dernière série réalisée { weight, reps, rpe }
 * @param {string} equipment - Type d'équipement
 * @returns {object} { suggestedWeight, suggestedReps }
 */
function suggestProgression(lastSet, equipment = 'barbell') {
  const { weight, reps, rpe } = lastSet;
  const increment = PROGRESSION_CONFIG.WEIGHT_INCREMENT[equipment] || 2.5;

  // Si le RPE est faible (< 7), suggérer une augmentation
  if (rpe && rpe < 7) {
    return {
      suggestedWeight: weight + increment,
      suggestedReps: reps,
      reason: 'RPE faible, augmentation du poids'
    };
  }

  // Si le RPE est élevé (> 8.5), garder le même poids
  if (rpe && rpe > 8.5) {
    return {
      suggestedWeight: weight,
      suggestedReps: reps,
      reason: 'RPE élevé, consolidation'
    };
  }

  // Sinon, légère augmentation
  return {
    suggestedWeight: weight + increment,
    suggestedReps: reps,
    reason: 'Surcharge progressive'
  };
}

/**
 * Détecte si un décharge (Deload) est nécessaire
 * @param {array} recentWorkouts - Dernières séances (avec performances)
 * @returns {boolean} True si deload recommandé
 */
function shouldDeload(recentWorkouts) {
  if (recentWorkouts.length < PROGRESSION_CONFIG.STAGNATION_THRESHOLD) {
    return false;
  }

  // Vérifier si le volume diminue sur les dernières séances
  let decreasingTrend = 0;
  for (let i = 1; i < recentWorkouts.length; i++) {
    if (recentWorkouts[i].totalVolume < recentWorkouts[i - 1].totalVolume) {
      decreasingTrend++;
    }
  }

  // Si le volume a baissé sur 2+ séances consécutives
  return decreasingTrend >= 2;
}

/**
 * Calcule le poids de décharge
 * @param {number} currentWeight - Poids actuel
 * @returns {number} Poids de deload
 */
function calculateDeloadWeight(currentWeight) {
  return Math.floor(currentWeight * PROGRESSION_CONFIG.DELOAD_PERCENTAGE);
}

// ═══════════════════════════════════════════════════════════
// STATISTIQUES RPG
// ═══════════════════════════════════════════════════════════

/**
 * Calcule la stat de Force en fonction des exercices
 * @param {array} workouts - Historique des séances
 * @returns {number} Score de Force (0-999)
 */
function calculateStrengthStat(workouts) {
  // Basé sur le meilleur 1RM des exercices de type "strength"
  let maxStrength = 0;

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      if (exercise.statType === 'strength' && exercise.best1RM) {
        maxStrength = Math.max(maxStrength, exercise.best1RM);
      }
    });
  });

  // Normaliser sur une échelle 0-999
  return Math.min(Math.floor(maxStrength * 2), 999);
}

/**
 * Calcule la stat d'Endurance en fonction du volume
 * @param {array} workouts - Historique des séances (30 derniers jours)
 * @returns {number} Score d'Endurance (0-999)
 */
function calculateEnduranceStat(workouts) {
  // Basé sur le volume total des 30 derniers jours
  const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

  // Normaliser sur une échelle 0-999
  return Math.min(Math.floor(totalVolume / 100), 999);
}

// ═══════════════════════════════════════════════════════════
// TIMER DE REPOS
// ═══════════════════════════════════════════════════════════

const REST_TIMER_PRESETS = {
  strength: 180,    // 3 minutes pour la force
  hypertrophy: 90,  // 90 secondes pour l'hypertrophie
  endurance: 60,    // 1 minute pour l'endurance
  cardio: 30        // 30 secondes pour le cardio
};

/**
 * Suggère un temps de repos en fonction du type d'exercice
 * @param {string} exerciseType - Type d'exercice
 * @param {number} rpe - RPE de la série précédente
 * @returns {number} Temps de repos en secondes
 */
function suggestRestTime(exerciseType, rpe) {
  let baseRest = REST_TIMER_PRESETS[exerciseType] || 90;

  // Ajuster selon le RPE
  if (rpe >= 9) baseRest += 30; // +30s si très difficile
  if (rpe <= 6) baseRest -= 15; // -15s si facile

  return Math.max(baseRest, 30); // Minimum 30 secondes
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS & ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════

const ACHIEVEMENT_THRESHOLDS = {
  // Paliers d'XP pour débloquer des récompenses
  xpMilestones: [1000, 5000, 10000, 25000, 50000, 100000],

  // Paliers de volume total (kg)
  volumeMilestones: [10000, 50000, 100000, 250000, 500000, 1000000],

  // Paliers de 1RM (kg) pour exercices clés
  strengthMilestones: {
    'ex-bench-press': [60, 80, 100, 120, 140, 160],
    'ex-squat': [80, 100, 140, 180, 200, 220],
    'ex-deadlift': [100, 140, 180, 220, 260, 300]
  }
};

/**
 * Vérifie si un achievement a été débloqué
 * @param {string} type - Type d'achievement
 * @param {number} value - Valeur actuelle
 * @param {number} previousValue - Valeur précédente
 * @returns {object|null} Achievement débloqué ou null
 */
function checkAchievement(type, value, previousValue) {
  const thresholds = ACHIEVEMENT_THRESHOLDS[type];
  if (!thresholds) return null;

  // Trouver le palier franchi
  for (const threshold of thresholds) {
    if (previousValue < threshold && value >= threshold) {
      return {
        type,
        threshold,
        title: `${type} - ${threshold} atteint !`,
        description: `Félicitations ! Vous avez franchi le cap des ${threshold} !`
      };
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

const RPG_FORMULAS = {
  // Niveaux
  getXPForLevel,
  calculateLevel,

  // Entraînement
  calculate1RM,
  calculateVolume,
  calculateXP,
  isPR,

  // Progression
  suggestProgression,
  shouldDeload,
  calculateDeloadWeight,

  // Stats RPG
  calculateStrengthStat,
  calculateEnduranceStat,

  // Timer
  suggestRestTime,

  // Achievements
  checkAchievement
};

// Export global
if (typeof window !== 'undefined') {
  window.RPG_CONFIG = RPG_CONFIG;
  window.RPG_FORMULAS = RPG_FORMULAS;
  window.REST_TIMER_PRESETS = REST_TIMER_PRESETS;
  window.ACHIEVEMENT_THRESHOLDS = ACHIEVEMENT_THRESHOLDS;
}

// Export pour Node.js (backend)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RPG_CONFIG,
    RPG_FORMULAS,
    REST_TIMER_PRESETS,
    ACHIEVEMENT_THRESHOLDS,
    PROGRESSION_CONFIG
  };
}