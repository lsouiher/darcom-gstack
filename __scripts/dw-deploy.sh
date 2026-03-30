#!/usr/bin/env bash

if [ "$1" == "all" ]; then
  cd /opt/darywin
  git pull
  chmod +x -R /opt/darywin/__scripts
  /bin/bash /opt/darywin/__scripts/free-mem.sh
  docker compose up -d --build
  docker image prune -f
  docker compose ps
  /bin/bash /opt/darywin/__scripts/free-mem.sh
elif [ "$1" == "ui" ]; then
  /bin/bash /opt/darywin/__scripts/dw-deploy-admin.sh
  /bin/bash /opt/darywin/__scripts/dw-deploy-frontend.sh
elif [ "$1" == "backend" ]; then
  /bin/bash /opt/darywin/__scripts/dw-deploy-backend.sh
elif [ "$1" == "admin" ]; then
  /bin/bash /opt/darywin/__scripts/dw-deploy-admin.sh
elif [ "$1" == "frontend" ]; then
  /bin/bash /opt/darywin/__scripts/dw-deploy-frontend.sh
else
  echo "Usage: dw-deploy all|ui|backend|admin|frontend"
fi
