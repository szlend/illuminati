FROM node:10

WORKDIR /app
RUN \
  apt-get -y update && \
  apt-get -y install dumb-init libopencv-dev && \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY package.json package.json
RUN mkdir tmp && npm install

COPY illuminati.js illuminati.js
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "illuminati.js"]
EXPOSE 3000
