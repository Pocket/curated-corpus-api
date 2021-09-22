import { NewTabFeed, Prisma, PrismaClient } from '@prisma/client';
import faker from 'faker';

// the minimum of data required to create a new tab feed
interface CreateNewTabFeedHelperRequiredInput {
  shortName: string;
}

// optional information you can provide when creating a new tab feed
interface CreateNewTabFeedHelperOptionalInput {
  name?: string;
  utcOffset?: string;
}

// the input type the helper function expects - a combo of required and optional parameters
export type CreateNewTabFeedHelperInput = CreateNewTabFeedHelperRequiredInput &
  CreateNewTabFeedHelperOptionalInput;

/**
 * A helper function that creates a sample new tab feed for testing or local development.
 * @param prisma
 * @param data
 */
export async function createNewTabFeedHelper(
  prisma: PrismaClient,
  data: CreateNewTabFeedHelperInput
): Promise<NewTabFeed> {
  // defaults for optional properties
  const createNewTabFeedDefaults = {
    name: faker.address.country(),
    utcOffset: faker.random.arrayElement(['+03:00', '-05:00', '+08:00']),
  };

  const inputs: Prisma.NewTabFeedCreateInput = {
    ...createNewTabFeedDefaults,
    ...data,
  };

  return await prisma.newTabFeed.create({ data: inputs });
}
