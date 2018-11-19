FROM ubuntu:16.04

# basic sh loading
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# installing a buch of packets
RUN apt-get update -y && \
    apt-get install -y bcrypt zip unzip git curl\
    nginx tar bzip2 python gcc make build-essential \
    software-properties-common wget redis-server

# installing nodejs
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get update && \
    apt-get install -y nodejs

RUN npm install -g knex

# installation de nodejs
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get update && \
    apt-get install -y nodejs

CMD touch /var/log/001.txt && tail -f /var/log/001.txt


