import { RejectedItem, Prisma, PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
// the minimum of data required to create a rejected item
interface CreateRejectedItemHelperRequiredInput {
  title: string;
}

// optional information you can provide when creating a curated item
interface CreateRejectedItemHelperOptionalInput {
  prospectId?: string;
  url?: string;
  topic?: string;
  language?: string;
  publisher?: string;
  reason?: string;
}

// the input type the helper function expects - a combo of required and optional parameters
export type CreateRejectedItemHelperInput =
  CreateRejectedItemHelperRequiredInput & CreateRejectedItemHelperOptionalInput;

/**
 * A helper function that creates a sample curated item for testing or local development.
 * @param prisma
 * @param data
 */
export async function createRejectedItemHelper(
  prisma: PrismaClient,
  data: CreateRejectedItemHelperInput
): Promise<RejectedItem> {
  // defaults for optional properties
  const createRejectedItemDefaults = {
    prospectId: faker.datatype.uuid(),
    url: faker.internet.url(),
    topic: faker.lorem.words(2),
    language: faker.helpers.arrayElement(['EN', 'DE']),
    publisher: faker.company.companyName(),
    reason: faker.lorem.word(),
    createdAt: faker.date.recent(14),
    createdBy: faker.fake('{{hacker.noun}}|{{internet.email}}'), // imitation auth0 user id
  };

  const inputs: Prisma.RejectedItemCreateInput = {
    ...createRejectedItemDefaults,
    ...data,
  };

  return await prisma.rejectedItem.create({ data: inputs });
}
