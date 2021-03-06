import { UserInputError } from 'apollo-server';
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
import { errorHandler } from '@pocket-tools/apollo-utils';

// Export this separately so that it can be used in Apollo integration tests
export const db = client();

export const getServer = (
  eventEmitter: CuratedCorpusEventEmitter,
  context?: ContextManager
) => {
  return new ApolloServer({
    schema: buildSubgraphSchema([
      { typeDefs: typeDefsAdmin, resolvers: adminResolvers },
    ]),
    context: () => {
      // If context has been provided, use that instead.
      return (
        context ??
        new ContextManager({
          request: {
            headers: {},
          },
          db: client(),
          s3,
          eventEmitter,
        })
      );
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
    formatError: (error) => {
      // for an explanation of the below, see the comment in
      // src/admin/server.ts
      if (error instanceof UserInputError) {
        return error;
      } else {
        return errorHandler(error);
      }
    },
  });
};
