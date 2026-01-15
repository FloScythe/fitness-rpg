/**
 * FitnessRPG - Service Worker
 * Gestion du cache et mode offline
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `fitness-rpg-${CACHE_VERSION}`;

// Fichiers à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',

  // CSS
  '/css/variables.css',
  '/css/reset.css',
  '/css/layout.css',
  '/css/components.css',

  // JavaScript - Core
  '/js/app.js',
  '/js/router.js',

  // JavaScript - Database
  '/js/db/indexeddb.js',
  '/js/db/sync-queue.js',

  // JavaScript - Modules
  '/js/modules/rpg.js',
  '/js/modules/workout.js',
  '/js/modules/smart-coach.js',
  '/js/modules/stats.js',

  // JavaScript - UI
  '/js/ui/components.js',
  '/js/ui/notifications.js',
  '/js/ui/timer.js',

  // JavaScript - Utils
  '/js/utils/helpers.js',
  '/js/utils/constants.js',
  '/js/utils/exercises-seed.js',

  // Icônes
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

// ═══════════════════════════════════════════════════════════
// INSTALLATION - Mise en cache des assets statiques
// ═══════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Mise en cache des assets statiques');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] ✅ Installation terminée');
        return self.skipWaiting(); // Activer immédiatement
      })
      .catch((error) => {
        console.error('[SW] ❌ Erreur lors de l\'installation:', error);
      })
  );
});

// ═══════════════════════════════════════════════════════════
// ACTIVATION - Nettoyage des anciens caches
// ═══════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] 🗑️ Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] ✅ Activation terminée');
        return self.clients.claim(); // Prendre le contrôle immédiatement
      })
  );
});

// ═══════════════════════════════════════════════════════════
// FETCH - Stratégie de cache
// ═══════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes vers l'API (laisser la sync-queue gérer)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Stratégie: Cache First, puis Network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Trouvé dans le cache
          console.log('[SW] 📦 Servi depuis le cache:', url.pathname);

          // Mettre à jour le cache en arrière-plan (stale-while-revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
          }).catch(() => {
            // Pas de réseau, pas grave, on a le cache
          });

          return cachedResponse;
        }

        // Pas dans le cache, aller sur le réseau
        console.log('[SW] 🌐 Requête réseau:', url.pathname);
        return fetch(request)
          .then((networkResponse) => {
            // Vérifier que la réponse est valide
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }

            // Mettre en cache pour la prochaine fois
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });

            return networkResponse;
          })
          .catch(() => {
            // Offline et pas dans le cache
            console.log('[SW] ❌ Offline, ressource non disponible:', url.pathname);

            // Retourner une page offline si c'est une navigation
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// ═══════════════════════════════════════════════════════════
// BACKGROUND SYNC - Synchronisation en arrière-plan
// ═══════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background Sync déclenché:', event.tag);

  if (event.tag === 'sync-workouts') {
    event.waitUntil(syncWorkouts());
  }
});

async function syncWorkouts() {
  try {
    console.log('[SW] Tentative de synchronisation des séances...');

    // Ouvrir IndexedDB et récupérer la file d'attente
    const db = await openDB();
    const pendingItems = await getPendingSyncItems(db);

    if (pendingItems.length === 0) {
      console.log('[SW] ✅ Rien à synchroniser');
      return;
    }

    console.log(`[SW] 📤 Synchronisation de ${pendingItems.length} éléments...`);

    // Envoyer au serveur
    const response = await fetch('/api/sync/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({ items: pendingItems })
    });

    if (response.ok) {
      console.log('[SW] ✅ Synchronisation réussie');
      await markItemsAsSynced(db, pendingItems);
    } else {
      console.error('[SW] ❌ Échec de la synchronisation');
    }

  } catch (error) {
    console.error('[SW] ❌ Erreur de synchronisation:', error);
    throw error; // Relancer pour retry automatique
  }
}

// Helpers pour IndexedDB (version simplifiée)
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FitnessRPG', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getPendingSyncItems(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const index = store.index('syncStatus');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function markItemsAsSynced(db, items) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');

    items.forEach(item => {
      item.syncStatus = 'synced';
      item.syncedAt = new Date().toISOString();
      store.put(item);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function getAuthToken() {
  // Récupérer le token depuis le localStorage (accessible via clients)
  return self.clients.matchAll().then(clients => {
    if (clients.length > 0) {
      return clients[0].postMessage({ type: 'GET_AUTH_TOKEN' });
    }
    return null;
  });
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS PUSH (pour futures fonctionnalités)
// ═══════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/badge-72.png',
    vibrate: [200, 100, 200],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'FitnessRPG', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[SW] 🚀 Service Worker chargé');