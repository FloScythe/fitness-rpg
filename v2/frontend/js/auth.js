/**
 * Auth - Gestion de l'authentification
 */

const Auth = {
  // Détecter automatiquement l'URL de l'API (localhost ou IP)
  apiUrl: (() => {
    const hostname = window.location.hostname;
    // Si on est sur localhost, utiliser localhost
    // Sinon, utiliser l'IP du serveur (même hostname que le frontend)
    return hostname === 'localhost'
      ? 'http://localhost:5000/api/auth'
      : `http://${hostname}:5000/api/auth`;
  })(),

  /**
   * Inscription
   */
  async register(username, email, password) {
    try {
      const response = await fetch(`${this.apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Sauvegarder le token et l'utilisateur
      localStorage.setItem('auth_token', data.token);
      await Storage.save('user', {
        uuid: data.user.uuid,
        username: data.user.username,
        email: data.user.email,
        level: data.user.level || 1,
        totalXP: data.user.total_xp || 0,
        createdAt: data.user.created_at,
        lastSync: new Date().toISOString()
      });

      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Erreur inscription:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Connexion
   */
  async login(username, password) {
    try {
      const response = await fetch(`${this.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      // Vérifier si on a un utilisateur local (mode hors ligne)
      const localUser = await this.getCurrentUser();
      const localXP = localUser?.totalXP || 0;
      const localLevel = localUser?.level || 1;

      // Sauvegarder le token et l'utilisateur
      localStorage.setItem('auth_token', data.token);
      localStorage.removeItem('offline_mode');

      // Conserver l'XP local si supérieur à celui du serveur
      const serverXP = data.user.total_xp || 0;
      const finalXP = Math.max(localXP, serverXP);
      const finalLevel = Math.max(localLevel, data.user.level || 1);

      await Storage.save('user', {
        uuid: data.user.uuid,
        username: data.user.username,
        email: data.user.email,
        level: finalLevel,
        totalXP: finalXP,
        createdAt: data.user.created_at,
        lastSync: new Date().toISOString(),
        isOffline: false
      });

      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Continuer hors ligne
   */
  async continueOffline(username) {
    try {
      // Créer un utilisateur local
      // Fallback pour les navigateurs mobiles qui ne supportent pas crypto.randomUUID
      const uuid = this.generateUUID();
      const user = {
        uuid,
        username: username || 'Aventurier',
        email: null,
        level: 1,
        totalXP: 0,
        createdAt: new Date().toISOString(),
        isOffline: true
      };

      await Storage.save('user', user);
      localStorage.setItem('offline_mode', 'true');

      return { success: true, user };
    } catch (error) {
      console.error('❌ Erreur mode hors ligne:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Générer un UUID (avec fallback pour mobile)
   */
  generateUUID() {
    // Essayer crypto.randomUUID d'abord (moderne)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback pour les navigateurs mobiles
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Déconnexion
   */
  async logout() {
    // Récupérer l'utilisateur avant de supprimer le token
    const user = await this.getCurrentUser();

    // Supprimer les tokens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('offline_mode');

    // NE PAS supprimer l'utilisateur - juste marquer comme déconnecté
    if (user) {
      user.isOffline = true;
      await Storage.save('user', user);
    }

    console.log('✅ Déconnecté (données conservées)');
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated() {
    return !!localStorage.getItem('auth_token') || !!localStorage.getItem('offline_mode');
  },

  /**
   * Récupérer l'utilisateur actuel
   */
  async getCurrentUser() {
    const users = await Storage.getAll('user');
    return users.length > 0 ? users[0] : null;
  }
};
