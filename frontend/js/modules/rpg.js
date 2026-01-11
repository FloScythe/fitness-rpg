/**
 * FitnessRPG - Module RPG
 * Gestion de l'XP, des niveaux et des achievements
 */

class RPGManager {
  constructor() {
    this.user = null;
    this.listeners = new Map();
  }

  // ═══════════════════════════════════════════════════════════
  // INITIALISATION
  // ═══════════════════════════════════════════════════════════

  async init() {
    await this.loadUser();
    console.log('✅ RPGManager initialisé');
  }

  async loadUser() {
    const users = await window.fitnessDB.getAll('user');

    if (users.length === 0) {
      // Créer un utilisateur par défaut
      this.user = {
        uuid: Helpers.generateUUID(),
        username: 'Aventurier',
        totalXP: 0,
        currentLevel: 1,
        createdAt: new Date().toISOString(),
        lastSync: null
      };

      await window.fitnessDB.put('user', this.user);
    } else {
      this.user = users[0];
    }

    return this.user;
  }

  // ═══════════════════════════════════════════════════════════
  // GESTION DE L'XP
  // ═══════════════════════════════════════════════════════════

  /**
   * Ajoute de l'XP à l'utilisateur
   */
  async addXP(amount, source = 'workout') {
    if (!this.user) await this.loadUser();

    const oldXP = this.user.totalXP;
    const oldLevel = this.user.currentLevel;

    // Ajouter l'XP
    this.user.totalXP += amount;

    // Recalculer le niveau
    const levelData = window.RPG_FORMULAS.calculateLevel(this.user.totalXP);
    this.user.currentLevel = levelData.level;

    // Sauvegarder
    await window.fitnessDB.put('user', this.user);

    // Vérifier si level up
    const hasLeveledUp = levelData.level > oldLevel;

    if (hasLeveledUp) {
      await this.handleLevelUp(oldLevel, levelData.level);
    }

    // Émettre un événement
    this.emit('xp-gained', {
      amount,
      source,
      oldXP,
      newXP: this.user.totalXP,
      hasLeveledUp
    });

    return {
      xpGained: amount,
      newTotal: this.user.totalXP,
      levelData,
      hasLeveledUp
    };
  }

  /**
   * Calcule l'XP gagné pour un exercice
   */
  calculateWorkoutXP(workoutData) {
    let totalXP = 0;

    workoutData.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (!set.isWarmup) {
          const volume = window.RPG_FORMULAS.calculateVolume(set.weight, set.reps);
          const xp = window.RPG_FORMULAS.calculateXP(volume, exercise.xpMultiplier);
          totalXP += xp;
        }
      });
    });

    return totalXP;
  }

  // ═══════════════════════════════════════════════════════════
  // GESTION DES NIVEAUX
  // ═══════════════════════════════════════════════════════════

  /**
   * Récupère les données du niveau actuel
   */
  getCurrentLevelData() {
    if (!this.user) return null;
    return window.RPG_FORMULAS.calculateLevel(this.user.totalXP);
  }

  /**
   * Gère le passage de niveau
   */
  async handleLevelUp(oldLevel, newLevel) {
    console.log(`🎉 LEVEL UP ! ${oldLevel} → ${newLevel}`);

    // Vibration de célébration
    try {
      if (Helpers) {
        Helpers.vibrate([100, 50, 100, 50, 100]);
      }
    } catch (error) {
      // Silencieux
    }

    // Notification
    if (window.NotificationManager) {
      window.NotificationManager.show({
        type: 'success',
        title: `🎉 LEVEL UP !`,
        message: `Vous êtes maintenant niveau ${newLevel} !`,
        duration: 5000,
        sound: true
      });
    }

    // Vérifier les achievements débloqués
    await this.checkAchievements();

    // Émettre un événement
    this.emit('level-up', { oldLevel, newLevel });

    return { oldLevel, newLevel };
  }

  // ═══════════════════════════════════════════════════════════
  // ACHIEVEMENTS (Succès)
  // ═══════════════════════════════════════════════════════════

  /**
   * Vérifie et débloque les achievements
   */
  async checkAchievements() {
    if (!this.user) await this.loadUser();

    const unlockedAchievements = [];

    // Achievement: Premier pas (première séance)
    const totalWorkouts = await this.getTotalWorkouts();
    if (totalWorkouts === 1) {
      unlockedAchievements.push({
        id: 'first-workout',
        title: '🏃 Premier Pas',
        description: 'Complétez votre première séance',
        rarity: 'common'
      });
    }

    // Achievement: Dédication (10 séances)
    if (totalWorkouts === 10) {
      unlockedAchievements.push({
        id: 'ten-workouts',
        title: '💪 Dédication',
        description: 'Complétez 10 séances',
        rarity: 'uncommon'
      });
    }

    // Achievement: Athlète (50 séances)
    if (totalWorkouts === 50) {
      unlockedAchievements.push({
        id: 'fifty-workouts',
        title: '🏆 Athlète',
        description: 'Complétez 50 séances',
        rarity: 'rare'
      });
    }

    // Achievement: Paliers d'XP
    const xpMilestones = [1000, 5000, 10000, 25000, 50000, 100000];
    for (const milestone of xpMilestones) {
      if (this.user.totalXP >= milestone && !this.hasAchievement(`xp-${milestone}`)) {
        unlockedAchievements.push({
          id: `xp-${milestone}`,
          title: `⭐ ${Helpers.formatNumber(milestone)} XP`,
          description: `Gagnez ${Helpers.formatNumber(milestone)} XP au total`,
          rarity: milestone >= 50000 ? 'legendary' : milestone >= 10000 ? 'epic' : 'rare'
        });
      }
    }

    // Sauvegarder les achievements débloqués
    for (const achievement of unlockedAchievements) {
      await this.unlockAchievement(achievement);
    }

    return unlockedAchievements;
  }

  /**
   * Débloque un achievement
   */
  async unlockAchievement(achievement) {
    // Sauvegarder dans IndexedDB (table achievements à créer si nécessaire)
    console.log('🏅 Achievement débloqué:', achievement.title);

    // Notification
    if (window.NotificationManager) {
      window.NotificationManager.show({
        type: 'success',
        title: '🏅 Achievement débloqué !',
        message: achievement.title,
        duration: 5000
      });
    }

    this.emit('achievement-unlocked', achievement);
  }

  /**
   * Vérifie si un achievement est déjà débloqué
   */
  hasAchievement(achievementId) {
    // TODO: Vérifier dans IndexedDB
    return false;
  }

  // ═══════════════════════════════════════════════════════════
  // STATS RPG
  // ═══════════════════════════════════════════════════════════

  /**
   * Calcule les stats RPG (Force, Endurance)
   */
  async calculateRPGStats() {
    const workouts = await window.fitnessDB.getAll('workouts');
    const completedWorkouts = workouts.filter(w => w.isCompleted);

    // Récupérer les 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentWorkouts = completedWorkouts.filter(w =>
      new Date(w.workoutDate) >= thirtyDaysAgo
    );

    // Préparer les données pour les formules
    const workoutsData = await Promise.all(recentWorkouts.map(async (w) => {
      const exercises = await this.getWorkoutExercises(w.uuid);
      return {
        totalVolume: w.totalVolume,
        exercises: exercises.map(e => ({
          statType: e.exercise.statType,
          best1RM: e.estimated1rm
        }))
      };
    }));

    // Calculer les stats
    const strength = window.RPG_FORMULAS.calculateStrengthStat(workoutsData);
    const endurance = window.RPG_FORMULAS.calculateEnduranceStat(workoutsData);

    return {
      strength,
      endurance,
      level: this.user.currentLevel,
      totalXP: this.user.totalXP
    };
  }

  /**
   * Récupère les exercices d'une séance
   */
  async getWorkoutExercises(workoutUuid) {
    const allExercises = await window.fitnessDB.getAll('workoutExercises');
    const workoutExercises = allExercises.filter(we => we.workoutUuid === workoutUuid);

    // Enrichir avec les données de l'exercice
    const enriched = await Promise.all(workoutExercises.map(async (we) => {
      const exercise = await window.fitnessDB.get('exercises', we.exerciseUuid);
      return { ...we, exercise };
    }));

    return enriched;
  }

  // ═══════════════════════════════════════════════════════════
  // BOSS BATTLE (PR Detection)
  // ═══════════════════════════════════════════════════════════

  /**
   * Vérifie si une série est un Boss Battle (PR)
   */
  async isBossBattle(exerciseUuid, weight, reps) {
    // Calculer le 1RM actuel
    const current1RM = window.RPG_FORMULAS.calculate1RM(weight, reps);

    // Récupérer le meilleur 1RM précédent pour cet exercice
    const previous1RM = await this.getBest1RM(exerciseUuid);

    // C'est un PR si c'est mieux que le précédent
    return window.RPG_FORMULAS.isPR(current1RM, previous1RM);
  }

  /**
   * Récupère le meilleur 1RM pour un exercice
   */
  async getBest1RM(exerciseUuid) {
    const allWorkoutExercises = await window.fitnessDB.getAll('workoutExercises');
    const exerciseHistory = allWorkoutExercises.filter(we =>
      we.exerciseUuid === exerciseUuid && we.estimated1rm
    );

    if (exerciseHistory.length === 0) return null;

    return Math.max(...exerciseHistory.map(we => we.estimated1rm));
  }

  /**
   * Déclenche une animation de Boss Battle
   */
  triggerBossBattle(exerciseName) {
    console.log('⚔️ BOSS BATTLE:', exerciseName);

    // Vibration intense
    try {
      if (Helpers) {
        Helpers.vibrate([200, 100, 200, 100, 400]);
      }
    } catch (error) {
      // Silencieux
    }

    // Notification spéciale
    if (window.NotificationManager) {
      window.NotificationManager.show({
        type: 'warning',
        title: '⚔️ BOSS BATTLE !',
        message: `Nouveau record sur ${exerciseName} !`,
        duration: 5000,
        sound: true
      });
    }

    this.emit('boss-battle', { exerciseName });
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  async getTotalWorkouts() {
    const workouts = await window.fitnessDB.getAll('workouts');
    return workouts.filter(w => w.isCompleted).length;
  }

  async getTotalVolume() {
    const workouts = await window.fitnessDB.getAll('workouts');
    return workouts
      .filter(w => w.isCompleted)
      .reduce((sum, w) => sum + (w.totalVolume || 0), 0);
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
  }
}

// Export d'une instance unique (Singleton)
const rpgManager = new RPGManager();

// Export global
if (typeof window !== 'undefined') {
  window.RPGManager = rpgManager;
}