import { type Unzipped, unzipSync } from 'fflate/browser';
import { addFetchHandler } from './service-worker-bridge';

const files = new Map<string, Unzipped>();

function findPrefix(path: string): [string, string] | null {
  if (path.startsWith('/')) path = path.substring(1);
  const prefix = [...files.keys()].find((dir) => path.startsWith(dir));

  if (!prefix) return null;

  path = path.substring(prefix.length + 1);
  return [path, prefix];
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function isReadable(path: string): Promise<boolean> {
  return Boolean(findPrefix(path));
}

export async function loadText(path: string): Promise<string | null> {
  const buf = await readFile(path);
  if (!buf) return null;

  return new TextDecoder('utf-8').decode(buf);
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function readFile(path: string): Promise<ArrayBuffer | null> {
  const prefixObj = findPrefix(path);
  if (!prefixObj) return null;
  const [relativePath, prefix] = prefixObj;

  const unzipped = files.get(prefix)!;

  const data = unzipped[relativePath];

  return data.buffer;
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function findRecursively(dir: string): Promise<string[] | null> {
  const prefixObj = findPrefix(dir);
  if (!prefixObj) return null;
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

  addFetchHandler(
    ccmods.map((mod) => mod.dir),
    readFile,
  );
}
