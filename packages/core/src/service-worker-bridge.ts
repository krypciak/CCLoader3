export async function loadServiceWorker(): Promise<ServiceWorker> {
  const currentRegistration = await window.navigator.serviceWorker.getRegistration();
  if (currentRegistration) {
    //Do not await update since the worker only performs a simple task. Even if there is a bugfix it should be enough to not crash.
    void currentRegistration.update();
  } else {
    const path = 'dist-ccmod-service-worker.js';
    await window.navigator.serviceWorker.register(path, {
      updateViaCache: 'none',
      type: 'module',
      scope: '/ccloader3/',
    });
  }

  const { controller } = window.navigator.serviceWorker;
  if (!controller || controller.state !== 'activated') {
    window.location.reload();
    window.location.href = window.location.toString();
    history.go(0);

    throw new Error('(╯°□°）╯︵ ┻━┻');
  }

  setMessageHandling();

  return controller;
}

function sendServiceWorkerMessage(packet: unknown): void {
  const { controller } = window.navigator.serviceWorker;
  controller?.postMessage(packet);
}

export type FetchHandler = (path: string) => Promise<ArrayBuffer | null>;
const fetchHandlers: FetchHandler[] = [];
const validPathPrefixes: string[] = [];

export function addFetchHandler(pathPrefixes: string[], handler: FetchHandler): void {
  fetchHandlers.push(handler);
  validPathPrefixes.push(...pathPrefixes);

  sendServiceWorkerMessage(validPathPrefixes.map((path) => `/${path}`));
}

export interface ServiceWorkerPacket {
  path: string;
  data: ArrayBuffer;
}

function setMessageHandling(): void {
  navigator.serviceWorker.onmessage = async (event) => {
    const path: string = event.data;

    let data: ArrayBuffer | null = null;
    for (const handler of fetchHandlers) {
      data = await handler(path);
      if (data) break;
    }
    if (!data) throw new Error(`path: "${path}" was not handled!`);

    const packet: ServiceWorkerPacket = {
      path,
      data,
    };
    sendServiceWorkerMessage(packet);
  };
}
