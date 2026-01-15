/**
 * FitnessRPG - Sync Queue Manager
 * Gestion de la synchronisation automatique avec le serveur
 */

class SyncQueueManager {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.apiUrl = 'http://localhost:5000/api';
  }

  // ═══════════════════════════════════════════════════════════
  // INITIALISATION
  // ═══════════════════════════════════════════════════════════

  async init() {
    console.log('✅ SyncQueueManager initialisé');

    // Vérifier si un token existe
    const hasToken = !!this.getAuthToken();

    if (hasToken) {
      console.log('🔑 Token d\'authentification détecté');
      // Démarrer la synchronisation automatique toutes les 30 secondes
      this.startAutoSync(30000);
    } else {
      console.log('📴 Mode hors ligne (pas de token)');
      console.log('💡 Connectez-vous pour synchroniser vos données avec le serveur');
    }

    // Synchroniser quand la connexion est rétablie
    window.addEventListener('online', () => {
      if (this.getAuthToken()) {
        console.log('🌐 Connexion rétablie, synchronisation...');
        this.syncAll();
      }
    });

    // Synchroniser avant de fermer la page
    window.addEventListener('beforeunload', () => {
      if (navigator.sendBeacon && this.hasPendingItems() && this.getAuthToken()) {
        // Utiliser sendBeacon pour une sync rapide avant fermeture
        this.syncWithBeacon();
      }
    });
  }

  /**
   * Démarre la synchronisation automatique
   */
  startAutoSync(intervalMs = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (Helpers.isOnline()) {
        await this.syncAll();
      }
    }, intervalMs);

    console.log(`⏱️ Auto-sync démarrée (${intervalMs}ms)`);
  }

  /**
   * Arrête la synchronisation automatique
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Auto-sync arrêtée');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SYNCHRONISATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Synchronise tous les éléments en attente
   */
  async syncAll() {
    if (this.isSyncing) {
      console.log('⏳ Synchronisation déjà en cours...');
      return;
    }

    if (!Helpers.isOnline()) {
      console.log('📴 Hors ligne, synchronisation reportée');
      return;
    }

    const token = this.getAuthToken();
    if (!token) {
      console.log('🔒 Pas de token, synchronisation ignorée');
      return;
    }

    this.isSyncing = true;

    try {
      // Récupérer les éléments en attente
      const pendingItems = await window.fitnessDB.getPendingSyncItems();

      if (pendingItems.length === 0) {
        console.log('✅ Rien à synchroniser');
        this.isSyncing = false;
        return;
      }

      console.log(`🔄 Synchronisation de ${pendingItems.length} éléments...`);

      // Préparer les données pour l'API
      const items = pendingItems.map(item => ({
        entity_type: item.entityType,
        entity_uuid: item.entityUuid,
        action: item.action,
        data: JSON.parse(item.payload)
      }));

      // Envoyer au serveur
      const response = await fetch(`${this.apiUrl}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      // Marquer les éléments comme synchronisés
      for (const item of pendingItems) {
        await window.fitnessDB.markAsSynced(item.id);
      }

      console.log('✅ Synchronisation réussie:', result);

      // Notification de succès
      if (window.NotificationManager) {
        window.NotificationManager.info(
          `${pendingItems.length} élément(s) synchronisé(s)`,
          'Synchronisation'
        );
      }

      // Mettre à jour l'utilisateur si le serveur retourne des infos
      if (result.user) {
        await this.updateUserFromServer(result.user);
      }

      this.retryCount = 0;

    } catch (error) {
      console.error('❌ Erreur de synchronisation:', error);

      this.retryCount++;

      if (this.retryCount < this.maxRetries) {
        console.log(`🔄 Nouvelle tentative dans ${this.retryCount * 5}s...`);
        setTimeout(() => {
          this.syncAll();
        }, this.retryCount * 5000);
      } else {
        console.error('❌ Échec après plusieurs tentatives');
        this.retryCount = 0;

        if (window.NotificationManager) {
          window.NotificationManager.error(
            'La synchronisation a échoué. Vos données sont sauvegardées localement.',
            'Erreur de sync'
          );
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Synchronise avec sendBeacon (pour beforeunload)
   */
  async syncWithBeacon() {
    const token = this.getAuthToken();
    if (!token) return;

    const pendingItems = await window.fitnessDB.getPendingSyncItems();
    if (pendingItems.length === 0) return;

    const items = pendingItems.map(item => ({
      entity_type: item.entityType,
      entity_uuid: item.entityUuid,
      action: item.action,
      data: JSON.parse(item.payload)
    }));

    const blob = new Blob([JSON.stringify({ items })], { type: 'application/json' });
    navigator.sendBeacon(`${this.apiUrl}/sync/push`, blob);
  }

  // ═══════════════════════════════════════════════════════════
  // PULL (Téléchargement depuis le serveur)
  // ═══════════════════════════════════════════════════════════

  /**
   * Télécharge les données du serveur
   */
  async pullFromServer() {
    if (!Helpers.isOnline()) {
      throw new Error('Aucune connexion internet');
    }

    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Non authentifié');
    }

    console.log('📥 Téléchargement des données du serveur...');

    try {
      const response = await fetch(`${this.apiUrl}/sync/pull`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      // Sauvegarder les données localement
      await this.saveServerData(result);

      console.log('✅ Données téléchargées:', result.total_workouts, 'séances');

      if (window.NotificationManager) {
        window.NotificationManager.success(
          'Données restaurées depuis le serveur',
          'Synchronisation'
        );
      }

      return result;

    } catch (error) {
      console.error('❌ Erreur de téléchargement:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde les données du serveur localement
   */
  async saveServerData(data) {
    // Sauvegarder l'utilisateur
    if (data.user) {
      await this.updateUserFromServer(data.user);
    }

    // Sauvegarder les séances
    if (data.workouts) {
      for (const workout of data.workouts) {
        // Sauvegarder la séance
        await window.fitnessDB.put('workouts', {
          uuid: workout.uuid,
          name: workout.name,
          workoutDate: workout.workout_date,
          durationMinutes: workout.duration_minutes,
          totalVolume: workout.total_volume,
          xpEarned: workout.xp_earned,
          isCompleted: workout.is_completed,
          notes: workout.notes
        });

        // Sauvegarder les exercices de la séance
        for (const exercise of workout.exercises) {
          await window.fitnessDB.put('workoutExercises', {
            uuid: exercise.uuid,
            workoutUuid: workout.uuid,
            exerciseUuid: exercise.exercise_uuid,
            orderIndex: exercise.order_index,
            totalSets: exercise.total_sets,
            totalVolume: exercise.total_volume,
            estimated1rm: exercise.estimated_1rm
          });

          // Sauvegarder les séries
          for (const set of exercise.sets) {
            await window.fitnessDB.put('exerciseSets', {
              uuid: set.uuid,
              workoutExerciseUuid: exercise.uuid,
              setNumber: set.set_number,
              weight_kg: set.weight_kg,
              reps: set.reps,
              rpe: set.rpe,
              volume: set.volume,
              estimated_1rm: set.estimated_1rm,
              isWarmup: set.is_warmup,
              isPR: set.is_pr,
              restSeconds: set.rest_seconds,
              createdAt: set.created_at
            });
          }
        }
      }
    }
  }

  /**
   * Met à jour l'utilisateur depuis les données serveur
   */
  async updateUserFromServer(serverUser) {
    const localUsers = await window.fitnessDB.getAll('user');

    if (localUsers.length > 0) {
      const user = localUsers[0];
      user.totalXP = serverUser.total_xp;
      user.currentLevel = serverUser.current_level;
      user.lastSync = serverUser.last_sync;
      await window.fitnessDB.put('user', user);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Récupère le token d'authentification
   */
  getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  /**
   * Vérifie s'il y a des éléments en attente
   */
  async hasPendingItems() {
    const items = await window.fitnessDB.getPendingSyncItems();
    return items.length > 0;
  }

  /**
   * Compte les éléments en attente
   */
  async getPendingCount() {
    const items = await window.fitnessDB.getPendingSyncItems();
    return items.length;
  }

  /**
   * Efface la file de synchronisation
   */
  async clearQueue() {
    await window.fitnessDB.clear('syncQueue');
    console.log('🗑️ File de synchronisation effacée');
  }

  /**
   * Force une synchronisation immédiate
   */
  async forceSync() {
    console.log('🔄 Synchronisation forcée...');
    await this.syncAll();
  }

  /**
   * Synchronisation complète (Push + Pull)
   */
  async fullSync() {
    console.log('🔄 Synchronisation complète...');

    // 1. Push des modifications locales
    await this.syncAll();

    // 2. Pull des données serveur
    await this.pullFromServer();

    console.log('✅ Synchronisation complète terminée');
  }
}

// Export d'une instance unique (Singleton)
const syncQueueManager = new SyncQueueManager();

// Export global
if (typeof window !== 'undefined') {
  window.SyncQueueManager = syncQueueManager;
}