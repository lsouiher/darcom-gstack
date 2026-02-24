#!/bin/bash

start_time=$(date +%s)
echo "Deploying DaryWin frontend..."

cd /opt/darywin
git pull
sudo chmod +x -R /opt/darywin/__scripts

/bin/bash /opt/darywin/__scripts/free-mem.sh

cd /opt/darywin/frontend

npm install --force
npm run build

sudo rm -rf /var/www/darywin/frontend
sudo mkdir -p /var/www/darywin/frontend
sudo cp -rf build/* /var/www/darywin/frontend

sudo rm -rf /var/cache/nginx
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager

/bin/bash /opt/darywin/__scripts/free-mem.sh

finish_time=$(date +%s)
elapsed_time=$((finish_time - start_time))
((sec=elapsed_time%60, elapsed_time/=60, min=elapsed_time%60))
timestamp=$(printf "DaryWin frontend deployed in %d minutes and %d seconds." $min $sec)
echo "$timestamp"

#$SHELL
