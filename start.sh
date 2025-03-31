#!/bin/sh

if ! command -v deno >/dev/null 2>&1; then
  echo "installing deno..."
  sh setup.sh
fi

if [ ! -f .env ]; then
  echo "making .env..."
  cp example.env .env
fi

sh run.sh # deno run --allow-import --allow-read --allow-write --allow-net --allow-env --env-file ./main.ts
