FROM node:16@sha256:241f152c0dc9d3efcbd6a4426f52dc50fa78f3a63cff55b2419dc2bf48efe705

WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4025
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
