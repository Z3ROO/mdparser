#!/bin/bash -e

export NODE_ENV=dev
set -m 

initServer() (
  npx tsc && npx webpack serve --open
)

cleanUp() (
  rm -rf ./dist
)

trap cleanUp EXIT
initServer