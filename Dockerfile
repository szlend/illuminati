FROM node:10-stretch-slim AS build

WORKDIR /app
RUN apt-get -y update \
  && apt-get -y install libopencv-dev \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY package.json package.json
RUN npm install && npm cache clean --force

FROM node:10-stretch-slim

RUN apt-get -y update \
  && apt-get -y install \
  dumb-init \
  libopencv-contrib2.4v5 \
  libopencv-gpu2.4v5 \
  libopencv-ocl2.4v5 \
  libopencv-stitching2.4v5 \
  libopencv-superres2.4v5 \
  libopencv-ts2.4v5 \
  libopencv-videostab2.4v5 \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --from=build /app/node_modules /app/node_modules
COPY illuminati.js /app/illuminati.js
RUN mkdir /app/tmp

WORKDIR /app
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "illuminati.js"]
EXPOSE 3000
