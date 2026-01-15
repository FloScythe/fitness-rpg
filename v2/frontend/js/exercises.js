/**
 * Exercises - Liste d'exercices prédéfinis
 */

const Exercises = {
  // Catégories d'exercices
  categories: {
    chest: { name: 'Pectoraux', icon: '💪', xpMultiplier: 1.2 },
    back: { name: 'Dos', icon: '🦾', xpMultiplier: 1.3 },
    legs: { name: 'Jambes', icon: '🦵', xpMultiplier: 1.5 },
    shoulders: { name: 'Épaules', icon: '🏋️', xpMultiplier: 1.1 },
    arms: { name: 'Bras', icon: '💪', xpMultiplier: 1.0 },
    core: { name: 'Abdos/Core', icon: '🔥', xpMultiplier: 1.1 },
    cardio: { name: 'Cardio', icon: '🏃', xpMultiplier: 1.0 }
  },

  // Liste d'exercices prédéfinis
  list: [
    // Pectoraux
    { id: 'bench-press', name: 'Développé couché', category: 'chest', type: 'weight' },
    { id: 'incline-bench', name: 'Développé incliné', category: 'chest', type: 'weight' },
    { id: 'dumbbell-press', name: 'Développé haltères', category: 'chest', type: 'weight' },
    { id: 'push-ups', name: 'Pompes', category: 'chest', type: 'reps' },
    { id: 'dips', name: 'Dips', category: 'chest', type: 'reps' },
    { id: 'cable-fly', name: 'Écartés poulie', category: 'chest', type: 'weight' },

    // Dos
    { id: 'deadlift', name: 'Soulevé de terre', category: 'back', type: 'weight' },
    { id: 'pull-ups', name: 'Tractions', category: 'back', type: 'reps' },
    { id: 'barbell-row', name: 'Rowing barre', category: 'back', type: 'weight' },
    { id: 'lat-pulldown', name: 'Tirage vertical', category: 'back', type: 'weight' },
    { id: 'dumbbell-row', name: 'Rowing haltère', category: 'back', type: 'weight' },
    { id: 't-bar-row', name: 'Rowing T-bar', category: 'back', type: 'weight' },

    // Jambes
    { id: 'squat', name: 'Squat', category: 'legs', type: 'weight' },
    { id: 'front-squat', name: 'Squat avant', category: 'legs', type: 'weight' },
    { id: 'leg-press', name: 'Presse à cuisses', category: 'legs', type: 'weight' },
    { id: 'lunges', name: 'Fentes', category: 'legs', type: 'weight' },
    { id: 'leg-curl', name: 'Leg curl', category: 'legs', type: 'weight' },
    { id: 'leg-extension', name: 'Leg extension', category: 'legs', type: 'weight' },
    { id: 'calf-raise', name: 'Mollets debout', category: 'legs', type: 'weight' },

    // Épaules
    { id: 'overhead-press', name: 'Développé militaire', category: 'shoulders', type: 'weight' },
    { id: 'dumbbell-press', name: 'Développé haltères', category: 'shoulders', type: 'weight' },
    { id: 'lateral-raise', name: 'Élévations latérales', category: 'shoulders', type: 'weight' },
    { id: 'front-raise', name: 'Élévations frontales', category: 'shoulders', type: 'weight' },
    { id: 'shrugs', name: 'Shrugs (trapèzes)', category: 'shoulders', type: 'weight' },

    // Bras
    { id: 'barbell-curl', name: 'Curl barre', category: 'arms', type: 'weight' },
    { id: 'dumbbell-curl', name: 'Curl haltères', category: 'arms', type: 'weight' },
    { id: 'hammer-curl', name: 'Curl marteau', category: 'arms', type: 'weight' },
    { id: 'tricep-dips', name: 'Dips triceps', category: 'arms', type: 'reps' },
    { id: 'tricep-extension', name: 'Extension triceps', category: 'arms', type: 'weight' },
    { id: 'skull-crushers', name: 'Barre au front', category: 'arms', type: 'weight' },

    // Abdos/Core
    { id: 'plank', name: 'Planche', category: 'core', type: 'duration' },
    { id: 'crunches', name: 'Crunch', category: 'core', type: 'reps' },
    { id: 'leg-raises', name: 'Relevés de jambes', category: 'core', type: 'reps' },
    { id: 'russian-twist', name: 'Russian twist', category: 'core', type: 'reps' },
    { id: 'ab-wheel', name: 'Roue abdominale', category: 'core', type: 'reps' },

    // Cardio
    { id: 'running', name: 'Course', category: 'cardio', type: 'duration' },
    { id: 'cycling', name: 'Vélo', category: 'cardio', type: 'duration' },
    { id: 'rowing', name: 'Rameur', category: 'cardio', type: 'duration' },
    { id: 'jump-rope', name: 'Corde à sauter', category: 'cardio', type: 'duration' },
    { id: 'burpees', name: 'Burpees', category: 'cardio', type: 'reps' }
  ],

  /**
   * Obtenir un exercice par ID
   */
  getById(id) {
    return this.list.find(ex => ex.id === id);
  },

  /**
   * Obtenir les exercices par catégorie
   */
  getByCategory(category) {
    return this.list.filter(ex => ex.category === category);
  },

  /**
   * Rechercher des exercices
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.list.filter(ex =>
      ex.name.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Calculer l'XP d'une série
   *
   * Formule pondérée :
   * - Type poids : (Poids × Reps × Multiplier catégorie) / 10
   * - Type reps : Reps × 5 × Multiplier catégorie
   * - Type durée : Secondes × Multiplier catégorie
   */
  calculateSetXP(exercise, setData) {
    const category = this.categories[exercise.category];
    const multiplier = category ? category.xpMultiplier : 1.0;

    if (exercise.type === 'weight' && setData.weight && setData.reps) {
      // XP = (Poids × Reps × Multiplier) / 10
      return Math.round((setData.weight * setData.reps * multiplier) / 10);
    }

    if (exercise.type === 'reps' && setData.reps) {
      // XP = Reps × 5 × Multiplier
      return Math.round(setData.reps * 5 * multiplier);
    }

    if (exercise.type === 'duration' && setData.duration) {
      // XP = Secondes × Multiplier
      return Math.round(setData.duration * multiplier);
    }

    return 0;
  }
};
