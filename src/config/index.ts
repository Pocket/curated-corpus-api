// Environment variables below are set in .aws/src/main.ts
export default {
  app: {
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    pagination: {
      approvedItemsPerPage: 30,
      rejectedItemsPerPage: 30,
      maxAllowedResults: 100,
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
};
