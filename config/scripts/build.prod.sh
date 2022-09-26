export NODE_ENV=prod

npx tsc
npx tsc --module CommonJS --outdir ./dist/commonjs

mv ./dist/esm/index.js ./dist/esm/index.mjs
mv ./dist/commonjs/index.js ./dist/commonjs/index.cjs