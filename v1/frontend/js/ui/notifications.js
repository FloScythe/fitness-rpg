/**
 * FitnessRPG - Système de Notifications
 * Gestion des toasts et messages utilisateur
 */

class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.nextId = 1;
  }

  // ═══════════════════════════════════════════════════════════
  // INITIALISATION
  // ═══════════════════════════════════════════════════════════

  init() {
    this.container = document.getElementById('toast-container');

    if (!this.container) {
      console.warn('⚠️ Toast container non trouvé');
      // Créer le container dynamiquement
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }

    console.log('✅ NotificationManager initialisé');
  }

  // ═══════════════════════════════════════════════════════════
  // AFFICHAGE DE NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Affiche une notification
   */
  show(options = {}) {
    const {
      type = 'info',        // success, error, warning, info
      title = '',
      message = '',
      duration = 3000,
      sound = false,
      vibrate = true,
      action = null         // { label, callback }
    } = options;

    const notification = {
      id: this.nextId++,
      type,
      title,
      message,
      duration,
      createdAt: Date.now()
    };

    this.notifications.push(notification);

    // Créer l'élément DOM
    const element = this.createToastElement(notification, action);
    this.container.appendChild(element);

    // Vibration
    if (vibrate && type === 'success') {
      Helpers.vibrateSuccess();
    } else if (vibrate && type === 'error') {
      Helpers.vibrateError();
    }

    // Son (si supporté)
    if (sound) {
      this.playSound(type);
    }

    // Animation d'entrée
    requestAnimationFrame(() => {
      element.classList.add('toast--enter');
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, duration);
    }

    return notification.id;
  }

  /**
   * Crée l'élément DOM du toast
   */
  createToastElement(notification, action) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${notification.type}`;
    toast.dataset.notificationId = notification.id;

    // Icône
    const icon = this.getIcon(notification.type);
    toast.innerHTML = `
      <div class="toast__icon">
        ${icon}
      </div>
      <div class="toast__content">
        ${notification.title ? `<div class="toast__title">${notification.title}</div>` : ''}
        ${notification.message ? `<div class="toast__message">${notification.message}</div>` : ''}
        ${action ? `
          <button class="btn btn--sm btn--ghost mt-2" data-action="true">
            ${action.label}
          </button>
        ` : ''}
      </div>
      <button class="toast__close" aria-label="Fermer">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;

    // Événement de fermeture
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => {
      this.dismiss(notification.id);
    });

    // Événement d'action
    if (action) {
      const actionBtn = toast.querySelector('[data-action]');
      actionBtn.addEventListener('click', () => {
        action.callback();
        this.dismiss(notification.id);
      });
    }

    return toast;
  }

  /**
   * Retourne l'icône SVG selon le type
   */
  getIcon(type) {
    const icons = {
      success: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--success)">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>`,
      error: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--danger)">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>`,
      warning: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--warning)">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>`,
      info: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: var(--info)">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`
    };

    return icons[type] || icons.info;
  }

  /**
   * Ferme une notification
   */
  dismiss(notificationId) {
    const element = this.container.querySelector(`[data-notification-id="${notificationId}"]`);

    if (element) {
      element.classList.remove('toast--enter');
      element.classList.add('toast--exit');

      setTimeout(() => {
        element.remove();

        // Retirer de la liste
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index > -1) {
          this.notifications.splice(index, 1);
        }
      }, 300);
    }
  }

  /**
   * Ferme toutes les notifications
   */
  dismissAll() {
    this.notifications.forEach(n => this.dismiss(n.id));
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTHODES RACCOURCIES
  // ═══════════════════════════════════════════════════════════

  success(message, title = 'Succès') {
    return this.show({ type: 'success', title, message });
  }

  error(message, title = 'Erreur') {
    return this.show({ type: 'error', title, message, duration: 5000 });
  }

  warning(message, title = 'Attention') {
    return this.show({ type: 'warning', title, message, duration: 4000 });
  }

  info(message, title = 'Info') {
    return this.show({ type: 'info', title, message });
  }

  // ═══════════════════════════════════════════════════════════
  // NOTIFICATIONS SPÉCIALES RPG
  // ═══════════════════════════════════════════════════════════

  /**
   * Notification de gain d'XP
   */
  xpGained(amount) {
    return this.show({
      type: 'success',
      title: `+${amount} XP`,
      message: 'XP gagné !',
      duration: 2000,
      sound: true,
      vibrate: true
    });
  }

  /**
   * Notification de level up
   */
  levelUp(newLevel) {
    return this.show({
      type: 'success',
      title: '🎉 LEVEL UP !',
      message: `Vous êtes maintenant niveau ${newLevel} !`,
      duration: 5000,
      sound: true,
      vibrate: true
    });
  }

  /**
   * Notification de Boss Battle (PR)
   */
  bossBattle(exerciseName) {
    return this.show({
      type: 'warning',
      title: '⚔️ BOSS BATTLE !',
      message: `Nouveau record sur ${exerciseName} !`,
      duration: 5000,
      sound: true,
      vibrate: true
    });
  }

  /**
   * Notification d'achievement débloqué
   */
  achievement(title, description) {
    return this.show({
      type: 'success',
      title: `🏅 ${title}`,
      message: description,
      duration: 5000,
      sound: true
    });
  }

  // ═══════════════════════════════════════════════════════════
  // SONS (si disponibles)
  // ═══════════════════════════════════════════════════════════

  playSound(type) {
    // TODO: Ajouter des fichiers audio dans /assets/sounds/
    // Pour l'instant, utiliser l'API Web Audio si nécessaire

    if (typeof AudioContext === 'undefined') {
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Fréquences selon le type
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600,
        info: 700
      };

      oscillator.frequency.value = frequencies[type] || 700;
      oscillator.type = 'sine';

      gainNode.gain.value = 0.1;
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);

    } catch (error) {
      console.warn('Son non disponible:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIRMATION DIALOG
  // ═══════════════════════════════════════════════════════════

  /**
   * Affiche une confirmation
   */
  confirm(options = {}) {
    const {
      title = 'Confirmation',
      message = 'Êtes-vous sûr ?',
      confirmText = 'Confirmer',
      cancelText = 'Annuler',
      onConfirm = () => {},
      onCancel = () => {}
    } = options;

    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal">
          <div class="modal__header">
            <h3 class="modal__title">${title}</h3>
          </div>
          <div class="modal__body">
            <p>${message}</p>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" data-action="cancel">
              ${cancelText}
            </button>
            <button class="btn btn--primary" data-action="confirm">
              ${confirmText}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.classList.add('no-scroll');

      const handleClose = (confirmed) => {
        backdrop.remove();
        document.body.classList.remove('no-scroll');

        if (confirmed) {
          onConfirm();
        } else {
          onCancel();
        }

        resolve(confirmed);
      };

      backdrop.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        handleClose(true);
      });

      backdrop.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        handleClose(false);
      });

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          handleClose(false);
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // PROMPT DIALOG
  // ═══════════════════════════════════════════════════════════

  /**
   * Affiche un prompt pour saisir du texte
   */
  prompt(options = {}) {
    const {
      title = 'Saisie',
      message = '',
      placeholder = '',
      defaultValue = '',
      confirmText = 'OK',
      cancelText = 'Annuler'
    } = options;

    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal">
          <div class="modal__header">
            <h3 class="modal__title">${title}</h3>
          </div>
          <div class="modal__body">
            ${message ? `<p class="mb-4">${message}</p>` : ''}
            <input
              type="text"
              class="form-input"
              placeholder="${placeholder}"
              value="${defaultValue}"
              id="prompt-input"
            />
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" data-action="cancel">
              ${cancelText}
            </button>
            <button class="btn btn--primary" data-action="confirm">
              ${confirmText}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.classList.add('no-scroll');

      const input = backdrop.querySelector('#prompt-input');
      input.focus();

      const handleClose = (confirmed) => {
        const value = confirmed ? input.value : null;
        backdrop.remove();
        document.body.classList.remove('no-scroll');
        resolve(value);
      };

      backdrop.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        handleClose(true);
      });

      backdrop.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        handleClose(false);
      });

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleClose(true);
        }
      });
    });
  }
}

// Export d'une instance unique (Singleton)
const notificationManager = new NotificationManager();

// Export global
if (typeof window !== 'undefined') {
  window.NotificationManager = notificationManager;
}

// CSS d'animation à ajouter dynamiquement
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
  .toast--enter {
    animation: slideInRight 0.3s ease-out;
  }

  .toast--exit {
    animation: slideOutRight 0.3s ease-in;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
`;
document.head.appendChild(notificationStyle);