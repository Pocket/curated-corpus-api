import { getCuratedItems } from './queries/CuratedItem';
import { getNewTabFeedScheduledItems } from './queries/NewTabFeedSchedule';
import { updateCuratedItem } from './mutations/CuratedItem';
import {
  createNewTabFeedScheduledItem,
  deleteNewTabFeedScheduledItem,
} from './mutations/NewTabFeedSchedule';

export const resolvers = {
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
