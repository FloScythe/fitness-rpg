/**
 * FitnessRPG - Router (SPA Navigation)
 * Gestion de la navigation sans rechargement de page
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.contentContainer = null;

    // Bind des méthodes pour préserver le contexte
    this.handleRoute = this.handleRoute.bind(this);
    this.handleNavClick = this.handleNavClick.bind(this);

    // Gestion du hash
    window.addEventListener('hashchange', this.handleRoute);
    window.addEventListener('load', this.handleRoute);

    // Gestion des liens de navigation
    document.addEventListener('click', this.handleNavClick);
  }

  /**
   * Gère les clics sur les liens de navigation
   */
  handleNavClick(e) {
    if (e.target.matches('[data-route]') || e.target.closest('[data-route]')) {
      const link = e.target.matches('[data-route]') ? e.target : e.target.closest('[data-route]');
      const route = link.getAttribute('data-route');
      this.navigate(route);
    }
  }

  /**
   * Initialiser le router avec le container de contenu
   */
  init(containerId) {
    this.contentContainer = document.getElementById(containerId);
    if (!this.contentContainer) {
      console.error('❌ Container non trouvé:', containerId);
      return;
    }

    // Si aucun hash n'est présent, rediriger vers la route par défaut
    if (!window.location.hash || window.location.hash === '#') {
      console.log('📍 Aucun hash détecté, redirection vers route par défaut');
      window.location.hash = '#/';
    }

    console.log('✅ Router initialisé');
  }

  /**
   * Enregistrer une route
   */
  register(path, handler, options = {}) {
    this.routes.set(path, {
      handler,
      title: options.title || 'FitnessRPG',
      requireAuth: options.requireAuth || false
    });
  }

  /**
   * Naviguer vers une route
   */
  navigate(path, data = {}) {
    // Mettre à jour le hash
    window.location.hash = `/${path}`;
  }

  /**
   * Gérer le changement de route
   */
  async handleRoute() {
    // Récupérer le chemin depuis le hash
    let path = window.location.hash.slice(2) || 'login'; // Enlever "#/"

    // Chercher la route correspondante
    let route = this.routes.get(path);

    // Route par défaut si non trouvée
    if (!route) {
      console.warn(`⚠️ Route non trouvée: ${path}, redirection vers login`);
      path = 'login';
      route = this.routes.get(path);

      // Si même la route par défaut n'existe pas
      if (!route) {
        console.error('❌ Aucune route disponible');
        return;
      }
    }

    // Vérifier l'authentification si nécessaire
    if (route.requireAuth && !this.isAuthenticated()) {
      this.navigate('login');
      return;
    }

    // Mettre à jour le titre de la page
    document.title = route.title;

    // Mettre à jour la navigation active
    this.updateActiveNav(path);

    // Transition de sortie
    if (this.contentContainer) {
      this.contentContainer.classList.add('page-exit-active');

      await new Promise(resolve => setTimeout(resolve, 150));

      // Exécuter le handler de la route
      try {
        const content = await route.handler();

        // Mettre à jour le contenu
        this.contentContainer.innerHTML = content;
        this.contentContainer.classList.remove('page-exit-active');
        this.contentContainer.classList.add('page-enter-active');

        // Scroller en haut
        window.scrollTo(0, 0);

        // Transition d'entrée
        setTimeout(() => {
          this.contentContainer.classList.remove('page-enter-active');
        }, 250);

        this.currentRoute = path;

        // Événement personnalisé pour les hooks
        window.dispatchEvent(new CustomEvent('route-changed', {
          detail: { path, route }
        }));

      } catch (error) {
        console.error('❌ Erreur lors du chargement de la route:', error);
        this.contentContainer.innerHTML = this.renderError(error);
      }
    }
  }

  /**
   * Mettre à jour la navigation active
   */
  updateActiveNav(path) {
    // Mettre à jour la bottom nav
    document.querySelectorAll('.bottom-nav__item').forEach(item => {
      const route = item.getAttribute('data-route');
      if (route === path) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Obtenir le token d'authentification
   */
  getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  /**
   * Rendre une page d'erreur
   */
  renderError(error) {
    return `
      <div class="container">
        <div class="empty-state">
          <svg class="empty-state__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 class="empty-state__title">Une erreur est survenue</h2>
          <p class="empty-state__description">${error.message || 'Erreur inconnue'}</p>
          <button class="btn btn--primary" onclick="window.location.reload()">
            Recharger la page
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Récupérer les paramètres de l'URL
   */
  getQueryParams() {
    const hash = window.location.hash;
    const queryStart = hash.indexOf('?');

    if (queryStart === -1) return {};

    const queryString = hash.slice(queryStart + 1);
    const params = new URLSearchParams(queryString);

    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }

    return result;
  }

  /**
   * Récupérer la route actuelle
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
}

// Export d'une instance unique (Singleton)
const router = new Router();

// Export global
if (typeof window !== 'undefined') {
  window.router = router;
}