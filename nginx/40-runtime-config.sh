#!/bin/sh
set -eu
envsubst '${SENTRY_DSN} ${SENTRY_ENVIRONMENT} ${SENTRY_RELEASE}' \
  < /usr/share/nginx/html/runtime-config.template.js \
  > /usr/share/nginx/html/runtime-config.js
