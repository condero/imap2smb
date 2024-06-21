FROM node:14
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN apt-get update && apt-get install -y cron
COPY crontab /etc/cron.d/fax-cron
RUN chmod 0644 /etc/cron.d/fax-cron
RUN crontab /etc/cron.d/fax-cron
RUN touch /var/log/cron.log && chmod 0666 /var/log/cron.log
CMD ["/bin/sh", "-c", "/usr/src/app/run.sh"]
