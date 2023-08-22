# CCLoader3

[![CI Status](https://github.com/CCDirectLink/CCLoader3/workflows/CI/badge.svg)](https://github.com/CCDirectLink/CCLoader3/actions?query=workflow:CI)

A temporary repository for _The Third Version of
[CCLoader](https://github.com/CCDirectLink/CCLoader)_. Project is currently under construction. I
promise, **there will be documentation here**.

**Precompiled builds can be downloaded from:**
https://stronghold.openkrosskod.org/~dmitmel/ccloader3/

## Building from source

```bash
cd /somewhere/but/preferably/inside/the/crosscode/directory
git clone https://github.com/CCDirectLink/CCLoader3.git ccloader3
cd ccloader3
npm install
mv runtime/src/extension-preloader.ts .
npm run build
mv extension-preloader.ts runtime/src
npm run build
```

Yes, that moving about of the extension-preloader is intentional and required. It is a bug in how
TypeScript compiles files in alphabetical order, and the extension-preloader requires a file that
has not been built yet according to the alphabetical order. This will be fixed once the module
structure of the modloader is redone.

Then edit the game's `package.json` and point the path in the `main` field to the location of the
`main.html` page in the `ccloader3` directory.

## Attribution

CCLoader3 was written by [dmitmel](https://github.com/dmitmel). All work up until
[this commit](https://github.com/CCDirectLink/CCLoader3/tree/9646ae3c68057ce6babf400afd40a392562586bd)
was done by him.
