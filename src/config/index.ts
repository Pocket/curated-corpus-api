import {
  ReviewedCorpusItemEventType,
  ScheduledCorpusItemEventType,
} from '../events/types';

// Work out the AWS/localstack endpoint
const awsEnvironments = ['production', 'development'];
let localEndpoint;
let s3path;

const bucket = process.env.AWS_S3_BUCKET || 'curated-corpus-api-local-images';

if (!awsEnvironments.includes(process.env.NODE_ENV ?? '')) {
  localEndpoint = process.env.AWS_S3_ENDPOINT || 'http://localhost:4566';
  s3path = `${localEndpoint}/${bucket}/`;
} else {
  s3path = `https://${bucket}.s3.amazonaws.com/`;
}

// Work out the Snowplow HTTP protocol.
const snowplowHttpProtocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'http';

// Override the connection on the database_url, to avoid
// "Timed out fetching a new connection from the connection pool"
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#increasing-the-pool-size
// Aurora Serverless has a connection limit of 2,000:
// https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.setting-capacity.html
// Value of 50 was chosen arbitrarily because it is 10x the original value of 5.
process.env.MODIFIED_DATABASE_URL = `${process.env.DATABASE_URL}?connection_limit=50`;

// Environment variables below are set in .aws/src/main.ts
export default {
  app: {
    port: 4025,
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    pagination: {
      approvedItemsPerPage: 30,
      rejectedItemsPerPage: 30,
      maxAllowedResults: 100,
      scheduledSurfaceHistory: 10,
    },
    upload: {
      maxSize: 10000000, // in bytes => 10MB
      maxFiles: 10,
    },
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: localEndpoint,
    s3: {
      localEndpoint,
      bucket,
      path: s3path,
    },
    eventBus: {
      name: process.env.EVENT_BUS_NAME || 'default',
    },
  },
  events: {
    source: 'curated-corpus-api',
    version: '0.0.2',
  },
  eventBridge: {
    addScheduledItemEventType: 'add-scheduled-item',
    removeScheduledItemEventType: 'remove-scheduled-item',
    updateScheduledItemEventType: 'update-scheduled-item',
    updateApprovedItemEventType: 'update-approved-item',
    source: 'curation-migration-datasync',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    release: process.env.GIT_SHA || '',
    environment: process.env.NODE_ENV || 'development',
    includeLocalVariables: true,
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
        'iglu:com.pocket/reviewed_corpus_item/jsonschema/1-0-4',
      scheduledCorpusItem:
        'iglu:com.pocket/scheduled_corpus_item/jsonschema/1-0-2',
    },
  },
};
