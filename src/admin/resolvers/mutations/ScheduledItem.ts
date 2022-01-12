import {
  deleteScheduledItem as dbDeleteScheduledItem,
  createScheduledItem as dbCreateScheduledItem,
} from '../../../database/mutations';
import { ScheduledItem } from '../../../database/types';
import { newTabAllowedValues } from '../../../shared/types';
import { ScheduledCorpusItemEventType } from '../../../events/types';
import { UserInputError } from 'apollo-server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

/**
 * Deletes an item from the New Tab schedule.
 *
 * @param parent
 * @param data
 * @param db
 */
export async function deleteScheduledItem(
  parent,
  { data },
  context
): Promise<ScheduledItem> {
  const scheduledItem = await dbDeleteScheduledItem(context.db, data);

  context.emitScheduledCorpusItemEvent(
    ScheduledCorpusItemEventType.REMOVE_SCHEDULE,
    scheduledItem
  );

  return scheduledItem;
}

export async function createScheduledItem(
  parent,
  { data },
  context
): Promise<ScheduledItem> {
  if (!newTabAllowedValues.includes(data.newTabGuid)) {
    throw new UserInputError(
      `Cannot create a scheduled entry with New Tab GUID of "${data.newTabGuid}".`
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
          data.newTabGuid
        } on ${data.scheduledDate.toLocaleString('en-US', {
          dateStyle: 'medium',
        })}.`
      );
    }

    // If it's something else, throw the error unchanged.
    throw new Error(error);
  }
}
