/**
 * FitnessRPG - Gestion IndexedDB (Local-First Database)
 * Source de vérité pour l'application
 */

const DB_NAME = 'FitnessRPG';
const DB_VERSION = 1;

class FitnessDB {
  constructor() {
    this.db = null;
  }

  /**
   * Initialise la connexion IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialisée');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('🔄 Mise à jour du schéma IndexedDB...');

        // Store 1: Utilisateur (profil local)
        if (!db.objectStoreNames.contains('user')) {
          const userStore = db.createObjectStore('user', { keyPath: 'uuid' });
          userStore.createIndex('username', 'username', { unique: false });
          userStore.createIndex('lastSync', 'lastSync', { unique: false });
        }

        // Store 2: Exercices (bibliothèque)
        if (!db.objectStoreNames.contains('exercises')) {
          const exerciseStore = db.createObjectStore('exercises', { keyPath: 'uuid' });
          exerciseStore.createIndex('name', 'name', { unique: false });
          exerciseStore.createIndex('category', 'category', { unique: false });
          exerciseStore.createIndex('isCustom', 'isCustom', { unique: false });
          exerciseStore.createIndex('isArchived', 'isArchived', { unique: false });
        }

        // Store 3: Séances d'entraînement
        if (!db.objectStoreNames.contains('workouts')) {
          const workoutStore = db.createObjectStore('workouts', { keyPath: 'uuid' });
          workoutStore.createIndex('workoutDate', 'workoutDate', { unique: false });
          workoutStore.createIndex('isCompleted', 'isCompleted', { unique: false });
          workoutStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store 4: Exercices dans une séance (jointure)
        if (!db.objectStoreNames.contains('workoutExercises')) {
          const weStore = db.createObjectStore('workoutExercises', { keyPath: 'uuid' });
          weStore.createIndex('workoutUuid', 'workoutUuid', { unique: false });
          weStore.createIndex('exerciseUuid', 'exerciseUuid', { unique: false });
          weStore.createIndex('orderIndex', 'orderIndex', { unique: false });
        }

        // Store 5: Séries individuelles
        if (!db.objectStoreNames.contains('exerciseSets')) {
          const setStore = db.createObjectStore('exerciseSets', { keyPath: 'uuid' });
          setStore.createIndex('workoutExerciseUuid', 'workoutExerciseUuid', { unique: false });
          setStore.createIndex('setNumber', 'setNumber', { unique: false });
          setStore.createIndex('isPR', 'isPR', { unique: false });
          setStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store 6: File de synchronisation (queue)
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('entityType', 'entityType', { unique: false });
          syncStore.createIndex('entityUuid', 'entityUuid', { unique: false });
          syncStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          syncStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store 7: Statistiques RPG (cache local)
        if (!db.objectStoreNames.contains('rpgStats')) {
          const rpgStore = db.createObjectStore('rpgStats', { keyPath: 'id', autoIncrement: true });
          rpgStore.createIndex('statDate', 'statDate', { unique: false });
        }

        // Store 8: Configuration locale
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        console.log('✅ Schéma IndexedDB créé');
      };
    });
  }

  /**
   * Méthode générique pour ajouter/mettre à jour un objet
   */
  async put(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Méthode générique pour récupérer un objet par clé
   */
  async get(storeName, key) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Méthode pour récupérer tous les objets d'un store
   */
  async getAll(storeName) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Méthode pour récupérer par index
   */
  async getAllByIndex(storeName, indexName, value) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Méthode pour supprimer un objet
   */
  async delete(storeName, key) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Méthode pour vider un store (attention!)
   */
  async clear(storeName) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Ajouter à la file de synchronisation
   */
  async addToSyncQueue(entityType, entityUuid, action, payload) {
    const queueItem = {
      entityType,
      entityUuid,
      action, // 'create', 'update', 'delete'
      payload: JSON.stringify(payload),
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      attempts: 0
    };

    return await this.put('syncQueue', queueItem);
  }

  /**
   * Récupérer les éléments en attente de synchro
   */
  async getPendingSyncItems() {
    return await this.getAllByIndex('syncQueue', 'syncStatus', 'pending');
  }

  /**
   * Marquer un élément comme synchronisé
   */
  async markAsSynced(queueId) {
    const item = await this.get('syncQueue', queueId);
    if (item) {
      item.syncStatus = 'synced';
      item.syncedAt = new Date().toISOString();
      await this.put('syncQueue', item);
    }
  }
}

// Export d'une instance unique (Singleton)
const fitnessDB = new FitnessDB();

// Auto-initialisation au chargement
(async () => {
  try {
    await fitnessDB.init();
  } catch (error) {
    console.error('❌ Erreur d\'initialisation IndexedDB:', error);
  }
})();

// Export global pour utilisation dans d'autres modules
if (typeof window !== 'undefined') {
  window.fitnessDB = fitnessDB;
}