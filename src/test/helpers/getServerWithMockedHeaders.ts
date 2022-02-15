import { getServer } from '../admin-server';
import { CuratedCorpusEventEmitter } from '../../events/curatedCorpusEventEmitter';
import { ContextManager } from '../../admin/context';
import { client } from '../../database/client';
import s3 from '../../admin/aws/s3';

const sharedConfigContext = {
  request: { headers: {} },
  db: client(),
  s3,
};

/**
 * Pass custom mocked headers to Apollo Server to test access control checks
 * within resolvers.
 *
 * @param headers
 * @param eventEmitter
 */
export const getServerWithMockedHeaders = (
  headers: {
    name?: string;
    username?: string;
    groups?: string;
  },
  eventEmitter: CuratedCorpusEventEmitter = new CuratedCorpusEventEmitter()
) => {
  const contextManager = new ContextManager({
    ...sharedConfigContext,
    eventEmitter,
    request: {
      headers,
    },
  });

  return getServer(eventEmitter, contextManager);
};
