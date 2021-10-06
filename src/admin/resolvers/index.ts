import { getCuratedItems } from './queries/CuratedItem';
import { updateCuratedItem } from './mutations/CuratedItem';
import { deleteNewTabFeedSchedule } from './mutations/NewTabFeedSchedule';

export const resolvers = {
  Query: {
    getCuratedItems,
  },
  Mutation: {
    updateCuratedItem,
    deleteNewTabFeedSchedule,
  },
};
