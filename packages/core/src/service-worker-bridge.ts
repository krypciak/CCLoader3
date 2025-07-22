import * as filesCCMod from './files.ccmod';

export interface ServiceWorkerPacket {
  path: string;
  data: Buffer | undefined;
}

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

export function sendServiceWorkerMessage(packet: unknown): void {
  const { controller } = window.navigator.serviceWorker;
  controller?.postMessage(packet);
}

function setMessageHandling(): void {
  navigator.serviceWorker.onmessage = async (event) => {
    const path: string = event.data;

    const data = await filesCCMod.readFile(path);

    const packet: ServiceWorkerPacket = {
      path,
      data,
    };
    sendServiceWorkerMessage(packet);
  };
}
