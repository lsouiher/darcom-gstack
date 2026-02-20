#!/usr/bin/env bash

if [ "$1" == "all" ]; then
  /bin/bash /opt/darywin/__scripts/dw-deploy-backend.sh
  /bin/bash /opt/darywin/__scripts/dw-deploy-admin.sh
  /bin/bash /opt/darywin/__scripts/dw-deploy-frontend.sh
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
