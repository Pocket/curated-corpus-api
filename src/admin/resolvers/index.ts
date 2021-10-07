import { getCuratedItems } from './queries/CuratedItem';
import { getNewTabFeedScheduledItems } from './queries/NewTabFeedSchedule';
import { updateCuratedItem } from './mutations/CuratedItem';
import { deleteNewTabFeedSchedule } from './mutations/NewTabFeedSchedule';

export const resolvers = {
  Query: {
    getCuratedItems,
    getNewTabFeedScheduledItems,
  },
  Mutation: {
    updateCuratedItem,
    deleteNewTabFeedSchedule,
  },
};
