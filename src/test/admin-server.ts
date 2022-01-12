import { ApolloServer } from 'apollo-server-express';
import { buildSubgraphSchema } from '@apollo/federation';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginInlineTraceDisabled,
  ApolloServerPluginUsageReportingDisabled,
} from 'apollo-server-core';
import { typeDefsAdmin } from '../typeDefs';
import { resolvers as adminResolvers } from '../admin/resolvers';
import { client } from '../database/client';
import { CuratedCorpusEventEmitter } from '../events/curatedCorpusEventEmitter';
import { ContextManager } from '../admin/context';
import s3 from '../admin/aws/s3';

// Export this separately so that it can be used in Apollo integration tests
export const db = client();

export const getServer = (eventEmitter: CuratedCorpusEventEmitter) => {
  return new ApolloServer({
    schema: buildSubgraphSchema([
      { typeDefs: typeDefsAdmin, resolvers: adminResolvers },
    ]),
    context: () => {
      return new ContextManager({
        request: {
          headers: {},
        },
        db: client(),
        s3,
        eventEmitter,
      });
    },
    // Note the absence of the Sentry plugin - it emits
    // "Cannot read property 'headers' of undefined" errors in tests.
    // We get console.log statements that resolvers emit instead
    // but the tests pass.
    plugins: [
      ApolloServerPluginLandingPageDisabled(),
      ApolloServerPluginInlineTraceDisabled(),
      ApolloServerPluginUsageReportingDisabled(),
    ],
  });
};
