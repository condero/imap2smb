#!/bin/sh
set -e

# Ensure log file exists and is writable
touch /var/log/cron.log
chmod 0666 /var/log/cron.log

# Start cron
cron

# Run the Node.js script once immediately
echo "Running initial script execution..."
node index.js >> /var/log/cron.log 2>&1

# Keep the container running
echo "Container is now running..."
tail -f /var/log/cron.log &

# Wait forever
while true; do
  sleep 1
done
