import { ScheduledSurface } from '../../../database/types';
import { NewTabs } from '../../../shared/types';
import { UserInputError } from 'apollo-server';

/**
 * Retrieves a Scheduled Surface (for example, New Tab) for a given GUID.
 */
export async function getScheduledSurface(
  parent,
  args,
  { db }
): Promise<ScheduledSurface> {
  const { id } = args;

  // Data retrieval is super simple here given that we store shared data,
  // such as New Tab values, as hardcoded values at the moment.
  const newTab = NewTabs.find((newTab) => {
    return newTab.guid === id;
  });

  if (!newTab) {
    throw new UserInputError(
      `Could not find Scheduled Surface with id of "${id}".`
    );
  }

  return {
    id: newTab.guid,
    name: newTab.name,
  };
}
