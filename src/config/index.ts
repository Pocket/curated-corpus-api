import { EventType } from '../events/types';

const snowplowHttpProtocol =
  process.env.NODE_ENV && process.env.NODE_ENV === 'production'
    ? 'https'
    : 'http';

// Environment variables below are set in .aws/src/main.ts
export default {
  app: {
    environment: process.env.NODE_ENV || 'development',
    defaultMaxAge: 86400,
    pagination: {
      curatedItemsPerPage: 30,
      rejectedCuratedCorpusItemsPerPage: 30,
      maxAllowedResults: 100,
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
    events: EventType,
    schemas: {
      reviewedCorpusItem:
        'iglu:com.pocket/reviewed_corpus_item/jsonschema/1-0-0',
      scheduledCorpusItem:
        'iglu:com.pocket/scheduled_corpus_item/jsonschema/1-0-0',
      objectUpdate: 'iglu:com.pocket/object_update/jsonschema/1-0-5',
    },
  },
};
