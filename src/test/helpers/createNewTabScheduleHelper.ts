import {
  CuratedItem,
  NewTabFeedSchedule,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import faker from 'faker';

// the data required to create a scheduled item that goes onto new tab
interface CreateNewTabScheduledHelperRequiredInput {
  curatedItem: CuratedItem;
}

// optional information you can provide when creating a scheduled item
interface CreateNewTabScheduledHelperOptionalInput {
  createdBy?: string;
  newTabGuid?: string;
  scheduledDate?: string;
}

// the input type the helper function expects - a combo of required and optional parameters
export type CreateNewTabScheduledHelperInput =
  CreateNewTabScheduledHelperRequiredInput &
    CreateNewTabScheduledHelperOptionalInput;

/**
 * A helper function that creates a sample scheduled item to go onto new tab
 * for testing or local development.
 * @param prisma
 * @param data
 */
export async function createNewTabScheduleHelper(
  prisma: PrismaClient,
  data: CreateNewTabScheduledHelperInput
): Promise<NewTabFeedSchedule> {
  // defaults for optional properties
  const createNewTabFeedScheduleDefaults = {
    createdAt: faker.date.recent(14),
    createdBy: faker.fake('{{hacker.noun}}|{{internet.email}}'), // imitation auth0 user id
    scheduledDate: faker.date.soon(7).toISOString(),
    newTabGuid: 'EN_US',
  };

  const inputs: Prisma.NewTabFeedScheduleCreateInput = {
    ...createNewTabFeedScheduleDefaults,
    ...data,
    curatedItem: { connect: { id: data.curatedItem.id } },
  };

  return await prisma.newTabFeedSchedule.create({
    data: inputs,
  });
}
