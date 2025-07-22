import { unzipSync, type Unzipped } from 'fflate/browser';
import { sendServiceWorkerMessage } from './service-worker-bridge';

const files = new Map<string, Unzipped>();

function findPrefix(path: string): [string, string] | undefined {
  if (path[0] == '/') path = path.substring(1);
  const prefix = [...files.keys()].find((dir) => path.startsWith(dir));

  if (!prefix) return;

  path = path.substring(prefix.length + 1);
  return [path, prefix];
}

export async function isReadable(path: string): Promise<boolean> {
  return !!findPrefix(path);
}

export async function loadText(path: string): Promise<string | undefined> {
  const buf = await readFile(path);
  if (!buf) return;

  return new TextDecoder('utf-8').decode(buf);
}

export async function readFile(path: string): Promise<ArrayBuffer | undefined> {
  const prefixObj = findPrefix(path);
  if (!prefixObj) return;
  const [relativePath, prefix] = prefixObj;

  const unzipped = files.get(prefix)!;

  const data = unzipped[relativePath];

  return data.buffer;
}

export async function findRecursively(dir: string): Promise<string[] | undefined> {
  const prefixObj = findPrefix(dir);
  if (!prefixObj) return;
  const [relativePath, prefix] = prefixObj;

  const unzipped = files.get(prefix)!;

  const dirs = Object.keys(unzipped)
    .filter((path) => !path.endsWith('/') && path.startsWith(relativePath))
    .map((dir) => dir.substring(relativePath.length));
  return dirs;
}

export async function loadCCMods(
  allModsList: Array<{ parentDir: string; dir: string }>,
): Promise<void> {
  const ccmods: typeof allModsList = allModsList.filter((mod) => mod.dir.endsWith('.ccmod'));
  const ccmodArrayBuffers = await Promise.all(
    ccmods.map(async (mod) => (await fetch(`../${mod.dir}`)).bytes()),
  );

  // console.time('uncompress');
  const uncompressed = ccmodArrayBuffers.map((buf) => unzipSync(buf));
  // console.timeEnd('uncompress');

  for (let i = 0; i < ccmods.length; i++) {
    const mod = ccmods[i];
    const buf = uncompressed[i];
    files.set(mod.dir, buf);
  }

  sendServiceWorkerMessage(ccmods.map((mod) => `/${mod.dir}`));
}
