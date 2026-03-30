#!/bin/bash

start_time=$(date +%s)
echo "Deploying DaryWin backend server..."

cd /opt/darywin
git pull
chmod +x -R /opt/darywin/__scripts

/bin/bash /opt/darywin/__scripts/free-mem.sh

docker compose up -d --build dw-backend
docker image prune -f

docker compose ps

/bin/bash /opt/darywin/__scripts/free-mem.sh

finish_time=$(date +%s)
elapsed_time=$((finish_time - start_time))
((sec=elapsed_time%60, elapsed_time/=60, min=elapsed_time%60))
timestamp=$(printf "DaryWin API deployed in %d minutes and %d seconds." $min $sec)
echo "$timestamp"
