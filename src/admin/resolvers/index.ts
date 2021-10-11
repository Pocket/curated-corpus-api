import { DateResolver } from 'graphql-scalars';

import { getCuratedItems } from './queries/CuratedItem';
import { getNewTabFeedScheduledItems } from './queries/NewTabFeedSchedule';
import { updateCuratedItem } from './mutations/CuratedItem';
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
    updateCuratedItem,
    createNewTabFeedScheduledItem,
    deleteNewTabFeedScheduledItem,
  },
};
