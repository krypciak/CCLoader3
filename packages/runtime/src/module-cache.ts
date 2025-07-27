import * as impactInitHooks from './impact-init-hooks';

let oldLoadScript: typeof ig._loadScript | undefined;
export const prefixes = new Map<string, string>();

function registerModPrefix(prefix: string, path: string): void {
  prefixes.set(prefix, path);
}

impactInitHooks.add(() => {
  oldLoadScript = ig._loadScript;

  function _loadScript(moduleName: string, requirer?: string): void {
    if (moduleName.includes('.')) {
      const root = moduleName.split('.')[0];
      let path = prefixes.get(root);
      if (path) {
        ig.lib = path;
      }
    }

    oldLoadScript!(moduleName, requirer);

    ig.lib = '';
  }

  ig._loadScript = _loadScript;
});

export const namespace: typeof ccmod.moduleCache = {
  prefixes,
  registerModPrefix,
};
