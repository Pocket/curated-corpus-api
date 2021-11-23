const awsEnvironments = ['production', 'development'];
let localEndpoint;
if (!awsEnvironments.includes(process.env.NODE_ENV ?? '')) {
  localEndpoint = process.env.AWS_S3_ENDPOINT || 'http://localhost:4566';
}

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
    upload: {
      maxSize: 10000000, // in bytes => 10MB
      maxFiles: 10,
    },
  },
  aws: {
    s3: {
      localEndpoint,
      bucket: process.env.AWS_S3_BUCKET || 'curated-corpus-api-local-images',
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
};
