import {
  LegacyManifest,
  Manifest,
} from 'ultimate-crosscode-typedefs/file-types/mod-manifest';

export function convertFromLegacy(data: LegacyManifest): Manifest {
  return {
    id: data.name,
    version: data.version || "1.0.0",
    license: data.license,

    title: data.ccmodHumanName,
    description: data.description,
    homepage: data.homepage,
    icons: data.icons,

    dependencies: data.ccmodDependencies ?? data.dependencies,

    assets: data.assets?.map((path) => (path.startsWith('assets/') ? path.slice(7) : path)),

    plugin: data.plugin,
    preload: data.preload,
    postload: data.postload,
    prestart: data.prestart,
    poststart: data.main,
  };
}
