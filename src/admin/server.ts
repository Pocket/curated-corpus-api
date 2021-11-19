import { ApolloServer } from 'apollo-server-express';
import { Request } from 'express';
import { buildSubgraphSchema } from '@apollo/federation';
import { typeDefsAdmin } from '../typeDefs';
import { resolvers as resolversAdmin } from './resolvers';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { GraphQLRequestContext } from 'apollo-server-types';
import { sentryPlugin } from '@pocket-tools/apollo-utils';
import { ContextManager } from './context';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from 'apollo-server-core';

// Function signature for context creator; primarily for
// injecting test contexts
interface ContextFactory {
  (req: Request): ContextManager;
}
/**
 * Sets up and configures an ApolloServer for the application.
 * @param contextFactory function for creating the context with
 * every request
 * @returns ApolloServer
 */
export function getServer(contextFactory: ContextFactory): ApolloServer {
  return new ApolloServer({
    schema: buildSubgraphSchema([
      { typeDefs: typeDefsAdmin, resolvers: resolversAdmin },
    ]),
    plugins: [
      //Copied from Apollo docs, the sessionID signifies if we should separate out caches by user.
      responseCachePlugin({
        //https://www.apollographql.com/docs/apollo-server/performance/caching/#saving-full-responses-to-a-cache
        //The user id is added to the request header by the apollo gateway (client api)
        sessionId: (requestContext: GraphQLRequestContext) =>
          requestContext?.request?.http?.headers?.has('userId')
            ? requestContext?.request?.http?.headers?.get('userId')
            : null,
      }),
      sentryPlugin,
      // Keep the settings we had when using v.2:
      // no landing page on production + playground in other environments
      process.env.NODE_ENV === 'production'
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
    context: ({ req }) => contextFactory(req),
  });
}

/**
 * Create and start the apollo server. Required to await server.start()
 * before applying middleware per apollo-server 3 migration.
 */
export async function startServer(
  contextFactory: ContextFactory
): Promise<ApolloServer> {
  const server = getServer(contextFactory);
  await server.start();
  return server;
}
