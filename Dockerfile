FROM node:latest

WORKDIR /app
RUN \
  apt-get -y update && \
  apt-get -y install libopencv-dev && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
  npm install -g forever

COPY package.json package.json
RUN mkdir tmp && npm install

COPY illuminati.js illuminati.js
CMD forever nodejs illuminati.js
