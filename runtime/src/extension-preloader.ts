// This module is based on the work done by EL20202 in his extension asset preloader mod:
// https://github.com/EL20202/crosscode-extension-asset-preloader/blob/master/postload.js
// Fixes files from extensions potentially not being loaded during the game's loading

import { getInstalledExtensions } from '../../dist/files.js';
import * as paths from '../../common/dist/paths.js';
import * as files from '../../dist/files.js';
import * as configM from '../../dist/config.js';

declare global {
  namespace modloader {
    var config: configM.Config
  }
}

const extensionFolder = paths.join(modloader.config.gameAssetsDir, 'extension');
const exts = await getInstalledExtensions(modloader.config);
for (const extensionName of exts) {
  const filepath = paths.join(extensionFolder, extensionName);
  const isReadable = await files.isReadable(`${filepath}/${extensionName}.json`);
  if (isReadable) {
    const text = await files.loadText(`${filepath}/${extensionName}.json`);
    const data = JSON.parse(text);

    if (!data.files) break;

    for (const extFile of data.files) {
      ig.fileForwarding[extFile] = `extension/${extensionName}/${extFile}`;
    }
  }
}
