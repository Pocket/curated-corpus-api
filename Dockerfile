FROM node:17@sha256:ae921ff92ea8dfc9e3a0416378e073054ecfaddc3ab918b3a7e4990fffa7a581

WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4025
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
