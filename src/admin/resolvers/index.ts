import { DateResolver } from 'graphql-scalars';
import { UnixTimestampResolver } from './fields/UnixTimestamp';
import { getCuratedItems } from './queries/CuratedItem';
import { getRejectedCuratedCorpusItems } from './queries/RejectedCuratedCorpusItem';
import { getNewTabFeedScheduledItems } from './queries/NewTabFeedSchedule';
import { createCuratedItem, updateCuratedItem } from './mutations/CuratedItem';
import {
  createNewTabFeedScheduledItem,
  deleteNewTabFeedScheduledItem,
} from './mutations/NewTabFeedSchedule';

export const resolvers = {
  // The custom scalars from GraphQL-Scalars that we find useful.
  Date: DateResolver,
  // Our own entities that need timestamp conversion, hence field resolvers
  // everywhere for values returned by `createdAt` and `updatedAt` fields.
  CuratedItem: {
    createdAt: UnixTimestampResolver,
    updatedAt: UnixTimestampResolver,
  },
  RejectedCuratedCorpusItem: {
    createdAt: UnixTimestampResolver,
  },
  NewTabFeed: {
    createdAt: UnixTimestampResolver,
    updatedAt: UnixTimestampResolver,
  },
  NewTabFeedScheduledItem: {
    createdAt: UnixTimestampResolver,
    updatedAt: UnixTimestampResolver,
  },
  // The queries available
  Query: {
    getCuratedItems,
    getRejectedCuratedCorpusItems,
    getNewTabFeedScheduledItems,
  },
  // Mutations that we need in the admin interface
  Mutation: {
    createCuratedItem,
    updateCuratedItem,
    createNewTabFeedScheduledItem,
    deleteNewTabFeedScheduledItem,
  },
};
