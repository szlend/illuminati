FROM node:latest

WORKDIR /app
RUN \
  apt-get -y update && \
  apt-get -y install libopencv-dev && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY package.json package.json
RUN mkdir tmp && npm install

COPY illuminati.js illuminati.js
CMD nodejs illuminati.js
