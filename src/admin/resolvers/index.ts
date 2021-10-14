import { DateResolver } from 'graphql-scalars';

import { getCuratedItems } from './queries/CuratedItem';
import { getNewTabFeedScheduledItems } from './queries/NewTabFeedSchedule';
import { createCuratedItem, updateCuratedItem } from './mutations/CuratedItem';
import {
  createNewTabFeedScheduledItem,
  deleteNewTabFeedScheduledItem,
} from './mutations/NewTabFeedSchedule';

export const resolvers = {
  Date: DateResolver,
  Query: {
    getCuratedItems,
    getNewTabFeedScheduledItems,
  },
  Mutation: {
    createCuratedItem,
    updateCuratedItem,
    createNewTabFeedScheduledItem,
    deleteNewTabFeedScheduledItem,
  },
};
