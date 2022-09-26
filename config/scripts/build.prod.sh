export NODE_ENV=prod

npx tsc &&
npx tsc --module CommonJS --outdir ./dist/commonjs &&
npx webpack 