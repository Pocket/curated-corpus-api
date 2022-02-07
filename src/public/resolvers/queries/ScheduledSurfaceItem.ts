import { ScheduledSurfaceItem } from '../../../database/types';
import { getItemsForScheduledSurface as dbGetItemsForScheduledSurface } from '../../../database/queries';

/**
 * Pulls in scheduled items for a given date and surface (e.g., EN_US New Tab).
 *
 * @param parent
 * @param args
 * @param db
 */
export async function getItemsForScheduledSurface(
  parent,
  args,
  { db }
): Promise<ScheduledSurfaceItem[]> {
  const { id, date } = args;
  return await dbGetItemsForScheduledSurface(db, id, date);
}
