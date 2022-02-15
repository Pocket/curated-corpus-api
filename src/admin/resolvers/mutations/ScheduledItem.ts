import {
  deleteScheduledItem as dbDeleteScheduledItem,
  createScheduledItem as dbCreateScheduledItem,
} from '../../../database/mutations';
import { ScheduledItem } from '../../../database/types';
import {
  ACCESS_DENIED_ERROR,
  scheduledSurfaceAllowedValues,
} from '../../../shared/types';
import { ScheduledCorpusItemEventType } from '../../../events/types';
import { UserInputError } from 'apollo-server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { AuthenticationError } from 'apollo-server-errors';
import { IContext } from '../../context';

/**
 * Deletes an item from the Scheduled Surface schedule.
 *
 * @param parent
 * @param data
 * @param context
 */
export async function deleteScheduledItem(
  parent,
  { data },
  context: IContext
): Promise<ScheduledItem> {
  // Need to fetch the item first to check access privileges.
  // Note that we do not worry here about an extra hit to the DB
  // as load on this service will be low.
  const item = await context.db.scheduledItem.findUnique({
    where: { externalId: data.externalId },
  });

  // Check if the user can execute this mutation.
  if (item && !context.authenticatedUser.canWrite(item.scheduledSurfaceGuid)) {
    throw new AuthenticationError(ACCESS_DENIED_ERROR);
  }

  // Access allowed, proceed as normal from this point on.
  const scheduledItem = await dbDeleteScheduledItem(context.db, data);

  context.emitScheduledCorpusItemEvent(
    ScheduledCorpusItemEventType.REMOVE_SCHEDULE,
    scheduledItem
  );

  return scheduledItem;
}

/**
 * Adds a curated item to a scheduled surface for a given date.
 *
 * @param parent
 * @param data
 * @param context
 */
export async function createScheduledItem(
  parent,
  { data },
  context: IContext
): Promise<ScheduledItem> {
  // Check if the user can execute this mutation.
  if (!context.authenticatedUser.canWrite(data.scheduledSurfaceGuid)) {
    throw new AuthenticationError(ACCESS_DENIED_ERROR);
  }

  // Check if the specified Scheduled Surface GUID actually exists.
  if (!scheduledSurfaceAllowedValues.includes(data.scheduledSurfaceGuid)) {
    throw new UserInputError(
      `Cannot create a scheduled entry with Scheduled Surface GUID of "${data.scheduledSurfaceGuid}".`
    );
  }

  try {
    const scheduledItem = await dbCreateScheduledItem(context.db, data);

    context.emitScheduledCorpusItemEvent(
      ScheduledCorpusItemEventType.ADD_SCHEDULE,
      scheduledItem
    );

    return scheduledItem;
  } catch (error) {
    // If it's the duplicate scheduling constraint, catch the error
    // and send a user-friendly one to the client instead.
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new UserInputError(
        `This story is already scheduled to appear on ${
          data.scheduledSurfaceGuid
        } on ${data.scheduledDate.toLocaleString('en-US', {
          dateStyle: 'medium',
        })}.`
      );
    }

    // If it's something else, throw the error unchanged.
    throw new Error(error);
  }
}
