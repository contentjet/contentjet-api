#!/bin/bash
# Handles starting the app within docker, specifically handling the case of
# Postgres not being available immediately.
# See https://docs.docker.com/compose/startup-order/

set -e

until npm run migrate; do
  >&2 echo "**********************************"
  >&2 echo "Postgres is unavailable - sleeping"
  >&2 echo "**********************************"
  sleep 1
done

npm start
