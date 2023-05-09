import * as configM from '../dist/config.js';

export {};

declare global {
  namespace modloader {
    var _runtimeMod: Mod;
    var config: configM.Config;
  }

  var CrossAndroid: { executePostGameLoad(): void };
  var CrossAndroidModListProvider: { getModListAsJson(): string };
  var CrossAndroidExtensionListProvider: { getExtensionListAsJson(): string };
}
