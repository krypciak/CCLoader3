import type { ServiceWorkerPacket } from './service-worker-bridge';

self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

const CONTENT_TYPES: Record<string, string> = {
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  html: 'text/html',
  htm: 'text/html',
};

function contentType(url: string): string {
  return CONTENT_TYPES[url.substring(url.lastIndexOf('.') + 1)] || 'text/plain';
}

async function post(data: unknown) {
  const clients = await self.clients.matchAll();
  const client = clients[0];
  client.postMessage(data);
}

const waitingFor: Map<string, (packet: ServiceWorkerPacket) => void> = new Map();

async function requestContents(path: string): Promise<Response> {
  let resolve!: (packet: ServiceWorkerPacket) => void;
  const promise: Promise<ServiceWorkerPacket> = new Promise((res) => (resolve = res));
  await post(path);

  waitingFor.set(path, resolve);

  const { data } = await promise;
  if (!data) {
    return fetch(path);
  } else {
    return new Response(data, {
      headers: {
        'Content-Type': contentType(path),
      },
      status: 200,
      statusText: 'ok',
    });
  }
}

let validPaths: string[] | undefined;

self.addEventListener('message', async (event) => {
  if (Array.isArray(event.data)) {
    validPaths = event.data;
  } else {
    const packet: ServiceWorkerPacket = event.data;
    const resolve = waitingFor.get(packet.path)!;
    resolve(packet);
    waitingFor.delete(packet.path);
  }
});

self.addEventListener('fetch', async (event: FetchEvent) => {
  if (!validPaths) return;

  const request = event.request;
  const path = new URL(request.url).pathname;

  if (
    validPaths.some((pathPrefix) => path.length > pathPrefix.length && path.startsWith(pathPrefix))
  ) {
    event.respondWith(requestContents(path));
  }
});
