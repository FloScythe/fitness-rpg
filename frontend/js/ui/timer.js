/**
 * FitnessRPG - Module Timer
 * Gestion du timer de repos entre les séries
 */

class Timer {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.duration = 0;
    this.remainingTime = 0;
    this.startTime = null;
    this.pausedTime = 0;
    this.intervalId = null;
    this.callbacks = {
      onTick: null,
      onComplete: null,
      onStart: null,
      onPause: null,
      onResume: null
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CONTRÔLES DU TIMER
  // ═══════════════════════════════════════════════════════════

  /**
   * Démarre le timer
   */
  start(seconds, options = {}) {
    if (this.isRunning) {
      this.stop();
    }

    this.duration = seconds;
    this.remainingTime = seconds;
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.isRunning = true;
    this.isPaused = false;

    // Callbacks
    if (options.onTick) this.callbacks.onTick = options.onTick;
    if (options.onComplete) this.callbacks.onComplete = options.onComplete;
    if (options.onStart) this.callbacks.onStart = options.onStart;
    if (options.onPause) this.callbacks.onPause = options.onPause;
    if (options.onResume) this.callbacks.onResume = options.onResume;

    // Lancer le compteur
    this.intervalId = setInterval(() => {
      this.tick();
    }, 100); // Mise à jour toutes les 100ms pour plus de précision

    // Notification de démarrage
    if (this.callbacks.onStart) {
      this.callbacks.onStart(this.duration);
    }

    console.log(`⏱️ Timer démarré : ${seconds}s`);
  }

  /**
   * Met en pause le timer
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;
    this.pausedTime = Date.now();

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.callbacks.onPause) {
      this.callbacks.onPause(this.remainingTime);
    }

    console.log('⏸️ Timer en pause');
  }

  /**
   * Reprend le timer
   */
  resume() {
    if (!this.isRunning || !this.isPaused) return;

    // Ajuster le temps de départ
    const pauseDuration = Date.now() - this.pausedTime;
    this.startTime += pauseDuration;

    this.isPaused = false;

    // Relancer le compteur
    this.intervalId = setInterval(() => {
      this.tick();
    }, 100);

    if (this.callbacks.onResume) {
      this.callbacks.onResume(this.remainingTime);
    }

    console.log('▶️ Timer repris');
  }

  /**
   * Arrête le timer
   */
  stop() {
    if (!this.isRunning) return;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.isPaused = false;
    this.remainingTime = 0;

    console.log('⏹️ Timer arrêté');
  }

  /**
   * Réinitialise le timer
   */
  reset() {
    this.stop();
    this.remainingTime = this.duration;

    if (this.callbacks.onTick) {
      this.callbacks.onTick(this.remainingTime, this.duration);
    }
  }

  /**
   * Ajoute du temps
   */
  addTime(seconds) {
    this.duration += seconds;
    this.remainingTime += seconds;

    if (this.callbacks.onTick) {
      this.callbacks.onTick(this.remainingTime, this.duration);
    }

    console.log(`⏱️ +${seconds}s ajoutés`);
  }

  // ═══════════════════════════════════════════════════════════
  // LOGIQUE DU TIMER
  // ═══════════════════════════════════════════════════════════

  /**
   * Mise à jour du timer (appelé toutes les 100ms)
   */
  tick() {
    if (!this.isRunning || this.isPaused) return;

    const elapsed = (Date.now() - this.startTime) / 1000;
    this.remainingTime = Math.max(0, this.duration - elapsed);

    // Callback de mise à jour
    if (this.callbacks.onTick) {
      this.callbacks.onTick(this.remainingTime, this.duration);
    }

    // Timer terminé
    if (this.remainingTime <= 0) {
      this.complete();
    }
  }

  /**
   * Timer terminé
   */
  complete() {
    this.stop();

    // Vibration de fin
    try {
      if (Helpers) {
        Helpers.vibrate([200, 100, 200]);
      }
    } catch (error) {
      // Silencieux
    }

    // Notification
    if (window.NotificationManager) {
      window.NotificationManager.show({
        type: 'info',
        title: '⏰ Repos terminé !',
        message: 'Vous pouvez commencer votre prochaine série.',
        duration: 3000,
        sound: true
      });
    }

    // Callback de fin
    if (this.callbacks.onComplete) {
      this.callbacks.onComplete();
    }

    console.log('✅ Timer terminé');
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Formate le temps restant en MM:SS
   */
  formatTime(seconds = this.remainingTime) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Retourne le pourcentage de progression
   */
  getProgress() {
    if (this.duration === 0) return 0;
    return ((this.duration - this.remainingTime) / this.duration) * 100;
  }

  /**
   * Vérifie si le timer est actif
   */
  isActive() {
    return this.isRunning && !this.isPaused;
  }

  /**
   * Retourne l'état du timer
   */
  getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      duration: this.duration,
      remainingTime: this.remainingTime,
      formattedTime: this.formatTime(),
      progress: this.getProgress()
    };
  }
}

/**
 * Timer Manager - Gère plusieurs timers et l'UI
 */
class TimerManager {
  constructor() {
    this.timer = new Timer();
    this.ui = null;
  }

  /**
   * Initialise le timer manager
   */
  init() {
    console.log('✅ TimerManager initialisé');
  }

  /**
   * Démarre un timer avec UI
   */
  startTimer(seconds, exercise = null) {
    // Créer l'UI si nécessaire
    if (!this.ui) {
      this.createUI();
    }

    // Afficher l'UI
    this.showUI();

    // Démarrer le timer
    this.timer.start(seconds, {
      onTick: (remaining, total) => {
        this.updateUI(remaining, total);
      },
      onComplete: () => {
        this.hideUI();
      },
      onPause: () => {
        this.updateUIState();
      },
      onResume: () => {
        this.updateUIState();
      }
    });
  }

  /**
   * Crée l'UI du timer
   */
  createUI() {
    this.ui = document.createElement('div');
    this.ui.id = 'timer-ui';
    this.ui.className = 'timer-ui';
    this.ui.innerHTML = `
      <div class="timer-ui__container">
        <div class="timer-ui__time" id="timer-display">0:00</div>
        <div class="timer-ui__progress">
          <div class="progress progress--lg">
            <div class="progress__bar" id="timer-progress-bar" style="width: 0%"></div>
          </div>
        </div>
        <div class="timer-ui__controls">
          <button class="btn btn--secondary btn--sm" id="timer-pause">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          </button>
          <button class="btn btn--secondary btn--sm" id="timer-add-30">+30s</button>
          <button class="btn btn--danger btn--sm" id="timer-stop">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.ui);

    // Événements
    this.ui.querySelector('#timer-pause').addEventListener('click', () => {
      if (this.timer.isPaused) {
        this.timer.resume();
      } else {
        this.timer.pause();
      }
      this.updateUIState();
    });

    this.ui.querySelector('#timer-add-30').addEventListener('click', () => {
      this.timer.addTime(30);
    });

    this.ui.querySelector('#timer-stop').addEventListener('click', () => {
      this.timer.stop();
      this.hideUI();
    });
  }

  /**
   * Met à jour l'affichage du timer
   */
  updateUI(remaining, total) {
    if (!this.ui) return;

    const display = this.ui.querySelector('#timer-display');
    const progressBar = this.ui.querySelector('#timer-progress-bar');

    display.textContent = this.timer.formatTime(remaining);

    const progress = ((total - remaining) / total) * 100;
    progressBar.style.width = `${progress}%`;

    // Changer la couleur selon le temps restant
    if (remaining <= 10) {
      this.ui.classList.add('timer-ui--warning');
    } else {
      this.ui.classList.remove('timer-ui--warning');
    }
  }

  /**
   * Met à jour l'état des boutons
   */
  updateUIState() {
    if (!this.ui) return;

    const pauseBtn = this.ui.querySelector('#timer-pause');

    if (this.timer.isPaused) {
      pauseBtn.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      `;
    } else {
      pauseBtn.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
      `;
    }
  }

  /**
   * Affiche l'UI
   */
  showUI() {
    if (this.ui) {
      this.ui.classList.add('timer-ui--visible');
    }
  }

  /**
   * Masque l'UI
   */
  hideUI() {
    if (this.ui) {
      this.ui.classList.remove('timer-ui--visible');
    }
  }

  /**
   * Démarre un timer automatique après une série
   */
  autoStart(exercise, lastSet) {
    const restTime = window.SmartCoach.suggestRestTime(exercise, lastSet);
    this.startTimer(restTime, exercise);
  }
}

// Export d'une instance unique (Singleton)
const timerManager = new TimerManager();

// Export global
if (typeof window !== 'undefined') {
  window.Timer = Timer;
  window.TimerManager = timerManager;
}

// CSS du timer
const timerStyle = document.createElement('style');
timerStyle.textContent = `
  .timer-ui {
    position: fixed;
    bottom: calc(var(--bottom-nav-height) + var(--space-4));
    right: var(--space-4);
    z-index: var(--z-fixed);
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-xl);
    padding: var(--space-4);
    box-shadow: var(--shadow-lg);
    transform: translateY(150%);
    transition: transform var(--transition-base);
  }

  .timer-ui--visible {
    transform: translateY(0);
  }

  .timer-ui--warning .timer-ui__time {
    color: var(--danger);
    animation: pulse 1s infinite;
  }

  .timer-ui__time {
    font-size: var(--text-4xl);
    font-weight: var(--font-extrabold);
    text-align: center;
    margin-bottom: var(--space-3);
    font-variant-numeric: tabular-nums;
  }

  .timer-ui__progress {
    margin-bottom: var(--space-3);
    min-width: 200px;
  }

  .timer-ui__controls {
    display: flex;
    gap: var(--space-2);
    justify-content: center;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @media (max-width: 640px) {
    .timer-ui {
      right: var(--space-2);
      left: var(--space-2);
    }
  }
`;
document.head.appendChild(timerStyle);