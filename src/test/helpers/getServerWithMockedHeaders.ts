import { getServer } from '../admin-server';
import { CuratedCorpusEventEmitter } from '../../events/curatedCorpusEventEmitter';
import { ContextManager } from '../../admin/context';
import { client } from '../../database/client';
import s3 from '../../admin/aws/s3';

const eventEmitter = new CuratedCorpusEventEmitter();

const sharedConfigContext = {
  request: { headers: {} },
  db: client(),
  s3,
  eventEmitter,
};

/**
 * Pass custom mocked headers to Apollo Server to test access control checks
 * within resolvers.
 *
 * @param headers
 */
export const getServerWithMockedHeaders = (headers: {
  name: string;
  username: string;
  groups: string;
}) => {
  const contextManager = new ContextManager({
    ...sharedConfigContext,
    request: {
      headers,
    },
  });

  return getServer(eventEmitter, contextManager);
};
