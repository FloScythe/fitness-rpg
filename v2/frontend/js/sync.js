/**
 * Sync - Module de synchronisation avec le backend
 */

const Sync = {
  // Détecter automatiquement l'URL de l'API
  apiUrl: (() => {
    const hostname = window.location.hostname;
    return hostname === 'localhost'
      ? 'http://localhost:5000/api'
      : `http://${hostname}:5000/api`;
  })(),

  /**
   * Obtenir les headers avec le token
   */
  getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },

  /**
   * Vérifier si l'utilisateur est en ligne et connecté
   */
  canSync() {
    return navigator.onLine && !!localStorage.getItem('auth_token');
  },

  /**
   * Synchroniser le profil utilisateur
   */
  async syncProfile(user) {
    if (!this.canSync()) {
      console.log('⚠️ Sync profil ignorée (hors ligne ou non connecté)');
      return { success: false, offline: true };
    }

    try {
      const response = await fetch(`${this.apiUrl}/sync/profile`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          level: user.level,
          totalXP: user.totalXP
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur sync profil');
      }

      console.log('✅ Profil synchronisé');
      return { success: true, data };

    } catch (error) {
      console.error('❌ Erreur sync profil:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Synchroniser tous les workouts locaux vers le serveur
   */
  async syncWorkouts() {
    if (!this.canSync()) {
      console.log('⚠️ Sync workouts ignorée (hors ligne ou non connecté)');
      return { success: false, offline: true };
    }

    try {
      // Récupérer tous les workouts locaux
      const workouts = await Storage.getAll('workouts');

      if (workouts.length === 0) {
        console.log('✅ Aucun workout à synchroniser');
        return { success: true, synced_count: 0 };
      }

      // Envoyer au serveur
      const response = await fetch(`${this.apiUrl}/sync/workouts`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ workouts })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur sync workouts');
      }

      console.log(`✅ ${data.synced_count} workouts synchronisés`);

      // Marquer la dernière sync
      localStorage.setItem('last_sync', new Date().toISOString());

      return { success: true, data };

    } catch (error) {
      console.error('❌ Erreur sync workouts:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupérer tous les workouts depuis le serveur
   */
  async fetchWorkouts() {
    if (!this.canSync()) {
      console.log('⚠️ Fetch workouts ignorée (hors ligne ou non connecté)');
      return { success: false, offline: true };
    }

    try {
      const response = await fetch(`${this.apiUrl}/workouts`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur fetch workouts');
      }

      console.log(`✅ ${data.workouts.length} workouts récupérés`);
      return { success: true, workouts: data.workouts };

    } catch (error) {
      console.error('❌ Erreur fetch workouts:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Synchronisation complète (profil + workouts)
   */
  async syncAll() {
    if (!this.canSync()) {
      console.log('⚠️ Sync complète ignorée (hors ligne ou non connecté)');
      return { success: false, offline: true };
    }

    console.log('🔄 Début synchronisation complète...');

    try {
      // 1. Synchroniser les workouts locaux vers le serveur
      const workoutsResult = await this.syncWorkouts();

      if (!workoutsResult.success && !workoutsResult.offline) {
        throw new Error('Échec sync workouts');
      }

      // 2. Récupérer tous les workouts depuis le serveur
      const fetchResult = await this.fetchWorkouts();

      if (fetchResult.success && fetchResult.workouts) {
        // Récupérer les workouts locaux
        const localWorkouts = await Storage.getAll('workouts');
        const localWorkoutIds = new Set(localWorkouts.map(w => w.startTime));

        // Fusionner : ajouter les workouts du serveur qui ne sont pas en local
        for (const serverWorkout of fetchResult.workouts) {
          if (!localWorkoutIds.has(serverWorkout.startTime)) {
            // Convertir le format serveur vers le format local
            const localWorkout = {
              id: serverWorkout.startTime, // Utiliser startTime comme ID local
              date: serverWorkout.date,
              startTime: serverWorkout.startTime,
              endTime: serverWorkout.endTime,
              duration: serverWorkout.duration,
              totalXP: serverWorkout.totalXP,
              exercises: serverWorkout.exercises
            };
            await Storage.save('workouts', localWorkout);
            console.log(`📥 Workout ${localWorkout.id} récupéré du serveur`);
          }
        }
      }

      // 3. Synchroniser le profil
      const user = await Auth.getCurrentUser();
      if (user) {
        const profileResult = await this.syncProfile(user);

        if (!profileResult.success && !profileResult.offline) {
          throw new Error('Échec sync profil');
        }

        // Mettre à jour l'utilisateur local avec les données du serveur
        if (profileResult.data && profileResult.data.user) {
          const serverUser = profileResult.data.user;
          user.level = serverUser.level;
          user.totalXP = serverUser.total_xp;
          user.lastSync = new Date().toISOString();
          await Storage.save('user', user);
        }
      }

      console.log('✅ Synchronisation complète terminée');

      // Rafraîchir la page actuelle si l'App est disponible
      if (typeof App !== 'undefined' && App.refreshCurrentPage) {
        await App.refreshCurrentPage();
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Erreur sync complète:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprimer un workout sur le serveur
   */
  async deleteWorkout(workoutStartTime) {
    if (!this.canSync()) {
      console.log('⚠️ Suppression serveur ignorée (hors ligne ou non connecté)');
      return { success: false, offline: true };
    }

    try {
      const response = await fetch(`${this.apiUrl}/workouts/${workoutStartTime}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        // Si erreur 404, le workout n'existe pas côté serveur (peut-être déjà supprimé)
        if (response.status === 404) {
          console.log('⚠️ Workout déjà supprimé du serveur');
          return { success: true };
        }
        throw new Error(data.error || 'Erreur suppression workout');
      }

      console.log(`✅ Workout supprimé du serveur`);
      return { success: true, data };

    } catch (error) {
      console.error('❌ Erreur suppression workout:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Synchronisation automatique au démarrage si en ligne
   */
  async autoSync() {
    if (!this.canSync()) {
      return;
    }

    // Vérifier la dernière sync
    const lastSync = localStorage.getItem('last_sync');
    const now = Date.now();

    // Si dernière sync il y a plus de 5 minutes, synchroniser
    if (!lastSync || (now - new Date(lastSync).getTime()) > 5 * 60 * 1000) {
      console.log('🔄 Auto-sync démarrée...');
      await this.syncAll();
    }
  },

  /**
   * Synchronisation périodique en arrière-plan
   * Se déclenche toutes les 30 secondes si la page est visible
   */
  startPeriodicSync() {
    // Arrêter toute sync existante
    this.stopPeriodicSync();

    // Synchroniser immédiatement
    this.autoSync();

    // Puis toutes les 30 secondes
    this.syncInterval = setInterval(() => {
      // Synchroniser seulement si la page est visible
      if (!document.hidden && this.canSync()) {
        console.log('🔄 Sync périodique...');
        this.syncAll();
      }
    }, 30000); // 30 secondes

    // Synchroniser quand la page redevient visible
    this.visibilityHandler = () => {
      if (!document.hidden && this.canSync()) {
        console.log('🔄 Page visible - sync...');
        this.syncAll();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  },

  /**
   * Arrêter la synchronisation périodique
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
};
