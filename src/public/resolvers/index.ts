import { DateResolver } from 'graphql-scalars';
import { getScheduledSurface } from './queries/ScheduledSurface';
import { getItemsForScheduledSurface } from './queries/ScheduledSurfaceItem';
import { getCorpusItem } from './queries/CorpusItem';

export const resolvers = {
  // The Date resolver enforces the date to be in the YYYY-MM-DD format.
  Date: DateResolver,
  ScheduledSurface: {
    // The `items` subquery pulls in scheduled corpus items for a given date.
    items: getItemsForScheduledSurface,
  },
  // The `CorpusItem` resolver resolves approved corpus items based on id.
  CorpusItem: {
    __resolveReference: getCorpusItem,
  },
  Query: {
    // Gets the metadata for a Scheduled Surface (for example, New Tab).
    scheduledSurface: getScheduledSurface,
  },
};
