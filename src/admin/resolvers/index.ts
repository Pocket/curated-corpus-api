import { DateResolver } from 'graphql-scalars';
import { UnixTimestampResolver } from './fields/UnixTimestamp';
import { getApprovedItems, getApprovedItemByUrl } from './queries/ApprovedItem';
import { getScheduledSurfacesForUser } from './queries/ScheduledSurface';
import { getRejectedItems } from './queries/RejectedItem';
import { getScheduledItems } from './queries/ScheduledItem';
import {
  createApprovedItem,
  rejectApprovedItem,
  updateApprovedItem,
  uploadApprovedItemImage,
} from './mutations/ApprovedItem';
import { createRejectedItem } from './mutations/RejectedItem';
import {
  createScheduledItem,
  deleteScheduledItem,
} from './mutations/ScheduledItem';
import { GraphQLUpload } from 'graphql-upload';

export const resolvers = {
  // Map the Upload scalar to graphql-upload
  Upload: GraphQLUpload,
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
  ScheduledCuratedCorpusItem: {
    createdAt: UnixTimestampResolver,
    updatedAt: UnixTimestampResolver,
  },
  // The queries available
  Query: {
    getApprovedCuratedCorpusItems: getApprovedItems,
    getRejectedCuratedCorpusItems: getRejectedItems,
    getScheduledCuratedCorpusItems: getScheduledItems,
    getApprovedCuratedCorpusItemByUrl: getApprovedItemByUrl,
    getScheduledSurfacesForUser: getScheduledSurfacesForUser,
  },
  // Mutations that we need in the admin interface
  Mutation: {
    createApprovedCuratedCorpusItem: createApprovedItem,
    rejectApprovedCuratedCorpusItem: rejectApprovedItem,
    updateApprovedCuratedCorpusItem: updateApprovedItem,
    createRejectedCuratedCorpusItem: createRejectedItem,
    createScheduledCuratedCorpusItem: createScheduledItem,
    deleteScheduledCuratedCorpusItem: deleteScheduledItem,
    uploadApprovedCuratedCorpusItemImage: uploadApprovedItemImage,
  },
};
