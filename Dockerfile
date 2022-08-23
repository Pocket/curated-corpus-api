FROM node:16@sha256:d8d3181ca9840f6667ae8694c35511af806e31c45f9c4fa5f80328b0b2c1dc44

WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4025
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
