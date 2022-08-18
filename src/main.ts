import * as Sentry from '@sentry/node';
import config from './config';
import AWSXRay from 'aws-xray-sdk-core';
import xrayExpress from 'aws-xray-sdk-express';
import express from 'express';
import https from 'https';
//See https://github.com/jaydenseric/graphql-upload/issues/305#issuecomment-1135285811 on why we do this
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { server as publicServer } from './public/server';
import { startServer as startAdminServer } from './admin/server';
import { getContext } from './admin/context';
import {
  curatedCorpusEventEmitter,
  initItemEventHandlers,
} from './events/init';
import {
  corpusItemSnowplowEventHandler,
  corpusScheduleSnowplowEventHandler,
  eventBusHandler,
} from './events/eventHandlers';
const serviceName = 'CurationCorpusAPI';

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

const app = express();

//If there is no host header (really there always should be..) then use parser-wrapper as the name
app.use(xrayExpress.openSegment(serviceName));

//Set XRay to use the host header to open its segment name.
AWSXRay.middleware.enableDynamicNaming('*');

//Make sure the express app has the xray close segment handler
app.use(xrayExpress.closeSegment());

app.use(
  graphqlUploadExpress({
    maxFileSize: config.app.upload.maxSize,
    maxFiles: config.app.upload.maxFiles,
  })
);

async function startServers() {
  // Start the admin server first, or `/admin` will not be accessible.

  // Initialize event handlers
  initItemEventHandlers(curatedCorpusEventEmitter, [
    corpusItemSnowplowEventHandler,
    corpusScheduleSnowplowEventHandler,
    eventBusHandler,
  ]);

  // Inject initialized event emittters to create context factory function
  const contextFactory = (req: express.Request) => {
    return getContext(req, curatedCorpusEventEmitter);
  };

  const adminServer = await startAdminServer(contextFactory);
  // Apply the admin graphql (This is not part of the federated graph i.e. Client API).
  adminServer.applyMiddleware({ app, path: '/admin' });

  // Start the public server at `/`.
  await publicServer.start();
  // Apply the public graphql (This is part of the federated graph).
  publicServer.applyMiddleware({ app, path: '/' });

  // The `listen` method launches a web server.
  // Launch the servers straight after Apollo has started so that the API paths
  // are the ones specified above and not the default `/graphql` one.
  app.listen({ port: 4025 }, () => {
    console.log(
      `🚀 Public server ready at http://localhost:4025${publicServer.graphqlPath}`
    );
    console.log(
      `🚀 Admin server ready at http://localhost:4025${adminServer.graphqlPath}`
    );
  });
}

startServers().then(() => console.log('Starting up...'));
