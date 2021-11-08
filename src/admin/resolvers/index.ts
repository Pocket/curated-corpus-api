import { DateResolver } from 'graphql-scalars';
import { UnixTimestampResolver } from './fields/UnixTimestamp';
import { getApprovedItems } from './queries/ApprovedItem';
import { getRejectedItems } from './queries/RejectedCuratedCorpusItem';
import { getScheduledItems } from './queries/ScheduledItem';
import {
  createApprovedItem,
  updateApprovedItem,
} from './mutations/ApprovedItem';
import {
  createScheduledItem,
  deleteScheduledItem,
} from './mutations/ScheduledItem';

export const resolvers = {
  // The custom scalars from GraphQL-Scalars that we find useful.
  Date: DateResolver,
  // Our own entities that need timestamp conversion, hence field resolvers
  // everywhere for values returned by `createdAt` and `updatedAt` fields.
  ApprovedCuratedCorpusItem: {
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
  ScheduledCuratedCorpusItem: {
    createdAt: UnixTimestampResolver,
    updatedAt: UnixTimestampResolver,
  },
  // The queries available
  Query: {
    getApprovedCuratedCorpusItems: getApprovedItems,
    getRejectedCuratedCorpusItems: getRejectedItems,
    getScheduledCuratedCorpusItems: getScheduledItems,
  },
  // Mutations that we need in the admin interface
  Mutation: {
    createApprovedCuratedCorpusItem: createApprovedItem,
    updateApprovedCuratedCorpusItem: updateApprovedItem,
    createScheduledCuratedCorpusItem: createScheduledItem,
    deleteScheduledCuratedCorpusItem: deleteScheduledItem,
  },
};
