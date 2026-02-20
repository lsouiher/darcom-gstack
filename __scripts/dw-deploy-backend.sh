#!/bin/bash

start_time=$(date +%s)
echo "Deploying DaryWin backend server..."

cd /opt/darywin
git pull
chmod +x -R /opt/darywin/__scripts

/bin/bash /opt/darywin/__scripts/free-mem.sh

cd /opt/darywin/backend

npm install

sudo systemctl restart darywin
sudo systemctl status darywin --no-pager

/bin/bash /opt/darywin/__scripts/free-mem.sh

finish_time=$(date +%s)
elapsed_time=$((finish_time - start_time))
((sec=elapsed_time%60, elapsed_time/=60, min=elapsed_time%60))
timestamp=$(printf "DaryWin API deployed in %d minutes and %d seconds." $min $sec)
echo "$timestamp"

#$SHEL
