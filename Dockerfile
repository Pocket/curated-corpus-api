FROM node:18@sha256:f4698d49371c8a9fa7dd78b97fb2a532213903066e47966542b3b1d403449da4

WORKDIR /usr/src/app

ARG GIT_SHA

COPY . .

ENV NODE_ENV=production
ENV PORT 4025
ENV GIT_SHA=${GIT_SHA}

EXPOSE ${PORT}

# Override the connection on the database_url, to avoid
# "Timed out fetching a new connection from the connection pool"
# https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#increasing-the-pool-size
# Aurora Serverless has a connection limit of 2,000:
# https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.setting-capacity.html
# Value of 50 was chosen arbitrarily because it is 10x the original value of 5.
CMD sh -c 'export MODIFIED_DATABASE_URL="${DATABASE_URL}?connection_limit=50" && npm start'
