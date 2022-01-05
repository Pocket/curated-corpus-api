import {
  ReviewedCorpusItemEventType,
  ScheduledCorpusItemEventType,
} from '../events/types';

// Work out the AWS/localstack endpoint
const awsEnvironments = ['production', 'development'];
let localEndpoint;
if (!awsEnvironments.includes(process.env.NODE_ENV ?? '')) {
  localEndpoint = process.env.AWS_S3_ENDPOINT || 'http://localhost:4566';
}

// Work out the Snowplow HTTP protocol.
const snowplowHttpProtocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'http';

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
  events: {
    source: 'curated-corpus-api',
    // TODO: what should this value be? See list-api, user-api with similar comments
    version: '0.0.2',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
  },
  snowplow: {
    endpoint: process.env.SNOWPLOW_ENDPOINT || 'localhost:9090',
    httpProtocol: snowplowHttpProtocol,
    bufferSize: 1,
    retries: 3,
    namespace: 'pocket-backend',
    appId: 'pocket-backend-curated-corpus-api',
    corpusItemEvents: ReviewedCorpusItemEventType,
    corpusScheduleEvents: ScheduledCorpusItemEventType,
    schemas: {
      objectUpdate: 'iglu:com.pocket/object_update/jsonschema/1-0-5',
      reviewedCorpusItem:
        'iglu:com.pocket/reviewed_corpus_item/jsonschema/1-0-1',
      scheduledCorpusItem:
        'iglu:com.pocket/scheduled_corpus_item/jsonschema/1-0-0',
    },
  },
};
