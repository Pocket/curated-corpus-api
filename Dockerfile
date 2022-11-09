FROM node:16@sha256:496085d0cd8edf49c97ec86ac11bed85b6f965d9b29885887bb0edba26549b07

WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4025
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
