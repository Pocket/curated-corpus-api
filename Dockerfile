FROM node:18@sha256:19892542dd80e33aec50a51619ab36db0921de240c6a4ff6024d801f84881293

WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4025
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

CMD ["npm", "start"]
