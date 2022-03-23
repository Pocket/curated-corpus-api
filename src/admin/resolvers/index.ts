import { DateResolver } from 'graphql-scalars';
import { UnixTimestampResolver } from './fields/UnixTimestamp';
import { getApprovedItems, getApprovedItemByUrl } from './queries/ApprovedItem';
import { getScheduledSurfacesForUser } from './queries/ScheduledSurface';
import { getRejectedItems } from './queries/RejectedItem';
import { getScheduledItems } from './queries/ScheduledItem';
import {
  createApprovedItem,
  importApprovedItem,
  rejectApprovedItem,
  updateApprovedItem,
  uploadApprovedItemImage,
} from './mutations/ApprovedItem';
import { createRejectedItem } from './mutations/RejectedItem';
import {
  createScheduledItem,
  deleteScheduledItem,
  rescheduleScheduledItem,
} from './mutations/ScheduledItem';
import { GraphQLUpload } from 'graphql-upload';
import { getApprovedItemByUrl as dbGetApprovedItemByUrl } from '../../database/queries';

export const resolvers = {
  // Map the Upload scalar to graphql-upload
  Upload: GraphQLUpload,
  // The custom scalars from GraphQL-Scalars that we find useful.
  Date: DateResolver,

  ApprovedCuratedCorpusItem: {
    // Our own entities that need timestamp conversion, hence field resolvers
    // everywhere for values returned by `createdAt` and `updatedAt` fields.
    createdAt: UnixTimestampResolver,
    updatedAt: UnixTimestampResolver,

    // Resolve reference to approved items by the `url` field.
    __resolveReference: async (item, { db }) => {
      const { url } = item;

      /**
       * Even though it appears that we're querying the partner up to four times
       * to retrieve the information for the four fields below, Prisma is actually
       * batching the queries behind the scenes and there is no performance hit.
       *
       * It is also returning items in the correct order for us.
       * Docs here: https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance
       */
      return dbGetApprovedItemByUrl(db, url);
    },
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
    rescheduleScheduledCuratedCorpusItem: rescheduleScheduledItem,
    uploadApprovedCuratedCorpusItemImage: uploadApprovedItemImage,
    importApprovedCuratedCorpusItem: importApprovedItem,
  },
};
