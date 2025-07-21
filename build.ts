import * as esbuild from 'esbuild';
import copyStaticFiles from 'esbuild-copy-static-files';
import path from 'path';
import * as fs from 'fs';

const isWatch = process.argv[2] == 'watch';

function donePlugin(outfile: string, modifyCode?: (code: string) => string): esbuild.Plugin {
  return {
    name: 'done plugin',
    setup(build) {
      build.onEnd(async (res) => {
        let code = res.outputFiles![0].text;
        if (!code) return; // when compile errors

        if (modifyCode) code = modifyCode(code);

        await fs.promises.writeFile(outfile, code);

        const bytes = code.length;
        const kb = bytes / 1024;
        console.log(outfile, kb.toFixed(1) + 'kb');
      });
    },
  };
}


function core(): esbuild.BuildOptions {
  const outfile = path.join('./dist', `core.js`);

  return {
    entryPoints: ['packages/core/src/main.ts'],

    format: 'esm',
    platform: 'node',

    write: false,
    bundle: true,
    minify: false,
    sourcemap: 'inline',

    plugins: [
      donePlugin(outfile),
    ],
  };
}

function runtime(): esbuild.BuildOptions {
  const outfile = path.join('./dist', 'runtime', 'main.js');

  return {
    entryPoints: ['packages/runtime/src/_main.ts'],

    format: 'esm',
    platform: 'node',

    write: false,
    bundle: true,
    minify: true,
    sourcemap: 'inline',

    plugins: [
      copyStaticFiles({
        src: `./packages/runtime/ccmod.json`,
        dest: `./dist/runtime/ccmod.json`,
      }),
      copyStaticFiles({
        src: `./packages/runtime/media`,
        dest: `./dist/runtime/media`,
      }),
      copyStaticFiles({
        src: `./packages/runtime/assets`,
        dest: `./dist/runtime/assets`,
      }),
      donePlugin(outfile),
    ],
  };
}

const modules: (() => esbuild.BuildOptions)[] = [core, runtime];

if (isWatch) {
  console.clear();
  await Promise.all(
    modules.map(async (module) => {
      const ctx = await esbuild.context(module());
      await ctx.watch();
    }),
  );
} else {
  await Promise.all(
    modules.map(async (module) => {
      await esbuild.build(module());
    }),
  );
  process.exit(); // because esbuild keeps the process alive for some reason
}
