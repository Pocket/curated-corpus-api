import { ApolloServer } from 'apollo-server-express';
import typeDefs from './typeDefs';
import { resolvers } from './resolvers';
import { buildFederatedSchema } from '@apollo/federation';
import * as Sentry from '@sentry/node';
import config from './config';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { sentryPlugin } from '@pocket-tools/apollo-utils';
import { GraphQLRequestContext } from 'apollo-server-types';
import AWSXRay from 'aws-xray-sdk-core';
import xrayExpress from 'aws-xray-sdk-express';
import express from 'express';
import https from 'https';
import { ApolloServerPluginCacheControl } from 'apollo-server-core';

const serviceName = 'ProspectCurationAPI';

//Set XRAY to just log if the context is missing instead of a runtime error
AWSXRay.setContextMissingStrategy('LOG_ERROR');

//Add the AWS XRAY ECS plugin that will add ecs specific data to the trace
AWSXRay.config([AWSXRay.plugins.ECSPlugin]);

//Capture all https traffic this service sends
//This is to auto capture node fetch requests (like to parser)
AWSXRay.captureHTTPsGlobal(https, true);

//Capture all promises that we make
AWSXRay.capturePromise();

Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
  plugins: [
    //Copied from Apollo docs, the sessionID signifies if we should seperate out caches by user.
    responseCachePlugin({
      //https://www.apollographql.com/docs/apollo-server/performance/caching/#saving-full-responses-to-a-cache
      //The user id is added to the request header by the apollo gateway (client api)
      sessionId: (requestContext: GraphQLRequestContext) =>
        requestContext?.request?.http?.headers?.has('userId')
          ? requestContext?.request?.http?.headers?.get('userId')
          : null,
    }),
    sentryPlugin,
    // Set a default cache control of 0 seconds so it respects the individual set cache controls on the schema
    // With this set to 0 it will not cache by default
    ApolloServerPluginCacheControl({ defaultMaxAge: 0 }),
  ],
  context: {
    // Example request context. This context is accessible to all resolvers.
    // dataLoaders: {
    //   itemIdLoader: itemIdLoader,
    //   itemUrlLoader: itemUrlLoader,
    // },
    // repositories: {
    //   itemResolver: getItemResolverRepository(),
    // },
  },
});

const app = express();

//If there is no host header (really there always should be..) then use parser-wrapper as the name
app.use(xrayExpress.openSegment(serviceName));

//Set XRay to use the host header to open its segment name.
AWSXRay.middleware.enableDynamicNaming('*');

//Apply the GraphQL middleware into the express app
server.applyMiddleware({ app, path: '/' });

//Make sure the express app has the xray close segment handler
app.use(xrayExpress.closeSegment());

// The `listen` method launches a web server.
app.listen({ port: 4025 }, () =>
  console.log(`🚀 Server ready at http://localhost:4025${server.graphqlPath}`)
);
