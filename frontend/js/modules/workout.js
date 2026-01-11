/**
 * FitnessRPG - Module Workout
 * Gestion des séances d'entraînement
 */

class WorkoutManager {
  constructor() {
    this.currentWorkout = null;
    this.currentExercise = null;
    this.startTime = null;
    this.listeners = new Map();
  }

  // ═══════════════════════════════════════════════════════════
  // CRÉATION DE SÉANCE
  // ═══════════════════════════════════════════════════════════

  /**
   * Démarre une nouvelle séance
   */
  async startWorkout(name = null) {
    this.currentWorkout = {
      uuid: Helpers.generateUUID(),
      name: name || `Séance ${Helpers.formatDateShort(new Date())}`,
      workoutDate: new Date().toISOString(),
      durationMinutes: 0,
      totalVolume: 0,
      xpEarned: 0,
      isCompleted: false,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      exercises: [] // Exercices en cours
    };

    this.startTime = Date.now();

    // Sauvegarder dans IndexedDB
    await window.fitnessDB.put('workouts', this.currentWorkout);

    console.log('✅ Séance démarrée:', this.currentWorkout.name);
    this.emit('workout-started', this.currentWorkout);

    return this.currentWorkout;
  }

  /**
   * Ajoute un exercice à la séance en cours
   */
  async addExercise(exerciseUuid) {
    if (!this.currentWorkout) {
      throw new Error('Aucune séance en cours');
    }

    // Récupérer l'exercice
    const exercise = await window.fitnessDB.get('exercises', exerciseUuid);
    if (!exercise) {
      throw new Error('Exercice introuvable');
    }

    // Créer le WorkoutExercise
    const workoutExercise = {
      uuid: Helpers.generateUUID(),
      workoutUuid: this.currentWorkout.uuid,
      exerciseUuid: exercise.uuid,
      orderIndex: this.currentWorkout.exercises.length,
      totalSets: 0,
      totalReps: 0,
      totalVolume: 0,
      estimated1rm: null,
      notes: '',
      createdAt: new Date().toISOString(),
      sets: [], // Séries en cours
      exercise: exercise // Référence pour l'UI
    };

    // Ajouter à la séance
    this.currentWorkout.exercises.push(workoutExercise);
    this.currentExercise = workoutExercise;

    // Sauvegarder dans IndexedDB
    await window.fitnessDB.put('workoutExercises', workoutExercise);

    console.log('✅ Exercice ajouté:', exercise.name);
    this.emit('exercise-added', { workoutExercise, exercise });

    return workoutExercise;
  }

  /**
   * Ajoute une série à l'exercice en cours
   */
  async addSet(weight, reps, options = {}) {
    if (!this.currentExercise) {
      throw new Error('Aucun exercice en cours');
    }

    const {
      rpe = null,
      isWarmup = false,
      restSeconds = null
    } = options;

    // Calculer le volume et le 1RM
    const volume = window.RPG_FORMULAS.calculateVolume(weight, reps);
    const estimated1rm = window.RPG_FORMULAS.calculate1RM(weight, reps);

    // Vérifier si c'est un PR (Boss Battle)
    const isPR = await window.RPGManager.isBossBattle(
      this.currentExercise.exerciseUuid,
      weight,
      reps
    );

    // Créer la série
    const set = {
      uuid: Helpers.generateUUID(),
      workoutExerciseUuid: this.currentExercise.uuid,
      setNumber: this.currentExercise.sets.length + 1,
      weight_kg: weight,
      reps: reps,
      rpe: rpe,
      volume: volume,
      estimated_1rm: estimated1rm,
      isWarmup: isWarmup,
      isPR: isPR,
      restSeconds: restSeconds,
      createdAt: new Date().toISOString()
    };

    // Ajouter à l'exercice
    this.currentExercise.sets.push(set);

    // Mettre à jour les totaux de l'exercice
    if (!isWarmup) {
      this.currentExercise.totalSets++;
      this.currentExercise.totalReps += reps;
      this.currentExercise.totalVolume += volume;

      // Mettre à jour le meilleur 1RM
      if (!this.currentExercise.estimated1rm || estimated1rm > this.currentExercise.estimated1rm) {
        this.currentExercise.estimated1rm = estimated1rm;
      }
    }

    // Sauvegarder dans IndexedDB
    await window.fitnessDB.put('exerciseSets', set);
    await window.fitnessDB.put('workoutExercises', this.currentExercise);

    // Ajouter à la queue de synchronisation
    await window.fitnessDB.addToSyncQueue('exercise_set', set.uuid, 'create', set);

    console.log('✅ Série ajoutée:', `${weight}kg × ${reps}`);

    // Si c'est un PR, déclencher le Boss Battle
    if (isPR && !isWarmup) {
      window.RPGManager.triggerBossBattle(this.currentExercise.exercise.name);
    }

    this.emit('set-added', { set, exercise: this.currentExercise });

    return set;
  }

  // ═══════════════════════════════════════════════════════════
  // FINALISATION DE SÉANCE
  // ═══════════════════════════════════════════════════════════

  /**
   * Termine la séance en cours
   */
  async completeWorkout() {
    if (!this.currentWorkout) {
      throw new Error('Aucune séance en cours');
    }

    // Calculer la durée
    const durationMs = Date.now() - this.startTime;
    this.currentWorkout.durationMinutes = Math.round(durationMs / 60000);

    // Calculer le volume et l'XP totaux
    let totalVolume = 0;
    let totalXP = 0;

    for (const exercise of this.currentWorkout.exercises) {
      totalVolume += exercise.totalVolume;

      // Calculer l'XP pour cet exercice
      const xpMultiplier = exercise.exercise.xpMultiplier || 1.0;
      const exerciseXP = window.RPG_FORMULAS.calculateXP(exercise.totalVolume, xpMultiplier);
      totalXP += exerciseXP;
    }

    this.currentWorkout.totalVolume = totalVolume;
    this.currentWorkout.xpEarned = totalXP;
    this.currentWorkout.isCompleted = true;
    this.currentWorkout.updatedAt = new Date().toISOString();

    // Sauvegarder dans IndexedDB
    await window.fitnessDB.put('workouts', this.currentWorkout);

    // Ajouter à la queue de synchronisation
    await window.fitnessDB.addToSyncQueue(
      'workout',
      this.currentWorkout.uuid,
      'create',
      this.currentWorkout
    );

    // Ajouter l'XP à l'utilisateur
    const xpResult = await window.RPGManager.addXP(totalXP, 'workout');

    console.log('✅ Séance terminée:', {
      volume: totalVolume,
      xp: totalXP,
      duration: this.currentWorkout.durationMinutes,
      levelUp: xpResult.hasLeveledUp
    });

    this.emit('workout-completed', {
      workout: this.currentWorkout,
      xpResult
    });

    // Réinitialiser
    const completedWorkout = this.currentWorkout;
    this.currentWorkout = null;
    this.currentExercise = null;
    this.startTime = null;

    return completedWorkout;
  }

  /**
   * Annule la séance en cours
   */
  async cancelWorkout() {
    if (!this.currentWorkout) {
      throw new Error('Aucune séance en cours');
    }

    // Supprimer de IndexedDB
    await window.fitnessDB.delete('workouts', this.currentWorkout.uuid);

    // Supprimer les exercices et séries associés
    for (const exercise of this.currentWorkout.exercises) {
      await window.fitnessDB.delete('workoutExercises', exercise.uuid);

      for (const set of exercise.sets) {
        await window.fitnessDB.delete('exerciseSets', set.uuid);
      }
    }

    console.log('❌ Séance annulée');
    this.emit('workout-cancelled');

    this.currentWorkout = null;
    this.currentExercise = null;
    this.startTime = null;
  }

  // ═══════════════════════════════════════════════════════════
  // ÉDITION
  // ═══════════════════════════════════════════════════════════

  /**
   * Modifie une série existante
   */
  async updateSet(setUuid, updates) {
    const set = await window.fitnessDB.get('exerciseSets', setUuid);
    if (!set) {
      throw new Error('Série introuvable');
    }

    // Appliquer les modifications
    Object.assign(set, updates);

    // Recalculer les valeurs dérivées si nécessaire
    if (updates.weight_kg || updates.reps) {
      set.volume = window.RPG_FORMULAS.calculateVolume(set.weight_kg, set.reps);
      set.estimated_1rm = window.RPG_FORMULAS.calculate1RM(set.weight_kg, set.reps);
    }

    // Sauvegarder
    await window.fitnessDB.put('exerciseSets', set);
    await window.fitnessDB.addToSyncQueue('exercise_set', set.uuid, 'update', set);

    console.log('✅ Série modifiée');
    this.emit('set-updated', set);

    return set;
  }

  /**
   * Supprime une série
   */
  async deleteSet(setUuid) {
    const set = await window.fitnessDB.get('exerciseSets', setUuid);
    if (!set) {
      throw new Error('Série introuvable');
    }

    // Supprimer
    await window.fitnessDB.delete('exerciseSets', setUuid);
    await window.fitnessDB.addToSyncQueue('exercise_set', setUuid, 'delete', {});

    console.log('✅ Série supprimée');
    this.emit('set-deleted', set);

    return set;
  }

  // ═══════════════════════════════════════════════════════════
  // RÉCUPÉRATION DE DONNÉES
  // ═══════════════════════════════════════════════════════════

  /**
   * Récupère toutes les séances
   */
  async getAllWorkouts(options = {}) {
    const {
      limit = null,
      completedOnly = false,
      sortBy = 'workoutDate',
      sortOrder = 'desc'
    } = options;

    let workouts = await window.fitnessDB.getAll('workouts');

    // Filtrer
    if (completedOnly) {
      workouts = workouts.filter(w => w.isCompleted);
    }

    // Trier
    workouts = Helpers.sortBy(workouts, sortBy, sortOrder);

    // Limiter
    if (limit) {
      workouts = workouts.slice(0, limit);
    }

    return workouts;
  }

  /**
   * Récupère une séance avec tous ses détails
   */
  async getWorkoutDetails(workoutUuid) {
    const workout = await window.fitnessDB.get('workouts', workoutUuid);
    if (!workout) return null;

    // Récupérer les exercices
    const workoutExercises = await window.fitnessDB.getAllByIndex(
      'workoutExercises',
      'workoutUuid',
      workoutUuid
    );

    // Enrichir chaque exercice avec ses séries
    const enrichedExercises = await Promise.all(
      workoutExercises.map(async (we) => {
        const exercise = await window.fitnessDB.get('exercises', we.exerciseUuid);
        const sets = await window.fitnessDB.getAllByIndex(
          'exerciseSets',
          'workoutExerciseUuid',
          we.uuid
        );

        return {
          ...we,
          exercise,
          sets: Helpers.sortBy(sets, 'setNumber', 'asc')
        };
      })
    );

    return {
      ...workout,
      exercises: Helpers.sortBy(enrichedExercises, 'orderIndex', 'asc')
    };
  }

  /**
   * Récupère l'historique d'un exercice
   */
  async getExerciseHistory(exerciseUuid, limit = 10) {
    const allWorkoutExercises = await window.fitnessDB.getAll('workoutExercises');

    const history = allWorkoutExercises
      .filter(we => we.exerciseUuid === exerciseUuid)
      .map(async (we) => {
        const workout = await window.fitnessDB.get('workouts', we.workoutUuid);
        const sets = await window.fitnessDB.getAllByIndex(
          'exerciseSets',
          'workoutExerciseUuid',
          we.uuid
        );

        return {
          date: workout.workoutDate,
          totalVolume: we.totalVolume,
          best1RM: we.estimated1rm,
          sets: sets.filter(s => !s.isWarmup)
        };
      });

    const resolved = await Promise.all(history);
    return Helpers.sortBy(resolved, 'date', 'desc').slice(0, limit);
  }

  // ═══════════════════════════════════════════════════════════
  // STATISTIQUES
  // ═══════════════════════════════════════════════════════════

  /**
   * Calcule les stats d'une séance
   */
  calculateWorkoutStats(workout) {
    return {
      totalExercises: workout.exercises.length,
      totalSets: workout.exercises.reduce((sum, e) => sum + e.totalSets, 0),
      totalReps: workout.exercises.reduce((sum, e) => sum + e.totalReps, 0),
      totalVolume: workout.totalVolume,
      xpEarned: workout.xpEarned,
      duration: workout.durationMinutes,
      avgVolumePerExercise: workout.exercises.length > 0
        ? workout.totalVolume / workout.exercises.length
        : 0
    };
  }

  /**
   * Récupère les stats globales
   */
  async getGlobalStats() {
    const workouts = await this.getAllWorkouts({ completedOnly: true });

    const totalWorkouts = workouts.length;
    const totalVolume = workouts.reduce((sum, w) => sum + w.totalVolume, 0);
    const totalXP = workouts.reduce((sum, w) => sum + w.xpEarned, 0);
    const totalDuration = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);

    const avgVolume = totalWorkouts > 0 ? totalVolume / totalWorkouts : 0;
    const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

    return {
      totalWorkouts,
      totalVolume,
      totalXP,
      totalDuration,
      avgVolume,
      avgDuration
    };
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT SYSTEM
  // ═══════════════════════════════════════════════════════════

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => callback(data));

    // Émettre aussi un événement global
    window.dispatchEvent(new CustomEvent(`workout:${event}`, { detail: data }));
  }
}

// Export d'une instance unique (Singleton)
const workoutManager = new WorkoutManager();

// Export global
if (typeof window !== 'undefined') {
  window.WorkoutManager = workoutManager;
}