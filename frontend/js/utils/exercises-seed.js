/**
 * FitnessRPG - Bibliothèque d'exercices prédéfinis
 * Ces exercices seront pré-chargés dans IndexedDB au premier lancement
 */

const EXERCISE_LIBRARY = [
  // ═══════════════════════════════════════════════════════════
  // CATÉGORIE: PUSH (Poussée) - CHEST/SHOULDERS/TRICEPS
  // ═══════════════════════════════════════════════════════════
  {
    uuid: 'ex-bench-press',
    name: 'Développé Couché (Bench Press)',
    category: 'push',
    muscleGroup: 'chest',
    statType: 'strength',
    xpMultiplier: 1.5, // Exercice roi = plus d'XP
    description: 'Exercice de base pour les pectoraux',
    difficulty: 'intermediate',
    equipment: 'barbell'
  },
  {
    uuid: 'ex-incline-bench',
    name: 'Développé Incliné',
    category: 'push',
    muscleGroup: 'chest',
    statType: 'strength',
    xpMultiplier: 1.3,
    description: 'Cible le haut des pectoraux',
    difficulty: 'intermediate',
    equipment: 'barbell'
  },
  {
    uuid: 'ex-dumbbell-press',
    name: 'Développé Haltères',
    category: 'push',
    muscleGroup: 'chest',
    statType: 'strength',
    xpMultiplier: 1.2,
    description: 'Variante avec haltères pour plus d\'amplitude',
    difficulty: 'beginner',
    equipment: 'dumbbell'
  },
  {
    uuid: 'ex-overhead-press',
    name: 'Développé Militaire (OHP)',
    category: 'push',
    muscleGroup: 'shoulders',
    statType: 'strength',
    xpMultiplier: 1.4,
    description: 'Exercice roi pour les épaules',
    difficulty: 'intermediate',
    equipment: 'barbell'
  },
  {
    uuid: 'ex-dumbbell-shoulder',
    name: 'Développé Épaules Haltères',
    category: 'push',
    muscleGroup: 'shoulders',
    statType: 'strength',
    xpMultiplier: 1.1,
    description: 'Développé épaules avec haltères',
    difficulty: 'beginner',
    equipment: 'dumbbell'
  },
  {
    uuid: 'ex-lateral-raise',
    name: 'Élévations Latérales',
    category: 'push',
    muscleGroup: 'shoulders',
    statType: 'endurance',
    xpMultiplier: 0.8,
    description: 'Isolation des deltoïdes latéraux',
    difficulty: 'beginner',
    equipment: 'dumbbell'
  },
  {
    uuid: 'ex-dips',
    name: 'Dips',
    category: 'push',
    muscleGroup: 'triceps',
    statType: 'strength',
    xpMultiplier: 1.3,
    description: 'Triceps et pectoraux (poids du corps)',
    difficulty: 'intermediate',
    equipment: 'bodyweight'
  },
  {
    uuid: 'ex-pushups',
    name: 'Pompes (Push-ups)',
    category: 'push',
    muscleGroup: 'chest',
    statType: 'endurance',
    xpMultiplier: 0.7,
    description: 'Exercice au poids du corps',
    difficulty: 'beginner',
    equipment: 'bodyweight'
  },

  // ═══════════════════════════════════════════════════════════
  // CATÉGORIE: PULL (Traction) - BACK/BICEPS
  // ═══════════════════════════════════════════════════════════
  {
    uuid: 'ex-deadlift',
    name: 'Soulevé de Terre (Deadlift)',
    category: 'pull',
    muscleGroup: 'back',
    statType: 'strength',
    xpMultiplier: 2.0, // LE BOSS des exercices
    description: 'Exercice roi du développement global',
    difficulty: 'advanced',
    equipment: 'barbell'
  },
  {
    uuid: 'ex-barbell-row',
    name: 'Rowing Barre',
    category: 'pull',
    muscleGroup: 'back',
    statType: 'strength',
    xpMultiplier: 1.4,
    description: 'Épaisseur du dos',
    difficulty: 'intermediate',
    equipment: 'barbell'
  },
  {
    uuid: 'ex-pullups',
    name: 'Tractions (Pull-ups)',
    category: 'pull',
    muscleGroup: 'back',
    statType: 'strength',
    xpMultiplier: 1.5,
    description: 'Largeur du dos (poids du corps)',
    difficulty: 'intermediate',
    equipment: 'bodyweight'
  },
  {
    uuid: 'ex-lat-pulldown',
    name: 'Tirage Vertical',
    category: 'pull',
    muscleGroup: 'back',
    statType: 'strength',
    xpMultiplier: 1.2,
    description: 'Alternative aux tractions',
    difficulty: 'beginner',
    equipment: 'machine'
  },
  {
    uuid: 'ex-dumbbell-row',
    name: 'Rowing Haltère',
    category: 'pull',
    muscleGroup: 'back',
    statType: 'strength',
    xpMultiplier: 1.1,
    description: 'Rowing unilatéral',
    difficulty: 'beginner',
    equipment: 'dumbbell'
  },
  {
    uuid: 'ex-barbell-curl',
    name: 'Curl Barre',
    category: 'pull',
    muscleGroup: 'biceps',
    statType: 'strength',
    xpMultiplier: 0.9,
    description: 'Exercice de base pour les biceps',
    difficulty: 'beginner',
    equipment: 'barbell'
  },
  {
    uuid: 'ex-hammer-curl',
    name: 'Curl Marteau',
    category: 'pull',
    muscleGroup: 'biceps',
    statType: 'strength',
    xpMultiplier: 0.8,
    description: 'Cible le brachial',
    difficulty: 'beginner',
    equipment: 'dumbbell'
  },

  // ═══════════════════════════════════════════════════════════
  // CATÉGORIE: LEGS (Jambes) - QUADS/HAMSTRINGS/GLUTES/CALVES
  // ═══════════════════════════════════════════════════════════
  {
    uuid: 'ex-squat',
    name: 'Squat Barre',
    category: 'legs',
    muscleGroup: 'quads',
    statType: 'strength',
    xpMultiplier: 1.8, // Exercice roi des jambes
    description: 'Le roi des exercices pour les jambes',
    difficulty: 'intermediate',
    equipment: 'barbell'
  },
  {
    uuid: 'ex-front-squat',
    name: 'Squat Avant',
    category: 'legs',
    muscleGroup: 'quads',
    statType: 'strength',
    xpMultiplier: 1.6,
    description: 'Variante qui cible plus les quadriceps',
    difficulty: 'advanced',
    equipment: 'barbell'
  },
  {
    uuid: 'ex-leg-press',
    name: 'Presse à Cuisses',
    category: 'legs',
    muscleGroup: 'quads',
    statType: 'strength',
    xpMultiplier: 1.3,
    description: 'Exercice machine pour les jambes',
    difficulty: 'beginner',
    equipment: 'machine'
  },
  {
    uuid: 'ex-romanian-deadlift',
    name: 'Soulevé de Terre Roumain',
    category: 'legs',
    muscleGroup: 'hamstrings',
    statType: 'strength',
    xpMultiplier: 1.5,
    description: 'Cible les ischio-jambiers et fessiers',
    difficulty: 'intermediate',
    equipment: 'barbell'
  },
  {
    uuid: 'ex-leg-curl',
    name: 'Leg Curl',
    category: 'legs',
    muscleGroup: 'hamstrings',
    statType: 'endurance',
    xpMultiplier: 0.9,
    description: 'Isolation des ischio-jambiers',
    difficulty: 'beginner',
    equipment: 'machine'
  },
  {
    uuid: 'ex-lunges',
    name: 'Fentes',
    category: 'legs',
    muscleGroup: 'quads',
    statType: 'endurance',
    xpMultiplier: 1.0,
    description: 'Exercice unilatéral pour les jambes',
    difficulty: 'beginner',
    equipment: 'dumbbell'
  },
  {
    uuid: 'ex-calf-raise',
    name: 'Mollets Debout',
    category: 'legs',
    muscleGroup: 'calves',
    statType: 'endurance',
    xpMultiplier: 0.7,
    description: 'Isolation des mollets',
    difficulty: 'beginner',
    equipment: 'machine'
  },

  // ═══════════════════════════════════════════════════════════
  // CATÉGORIE: CORE (Abdominaux/Gainage)
  // ═══════════════════════════════════════════════════════════
  {
    uuid: 'ex-plank',
    name: 'Planche (Plank)',
    category: 'core',
    muscleGroup: 'abs',
    statType: 'endurance',
    xpMultiplier: 0.5,
    description: 'Gainage statique',
    difficulty: 'beginner',
    equipment: 'bodyweight'
  },
  {
    uuid: 'ex-hanging-leg-raise',
    name: 'Relevé de Jambes Suspendu',
    category: 'core',
    muscleGroup: 'abs',
    statType: 'strength',
    xpMultiplier: 1.0,
    description: 'Exercice avancé pour les abdominaux',
    difficulty: 'advanced',
    equipment: 'bodyweight'
  },
  {
    uuid: 'ex-cable-crunch',
    name: 'Crunch à la Poulie',
    category: 'core',
    muscleGroup: 'abs',
    statType: 'endurance',
    xpMultiplier: 0.8,
    description: 'Crunch avec résistance',
    difficulty: 'intermediate',
    equipment: 'machine'
  },

  // ═══════════════════════════════════════════════════════════
  // CATÉGORIE: CARDIO
  // ═══════════════════════════════════════════════════════════
  {
    uuid: 'ex-running',
    name: 'Course à Pied',
    category: 'cardio',
    muscleGroup: 'full-body',
    statType: 'endurance',
    xpMultiplier: 0.5,
    description: 'Cardio classique (XP basé sur la durée)',
    difficulty: 'beginner',
    equipment: 'none'
  },
  {
    uuid: 'ex-rowing-machine',
    name: 'Rameur',
    category: 'cardio',
    muscleGroup: 'full-body',
    statType: 'endurance',
    xpMultiplier: 0.8,
    description: 'Cardio complet',
    difficulty: 'intermediate',
    equipment: 'machine'
  },
  {
    uuid: 'ex-bike',
    name: 'Vélo',
    category: 'cardio',
    muscleGroup: 'legs',
    statType: 'endurance',
    xpMultiplier: 0.6,
    description: 'Cardio faible impact',
    difficulty: 'beginner',
    equipment: 'machine'
  }
];

/**
 * Fonction pour pré-charger les exercices dans IndexedDB
 */
async function seedExercises() {
  if (!window.fitnessDB || !window.fitnessDB.db) {
    console.error('❌ IndexedDB non initialisée');
    return;
  }

  console.log('🌱 Chargement de la bibliothèque d\'exercices...');

  try {
    // Vérifier si les exercices sont déjà chargés
    const existingExercises = await window.fitnessDB.getAll('exercises');

    if (existingExercises.length > 0) {
      console.log('✅ Exercices déjà chargés (' + existingExercises.length + ')');
      return;
    }

    // Charger chaque exercice
    for (const exercise of EXERCISE_LIBRARY) {
      await window.fitnessDB.put('exercises', {
        ...exercise,
        isCustom: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    console.log(`✅ ${EXERCISE_LIBRARY.length} exercices chargés avec succès !`);
  } catch (error) {
    console.error('❌ Erreur lors du chargement des exercices:', error);
  }
}

// Export pour utilisation
if (typeof window !== 'undefined') {
  window.EXERCISE_LIBRARY = EXERCISE_LIBRARY;
  window.seedExercises = seedExercises;
}