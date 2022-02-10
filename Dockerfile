FROM node:17@sha256:88becea956ea5ec0262b8aac011a234f95310e5cacc38cc9d2468a836d67ffc9

WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4025
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
