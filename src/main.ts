import * as Sentry from '@sentry/node';
import config from './config';
import AWSXRay from 'aws-xray-sdk-core';
import https from 'https';
import {
  curatedCorpusEventEmitter,
  initItemEventHandlers,
} from './events/init';
import {
  corpusItemSnowplowEventHandler,
  corpusScheduleSnowplowEventHandler,
  eventBusHandler,
} from './events/eventHandlers';
import { startServer } from './express';

//Set XRAY to just log if the context is missing instead of a runtime error
AWSXRay.setContextMissingStrategy('LOG_ERROR');

//Add the AWS XRAY ECS plugin that will add ecs specific data to the trace
AWSXRay.config([AWSXRay.plugins.ECSPlugin]);

//Set XRay to use the host header to open its segment name.
AWSXRay.middleware.enableDynamicNaming('*');

//Capture all https traffic this service sends
//This is to auto capture node fetch requests (like to parser)
AWSXRay.captureHTTPsGlobal(https, true);

//Capture all promises that we make
AWSXRay.capturePromise();

Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

// Initialize event handlers, this is outside server setup as tests
// mock event handling
initItemEventHandlers(curatedCorpusEventEmitter, [
  corpusItemSnowplowEventHandler,
  corpusScheduleSnowplowEventHandler,
  eventBusHandler,
]);

(async () => {
  const { adminUrl, publicUrl } = await startServer(4025);
  console.log(`🚀 Public server ready at http://localhost:4025${publicUrl}`);
  console.log(`🚀 Admin server ready at http://localhost:4025${adminUrl}`);
})();
