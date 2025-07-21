import { fs, configure } from '@zenfs/core';
import { Zip } from '@zenfs/archives';

export type ServiceWorkerPacket = {
  path: string;
  data: Buffer<ArrayBufferLike>;
};

export async function loadServiceWorker(): Promise<ServiceWorker> {
  const currentRegistration = await window.navigator.serviceWorker.getRegistration();
  if (currentRegistration) {
    //Do not await update since the worker only performs a simple task. Even if there is a bugfix it should be enough to not crash.
    currentRegistration.update();
  } else {
    const path = 'ccmod-service-worker.js';
    await window.navigator.serviceWorker.register(path, {
      updateViaCache: 'none',
      type: 'module',
      scope: '/ccloader3/',
    });
  }

  const controller = window.navigator.serviceWorker.controller;
  if (!controller || controller.state !== 'activated') {
    window.location.reload();
    window.location.href = window.location.toString();
    history.go(0);

    throw new Error('(╯°□°）╯︵ ┻━┻');
  }

  setMessageHandling();

  return controller;
}

function sendMessage(packet: unknown) {
  const controller = window.navigator.serviceWorker.controller;
  controller?.postMessage(packet);
}

function setMessageHandling() {
  navigator.serviceWorker.onmessage = async (event) => {
    const path: string = event.data;

    const data = await fs.promises.readFile(path);

    const packet: ServiceWorkerPacket = {
      path,
      data,
    };
    sendMessage(packet);
  };
}

let validCCModPaths: string[] | undefined;
export function isCCModPath(path: string): boolean {
  if (!validCCModPaths) return false;

  if (path[0] != '/') path = '/' + path;
  return validCCModPaths.some(
    (pathPrefix) => path.length > pathPrefix.length && path.startsWith(pathPrefix),
  );
}

export async function loadCCMods(allModsList: Array<{ parentDir: string; dir: string }>) {
  const ccmods: typeof allModsList = allModsList.filter((mod) => mod.dir.endsWith('.ccmod'));
  const ccmodArrayBuffers = await Promise.all(
    ccmods.map(async (mod) => (await fetch('../' + mod.dir)).arrayBuffer()),
  );

  const mounts: Parameters<typeof configure>[0]['mounts'] = Object.fromEntries(
    ccmods.map((mod, i) => [mod.dir, { backend: Zip, data: ccmodArrayBuffers[i] }]),
  );

  await configure({
    mounts,
  });

  validCCModPaths = ccmods.map((mod) => '/' + mod.dir);
  sendMessage(validCCModPaths);
}
