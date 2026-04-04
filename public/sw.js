// ZTO Arena Service Worker
// Caches arena pages for offline use
// Silently queues failed API calls and replays on reconnect

const CACHE_NAME = 'zto-arena-v1';
const OFFLINE_QUEUE_KEY = 'zto_arena_offline_queue';

// Assets to pre-cache
const PRECACHE_URLS = [
  '/',
  '/arena',
];

// API routes that need offline queuing (POST requests)
const QUEUEABLE_ROUTES = [
  '/api/arena/score',
  '/api/arena/match-end',
];

// ——————————————————————————————————————————————————
// INSTALL — pre-cache shell
// ——————————————————————————————————————————————————
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {
        // Non-fatal — some URLs may not be available during install
      })
    )
  );
  self.skipWaiting();
});

// ——————————————————————————————————————————————————
// ACTIVATE — clean old caches
// ——————————————————————————————————————————————————
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ——————————————————————————————————————————————————
// FETCH — intercept requests
// ——————————————————————————————————————————————————
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // POST to arena API — queue if offline
  if (request.method === 'POST' && QUEUEABLE_ROUTES.some((r) => url.pathname.startsWith(r))) {
    event.respondWith(handleQueueablePost(request));
    return;
  }

  // GET requests — network first, cache fallback
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response('Offline', { status: 503 })))
    );
  }
});

// ——————————————————————————————————————————————————
// HANDLE QUEUEABLE POST
// If online: send immediately
// If offline: queue to IndexedDB/localStorage-over-postMessage
// ——————————————————————————————————————————————————
async function handleQueueablePost(request) {
  try {
    const response = await fetch(request.clone());
    return response;
  } catch {
    // Offline — clone body and queue
    const body = await request.text();
    await queueRequest({
      id: crypto.randomUUID(),
      url: request.url,
      method: 'POST',
      body,
      timestamp: Date.now(),
      retries: 0,
    });
    // Return synthetic success so the client doesn't see an error
    return new Response(JSON.stringify({ ok: true, queued: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ——————————————————————————————————————————————————
// QUEUE MANAGEMENT (via client message passing)
// ——————————————————————————————————————————————————
const pendingQueue = [];

async function queueRequest(item) {
  pendingQueue.push(item);
  // Notify all clients about queue status
  const clients = await self.clients.matchAll();
  clients.forEach((client) =>
    client.postMessage({ type: 'OFFLINE_QUEUE_UPDATE', count: pendingQueue.length })
  );
}

// ——————————————————————————————————————————————————
// SYNC — replay queue when back online
// ——————————————————————————————————————————————————
self.addEventListener('sync', (event) => {
  if (event.tag === 'arena-score-sync') {
    event.waitUntil(replayQueue());
  }
});

// Also listen for online event via message
self.addEventListener('message', (event) => {
  if (event.data?.type === 'REPLAY_QUEUE') {
    replayQueue();
  }
});

async function replayQueue() {
  const failed = [];
  while (pendingQueue.length > 0) {
    const item = pendingQueue.shift();
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body,
      });
      if (!res.ok) failed.push(item);
    } catch {
      failed.push(item);
    }
  }
  pendingQueue.push(...failed);

  // Notify clients
  if (failed.length === 0) {
    const clients = await self.clients.matchAll();
    clients.forEach((c) => c.postMessage({ type: 'SYNC_COMPLETE', replayed: true }));
  }
}
