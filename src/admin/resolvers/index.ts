import { getCuratedItems } from './queries/CuratedItem';
import { updateCuratedItem } from './mutations/CuratedItem';

export const resolvers = {
  Query: {
    getCuratedItems,
  },
  Mutation: {
    updateCuratedItem,
  },
};
