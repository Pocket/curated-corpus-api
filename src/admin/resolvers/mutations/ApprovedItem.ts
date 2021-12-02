import { ApprovedItem } from '@prisma/client';
import {
  createApprovedItem as dbCreateApprovedItem,
  deleteApprovedItem as dbDeleteApprovedItem,
  updateApprovedItem as dbUpdateApprovedItem,
  createScheduledItem,
  createRejectedItem,
} from '../../../database/mutations';
import {
  ReviewedCorpusItemEventType,
  ScheduledCorpusItemEventType,
} from '../../../events/types';
import { uploadImageToS3 } from '../../aws/upload';
import {
  newTabAllowedValues,
  ApprovedItemS3ImageUrl,
} from '../../../shared/types';
import { CreateRejectedItemInput } from '../../../database/types';

/**
 * Creates an approved curated item with data supplied. Optionally, schedules the freshly
 * created item to go onto New Tab for the date provided.
 *
 * @param parent
 * @param data
 * @param context
 * @param db
 */
export async function createApprovedItem(
  parent,
  { data },
  context
): Promise<ApprovedItem> {
  const { scheduledDate, newTabGuid, ...approvedItemData } = data;

  if (
    scheduledDate &&
    newTabGuid &&
    !newTabAllowedValues.includes(newTabGuid)
  ) {
    throw new Error(
      `Cannot create a scheduled entry with New Tab GUID of "${data.newTabGuid}".`
    );
  }

  const approvedItem = await dbCreateApprovedItem(context.db, approvedItemData);

  context.emitReviewedCorpusItemEvent(
    ReviewedCorpusItemEventType.ADD_ITEM,
    approvedItem
  );

  if (scheduledDate && newTabGuid) {
    // Note that we create a scheduled item but don't return it
    // in the mutation response. Need to evaluate if we do need to return it
    // alongside the approved item.
    const scheduledItem = await createScheduledItem(context.db, {
      approvedItemExternalId: approvedItem.externalId,
      newTabGuid,
      scheduledDate,
    });

    context.emitScheduledCorpusItemEvent(
      ScheduledCorpusItemEventType.ADD_SCHEDULE,
      scheduledItem
    );
  }

  return approvedItem;
}

/**
 * Updates an approved curated item with data supplied.
 *
 * @param parent
 * @param data
 * @param context
 * @param db
 */
export async function updateApprovedItem(
  parent,
  { data },
  context
): Promise<ApprovedItem> {
  const approvedItem = await dbUpdateApprovedItem(context.db, data);

  context.emitReviewedCorpusItemEvent(
    ReviewedCorpusItemEventType.UPDATE_ITEM,
    approvedItem
  );

  return approvedItem;
}

export async function rejectApprovedItem(
  parent,
  { data },
  context
): Promise<ApprovedItem> {
  let approvedItem = await dbDeleteApprovedItem(context.db, data.externalId);

  // From our thoughtfully saved before deletion Approved Item, construct
  // input data for a Rejected Item entry.
  const input: CreateRejectedItemInput = {
    prospectId: approvedItem.prospectId,
    url: approvedItem.url,
    title: approvedItem.title,
    topic: approvedItem.topic,
    language: approvedItem.language,
    publisher: approvedItem.publisher,
    reason: data.reason,
  };
  // Create a Rejected Item. The Prisma function will handle URL uniqueness checks
  const rejectedItem = await createRejectedItem(context.db, input);

  // Let Snowplow know we've deleted something from the curated corpus.
  // Before that, we need to update the values for the `updatedAt` and `updatedBy`
  // fields for the deleted approved item. Let's take these values from
  // the newly created Rejected Item.
  approvedItem = {
    ...approvedItem,
    updatedAt: rejectedItem.createdAt,
    updatedBy: rejectedItem.createdBy,
  };
  // Now emit the event with the updated Approved Item data.
  context.emitReviewedCorpusItemEvent(
    ReviewedCorpusItemEventType.REMOVE_ITEM,
    approvedItem
  );

  // Let Snowplow know that an entry was added to the Rejected Items table.
  context.emitReviewedCorpusItemEvent(
    ReviewedCorpusItemEventType.REJECT_ITEM,
    rejectedItem
  );

  return approvedItem;
}

/**
 * Uploads an image to the S3 bucket for an
 * Approved Curated item
 *
 * @param parent
 * @param data
 * @param s3
 */
export async function uploadApprovedItemImage(
  parent,
  { data },
  { s3 }
): Promise<ApprovedItemS3ImageUrl> {
  const image = await data;
  return await uploadImageToS3(s3, image);
}
