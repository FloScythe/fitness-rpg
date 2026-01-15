/**
 * Storage - Gestion simple d'IndexedDB
 */

const Storage = {
  dbName: 'FitnessRPG',
  version: 1,
  db: null,

  /**
   * Initialiser la base de données
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialisée');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store: user
        if (!db.objectStoreNames.contains('user')) {
          const userStore = db.createObjectStore('user', { keyPath: 'uuid' });
          userStore.createIndex('username', 'username', { unique: true });
          console.log('✅ Store "user" créé');
        }

        // Store: workouts (pour plus tard)
        if (!db.objectStoreNames.contains('workouts')) {
          const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
          workoutStore.createIndex('date', 'date', { unique: false });
          console.log('✅ Store "workouts" créé');
        }
      };
    });
  },

  /**
   * Sauvegarder un objet
   */
  async save(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Vérifier que l'objet a la clé primaire requise
    const keyPath = store.keyPath;
    if (keyPath && !data[keyPath]) {
      console.error(`❌ Objet manque la clé primaire '${keyPath}':`, data);
      return Promise.reject(new Error(`Object is missing required key '${keyPath}'`));
    }

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => {
        console.log(`✅ Sauvegardé dans '${storeName}':`, data[keyPath]);
        resolve(request.result);
      };
      request.onerror = () => {
        console.error(`❌ Erreur sauvegarde '${storeName}':`, request.error);
        reject(request.error);
      };
    });
  },

  /**
   * Récupérer un objet par clé
   */
  async get(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Récupérer tous les objets
   */
  async getAll(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Supprimer un objet
   */
  async delete(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Vider un store
   */
  async clear(storeName) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

// Initialiser au chargement
Storage.init().catch(err => console.error('❌ Erreur IndexedDB:', err));
