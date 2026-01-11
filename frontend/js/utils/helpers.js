/**
 * FitnessRPG - Helpers
 * Fonctions utilitaires réutilisables
 */

const Helpers = {

  // ═══════════════════════════════════════════════════════════
  // FORMATAGE DE DATES
  // ═══════════════════════════════════════════════════════════

  /**
   * Formate une date en français
   */
  formatDate(date, options = {}) {
    const d = new Date(date);
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    return d.toLocaleDateString('fr-FR', defaultOptions);
  },

  /**
   * Formate une date en format court (ex: 09/01/2026)
   */
  formatDateShort(date) {
    return this.formatDate(date, { year: 'numeric', month: '2-digit', day: '2-digit' });
  },

  /**
   * Formate une heure (ex: 14:30)
   */
  formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  },

  /**
   * Retourne le temps écoulé depuis une date (ex: "Il y a 2 jours")
   */
  timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);

    if (seconds < 60) return 'À l\'instant';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;

    const months = Math.floor(days / 30);
    if (months < 12) return `Il y a ${months} mois`;

    const years = Math.floor(days / 365);
    return `Il y a ${years} an${years > 1 ? 's' : ''}`;
  },

  /**
   * Formate une durée en minutes (ex: 65 min → "1h05")
   */
  formatDuration(minutes) {
    if (!minutes) return '0 min';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  },

  // ═══════════════════════════════════════════════════════════
  // FORMATAGE DE NOMBRES
  // ═══════════════════════════════════════════════════════════

  /**
   * Formate un nombre avec séparateurs (ex: 1234 → "1 234")
   */
  formatNumber(num, decimals = 0) {
    if (typeof num !== 'number') return '0';
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  },

  /**
   * Formate un poids (ex: 82.5 → "82.5 kg")
   */
  formatWeight(kg, showUnit = true) {
    const formatted = this.formatNumber(kg, 1);
    return showUnit ? `${formatted} kg` : formatted;
  },

  /**
   * Formate un pourcentage (ex: 0.752 → "75%")
   */
  formatPercent(value, decimals = 0) {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  // ═══════════════════════════════════════════════════════════
  // GÉNÉRATION D'UUID
  // ═══════════════════════════════════════════════════════════

  /**
   * Génère un UUID v4
   */
  generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback pour navigateurs anciens
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // ═══════════════════════════════════════════════════════════
  // MANIPULATION DE TABLEAUX
  // ═══════════════════════════════════════════════════════════

  /**
   * Trie un tableau par une propriété
   */
  sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },

  /**
   * Groupe un tableau par une propriété
   */
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  },

  /**
   * Déduplique un tableau par une propriété
   */
  uniqueBy(array, key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },

  // ═══════════════════════════════════════════════════════════
  // MANIPULATION DE CHAÎNES
  // ═══════════════════════════════════════════════════════════

  /**
   * Capitalise la première lettre
   */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * Tronque une chaîne avec ellipse
   */
  truncate(str, maxLength = 50) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  },

  /**
   * Slugifie une chaîne (pour les URLs)
   */
  slugify(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // ═══════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Valide un email
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Valide un nombre positif
   */
  isPositiveNumber(value) {
    return typeof value === 'number' && value > 0 && !isNaN(value);
  },

  /**
   * Valide une date
   */
  isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },

  // ═══════════════════════════════════════════════════════════
  // STOCKAGE LOCAL
  // ═══════════════════════════════════════════════════════════

  /**
   * Sauvegarde dans le localStorage avec support JSON
   */
  setLocalStorage(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Erreur localStorage:', error);
      return false;
    }
  },

  /**
   * Récupère depuis le localStorage avec parsing JSON
   */
  getLocalStorage(key, defaultValue = null) {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) return defaultValue;
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Erreur localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Supprime du localStorage
   */
  removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erreur localStorage:', error);
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // CALCULS STATISTIQUES
  // ═══════════════════════════════════════════════════════════

  /**
   * Calcule la moyenne d'un tableau
   */
  average(array) {
    if (!array || array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  },

  /**
   * Calcule le total d'un tableau
   */
  sum(array) {
    if (!array || array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0);
  },

  /**
   * Trouve le min/max d'un tableau
   */
  minMax(array) {
    if (!array || array.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...array),
      max: Math.max(...array)
    };
  },

  /**
   * Calcule un pourcentage de variation
   */
  percentChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  },

  // ═══════════════════════════════════════════════════════════
  // DEBOUNCE & THROTTLE
  // ═══════════════════════════════════════════════════════════

  /**
   * Debounce une fonction (attend que l'utilisateur arrête de taper)
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle une fonction (limite le nombre d'appels)
   */
  throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // ═══════════════════════════════════════════════════════════
  // ANIMATION & DOM
  // ═══════════════════════════════════════════════════════════

  /**
   * Anime un nombre progressivement
   */
  animateNumber(element, start, end, duration = 1000) {
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      element.textContent = Math.round(current);
    }, 16);
  },

  /**
   * Scroll smooth vers un élément
   */
  scrollToElement(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  },

  // ═══════════════════════════════════════════════════════════
  // RÉSEAU & API
  // ═══════════════════════════════════════════════════════════

  /**
   * Vérifie si le navigateur est en ligne
   */
  isOnline() {
    return navigator.onLine;
  },

  /**
   * Attend que le navigateur soit en ligne
   */
  waitForOnline() {
    return new Promise((resolve) => {
      if (navigator.onLine) {
        resolve();
      } else {
        const handler = () => {
          window.removeEventListener('online', handler);
          resolve();
        };
        window.addEventListener('online', handler);
      }
    });
  },

  /**
   * Retry une fonction avec backoff exponentiel
   */
  async retry(fn, maxAttempts = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;

        const waitTime = delay * Math.pow(2, attempt - 1);
        console.log(`Tentative ${attempt} échouée, nouvelle tentative dans ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  },

  // ═══════════════════════════════════════════════════════════
  // COPIE DANS LE PRESSE-PAPIERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Copie du texte dans le presse-papiers
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback pour navigateurs anciens
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  },

  // ═══════════════════════════════════════════════════════════
  // VIBRATION (pour feedback tactile)
  // ═══════════════════════════════════════════════════════════

  /**
   * Fait vibrer le téléphone (si supporté)
   */
  vibrate(pattern = 100) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Erreur silencieuse (pas d'interaction utilisateur)
        console.debug('Vibration non disponible:', error.message);
      }
    }
  },

  /**
   * Vibration de succès
   */
  vibrateSuccess() {
    try {
      this.vibrate([50, 50, 50]);
    } catch (error) {
      // Silencieux
    }
  },

  /**
   * Vibration d'erreur
   */
  vibrateError() {
    try {
      this.vibrate([100, 50, 100]);
    } catch (error) {
      // Silencieux
    }
  }
};

// Export global
if (typeof window !== 'undefined') {
  window.Helpers = Helpers;
}