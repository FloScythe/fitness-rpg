/**
 * FitnessRPG - Module Smart Coach
 * IA d'entraînement et suggestions intelligentes
 */

class SmartCoach {
  constructor() {
    this.recommendations = [];
  }

  // ═══════════════════════════════════════════════════════════
  // SURCHARGE PROGRESSIVE
  // ═══════════════════════════════════════════════════════════

  /**
   * Suggère le poids/reps pour la prochaine série
   */
  async suggestNextSet(exerciseUuid, currentSet = null) {
    // Récupérer l'historique de l'exercice
    const history = await window.WorkoutManager.getExerciseHistory(exerciseUuid, 5);

    if (history.length === 0 || !currentSet) {
      // Pas d'historique : suggérer des valeurs par défaut
      return {
        suggestedWeight: 20,
        suggestedReps: 10,
        reason: 'Première fois sur cet exercice'
      };
    }

    // Récupérer la dernière séance
    const lastSession = history[0];
    const lastSet = lastSession.sets[lastSession.sets.length - 1];

    if (!lastSet) {
      return {
        suggestedWeight: 20,
        suggestedReps: 10,
        reason: 'Pas d\'historique de série'
      };
    }

    // Utiliser la formule de progression
    const exercise = await window.fitnessDB.get('exercises', exerciseUuid);
    const equipment = this.getEquipmentType(exercise);

    const progression = window.RPG_FORMULAS.suggestProgression(
      {
        weight: lastSet.weight_kg,
        reps: lastSet.reps,
        rpe: lastSet.rpe
      },
      equipment
    );

    return progression;
  }

  /**
   * Pré-remplit les champs pour la prochaine série
   */
  async prefillSet(exerciseUuid, setNumber) {
    const history = await window.WorkoutManager.getExerciseHistory(exerciseUuid, 1);

    if (history.length === 0) {
      return null;
    }

    const lastSession = history[0];
    const correspondingSet = lastSession.sets.find(s => s.setNumber === setNumber);

    if (!correspondingSet) {
      // Prendre la dernière série comme référence
      const lastSet = lastSession.sets[lastSession.sets.length - 1];
      return await this.suggestNextSet(exerciseUuid, lastSet);
    }

    // Suggérer une légère augmentation
    return await this.suggestNextSet(exerciseUuid, correspondingSet);
  }

  // ═══════════════════════════════════════════════════════════
  // DÉTECTION DE FATIGUE & DELOAD
  // ═══════════════════════════════════════════════════════════

  /**
   * Analyse les performances récentes
   */
  async analyzePerformance(exerciseUuid) {
    const history = await window.WorkoutManager.getExerciseHistory(exerciseUuid, 5);

    if (history.length < 3) {
      return {
        trend: 'insufficient-data',
        recommendation: null
      };
    }

    // Analyser la tendance du volume
    const volumes = history.map(h => h.totalVolume);
    const recentVolumes = volumes.slice(0, 3);

    // Vérifier si le volume diminue
    let decreasingCount = 0;
    for (let i = 1; i < recentVolumes.length; i++) {
      if (recentVolumes[i] < recentVolumes[i - 1]) {
        decreasingCount++;
      }
    }

    if (decreasingCount >= 2) {
      return {
        trend: 'decreasing',
        recommendation: 'deload',
        message: 'Vos performances baissent. Envisagez un déchargement (deload).'
      };
    }

    // Analyser la tendance du 1RM
    const best1RMs = history.map(h => h.best1RM).filter(rm => rm);
    if (best1RMs.length >= 3) {
      const recent1RMs = best1RMs.slice(0, 3);
      const isStagnating = recent1RMs.every((rm, i) =>
        i === 0 || Math.abs(rm - recent1RMs[i - 1]) < 2
      );

      if (isStagnating) {
        return {
          trend: 'stagnating',
          recommendation: 'variation',
          message: 'Vos performances stagnent. Essayez une variante de l\'exercice.'
        };
      }
    }

    return {
      trend: 'improving',
      recommendation: 'continue',
      message: 'Vous progressez bien ! Continuez comme ça.'
    };
  }

  /**
   * Suggère un poids de deload
   */
  async suggestDeloadWeight(exerciseUuid) {
    const history = await window.WorkoutManager.getExerciseHistory(exerciseUuid, 1);

    if (history.length === 0) {
      return null;
    }

    const lastSession = history[0];
    const workingSets = lastSession.sets.filter(s => !s.isWarmup);

    if (workingSets.length === 0) {
      return null;
    }

    const avgWeight = Helpers.average(workingSets.map(s => s.weight_kg));
    const deloadWeight = window.RPG_FORMULAS.calculateDeloadWeight(avgWeight);

    return {
      originalWeight: avgWeight,
      deloadWeight: deloadWeight,
      reduction: Helpers.formatPercent((avgWeight - deloadWeight) / avgWeight, 0)
    };
  }

  // ═══════════════════════════════════════════════════════════
  // RECOMMANDATIONS GÉNÉRALES
  // ═══════════════════════════════════════════════════════════

  /**
   * Génère des recommandations personnalisées
   */
  async generateRecommendations() {
    this.recommendations = [];

    // 1. Vérifier la fréquence d'entraînement
    await this.checkWorkoutFrequency();

    // 2. Vérifier la fatigue globale
    await this.checkGlobalFatigue();

    // 3. Suggérer des exercices peu pratiqués
    await this.suggestUnusedExercises();

    // 4. Vérifier les déséquilibres musculaires
    await this.checkMuscleBalance();

    return this.recommendations;
  }

  /**
   * Vérifie la fréquence d'entraînement
   */
  async checkWorkoutFrequency() {
    const recentWorkouts = await window.WorkoutManager.getAllWorkouts({
      limit: 10,
      completedOnly: true
    });

    if (recentWorkouts.length === 0) {
      this.recommendations.push({
        type: 'frequency',
        priority: 'high',
        title: 'Commencez votre aventure !',
        message: 'Lancez votre première séance pour gagner de l\'XP.',
        action: 'start-workout',
        icon: '🚀'
      });
      return;
    }

    // Vérifier le nombre de jours depuis la dernière séance
    const lastWorkout = recentWorkouts[0];
    const daysSince = Math.floor(
      (Date.now() - new Date(lastWorkout.workoutDate)) / (1000 * 60 * 60 * 24)
    );

    if (daysSince > 5) {
      this.recommendations.push({
        type: 'frequency',
        priority: 'high',
        title: 'Reprenez l\'entraînement !',
        message: `Votre dernière séance remonte à ${daysSince} jours.`,
        action: 'start-workout',
        icon: '💪'
      });
    } else if (daysSince === 0) {
      this.recommendations.push({
        type: 'frequency',
        priority: 'low',
        title: 'Excellent travail !',
        message: 'Vous vous êtes entraîné aujourd\'hui. Pensez au repos !',
        action: null,
        icon: '🎉'
      });
    }
  }

  /**
   * Vérifie la fatigue globale
   */
  async checkGlobalFatigue() {
    const recentWorkouts = await window.WorkoutManager.getAllWorkouts({
      limit: 5,
      completedOnly: true
    });

    if (recentWorkouts.length < 3) {
      return;
    }

    // Vérifier si le volume diminue globalement
    const volumes = recentWorkouts.map(w => w.totalVolume);
    const shouldDeload = window.RPG_FORMULAS.shouldDeload(
      recentWorkouts.map(w => ({ total_volume: w.totalVolume }))
    );

    if (shouldDeload) {
      this.recommendations.push({
        type: 'deload',
        priority: 'high',
        title: '⚠️ Déchargement recommandé',
        message: 'Vos performances baissent. Réduisez les charges de 15% cette semaine.',
        action: 'learn-deload',
        icon: '⚠️'
      });
    }
  }

  /**
   * Suggère des exercices peu pratiqués
   */
  async suggestUnusedExercises() {
    const allExercises = await window.fitnessDB.getAll('exercises');
    const recentWorkouts = await window.WorkoutManager.getAllWorkouts({
      limit: 5,
      completedOnly: true
    });

    // Récupérer les exercices utilisés récemment
    const usedExerciseIds = new Set();
    for (const workout of recentWorkouts) {
      const details = await window.WorkoutManager.getWorkoutDetails(workout.uuid);
      details.exercises.forEach(e => usedExerciseIds.add(e.exerciseUuid));
    }

    // Trouver les exercices non utilisés
    const unusedExercises = allExercises.filter(e => !usedExerciseIds.has(e.uuid));

    if (unusedExercises.length > 0) {
      const randomExercise = unusedExercises[Math.floor(Math.random() * unusedExercises.length)];

      this.recommendations.push({
        type: 'variety',
        priority: 'low',
        title: 'Variez votre entraînement',
        message: `Essayez "${randomExercise.name}" lors de votre prochaine séance.`,
        action: 'add-exercise',
        actionData: { exerciseUuid: randomExercise.uuid },
        icon: '🎯'
      });
    }
  }

  /**
   * Vérifie les déséquilibres musculaires
   */
  async checkMuscleBalance() {
    const recentWorkouts = await window.WorkoutManager.getAllWorkouts({
      limit: 10,
      completedOnly: true
    });

    if (recentWorkouts.length < 5) {
      return;
    }

    // Compter les exercices par catégorie
    const categoryCount = { push: 0, pull: 0, legs: 0, core: 0 };

    for (const workout of recentWorkouts) {
      const details = await window.WorkoutManager.getWorkoutDetails(workout.uuid);
      details.exercises.forEach(e => {
        const category = e.exercise.category;
        if (categoryCount[category] !== undefined) {
          categoryCount[category]++;
        }
      });
    }

    // Détecter les déséquilibres
    const total = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);

    if (total > 0) {
      const pushPullRatio = categoryCount.push / (categoryCount.pull || 1);

      if (pushPullRatio > 1.5) {
        this.recommendations.push({
          type: 'balance',
          priority: 'medium',
          title: 'Équilibrez Push/Pull',
          message: 'Vous faites plus d\'exercices de poussée que de traction. Ajoutez du Pull !',
          action: 'filter-pull',
          icon: '⚖️'
        });
      } else if (pushPullRatio < 0.7) {
        this.recommendations.push({
          type: 'balance',
          priority: 'medium',
          title: 'Équilibrez Push/Pull',
          message: 'Vous faites plus d\'exercices de traction que de poussée. Ajoutez du Push !',
          action: 'filter-push',
          icon: '⚖️'
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TIMER DE REPOS
  // ═══════════════════════════════════════════════════════════

  /**
   * Suggère un temps de repos
   */
  suggestRestTime(exercise, lastSet) {
    const exerciseType = this.getExerciseType(exercise);
    const rpe = lastSet?.rpe;

    return window.RPG_FORMULAS.suggestRestTime(exerciseType, rpe);
  }

  /**
   * Détermine le type d'exercice pour le timer
   */
  getExerciseType(exercise) {
    // Exercices de force (gros mouvements composés)
    const strengthExercises = ['ex-deadlift', 'ex-squat', 'ex-bench-press'];
    if (strengthExercises.includes(exercise.uuid)) {
      return 'strength';
    }

    // Exercices d'endurance
    if (exercise.category === 'cardio' || exercise.statType === 'endurance') {
      return 'endurance';
    }

    // Par défaut : hypertrophie
    return 'hypertrophy';
  }

  /**
   * Détermine le type d'équipement
   */
  getEquipmentType(exercise) {
    const name = exercise.name.toLowerCase();

    if (name.includes('barre') || name.includes('barbell')) {
      return 'barbell';
    }
    if (name.includes('haltère') || name.includes('dumbbell')) {
      return 'dumbbell';
    }
    if (name.includes('machine') || name.includes('presse')) {
      return 'machine';
    }

    return 'bodyweight';
  }

  // ═══════════════════════════════════════════════════════════
  // ANALYSE DE PROGRESSION
  // ═══════════════════════════════════════════════════════════

  /**
   * Calcule les tendances de progression
   */
  async calculateProgressionTrends(exerciseUuid, period = 30) {
    const history = await window.WorkoutManager.getExerciseHistory(exerciseUuid, 10);

    if (history.length < 2) {
      return {
        volumeTrend: 0,
        strengthTrend: 0,
        status: 'insufficient-data'
      };
    }

    // Calculer la tendance du volume
    const volumes = history.map(h => h.totalVolume);
    const volumeChange = Helpers.percentChange(volumes[volumes.length - 1], volumes[0]);

    // Calculer la tendance de force (1RM)
    const strengths = history.map(h => h.best1RM).filter(rm => rm);
    let strengthChange = 0;

    if (strengths.length >= 2) {
      strengthChange = Helpers.percentChange(strengths[strengths.length - 1], strengths[0]);
    }

    // Déterminer le status
    let status = 'stable';
    if (volumeChange > 10 && strengthChange > 5) {
      status = 'excellent';
    } else if (volumeChange > 5 || strengthChange > 2) {
      status = 'good';
    } else if (volumeChange < -10 || strengthChange < -5) {
      status = 'declining';
    }

    return {
      volumeTrend: volumeChange,
      strengthTrend: strengthChange,
      status,
      dataPoints: history.length
    };
  }

  /**
   * Génère un rapport de progression
   */
  async generateProgressReport(exerciseUuid) {
    const exercise = await window.fitnessDB.get('exercises', exerciseUuid);
    const trends = await this.calculateProgressionTrends(exerciseUuid);
    const performance = await this.analyzePerformance(exerciseUuid);

    return {
      exercise,
      trends,
      performance,
      recommendation: this.getProgressRecommendation(trends, performance)
    };
  }

  /**
   * Génère une recommandation basée sur la progression
   */
  getProgressRecommendation(trends, performance) {
    if (trends.status === 'excellent') {
      return {
        type: 'success',
        message: '🔥 Excellente progression ! Continuez sur cette lancée.'
      };
    }

    if (trends.status === 'declining' || performance.trend === 'decreasing') {
      return {
        type: 'warning',
        message: '⚠️ Vos performances baissent. Envisagez un deload ou du repos.'
      };
    }

    if (performance.trend === 'stagnating') {
      return {
        type: 'info',
        message: '💡 Essayez une nouvelle approche : changez le nombre de reps ou le tempo.'
      };
    }

    return {
      type: 'success',
      message: '✅ Vous progressez bien. Continuez !'
    };
  }
}

// Export d'une instance unique (Singleton)
const smartCoach = new SmartCoach();

// Export global
if (typeof window !== 'undefined') {
  window.SmartCoach = smartCoach;
}