import {
  CuratedItem,
  CuratedStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import faker from 'faker';
// the minimum of data required to create a curated item
interface CreateCuratedItemHelperRequiredInput {
  title: string;
}

// optional information you can provide when creating a curated item
interface CreateCuratedItemHelperOptionalInput {
  url?: string;
  excerpt?: string;
  status?: CuratedStatus;
  language?: string;
  publisher?: string;
  imageUrl?: string;
  createdBy?: string;
  topic?: string;
  isCollection?: boolean;
  isShortLived?: boolean;
  isSyndicated?: boolean;
}

// the input type the helper function expects - a combo of required and optional parameters
export type CreateCuratedItemHelperInput =
  CreateCuratedItemHelperRequiredInput & CreateCuratedItemHelperOptionalInput;

/**
 * A helper function that creates a sample curated item for testing or local development.
 * @param prisma
 * @param data
 */
export async function createCuratedItemHelper(
  prisma: PrismaClient,
  data: CreateCuratedItemHelperInput
): Promise<CuratedItem> {
  const random = Math.round(Math.random() * 1000);

  // defaults for optional properties
  const createCuratedItemDefaults = {
    url: faker.internet.url(),
    excerpt: faker.lorem.sentence(15),
    status: faker.random.arrayElement([
      CuratedStatus.RECOMMENDATION,
      CuratedStatus.CORPUS,
    ]),
    language: faker.random.arrayElement(['en', 'de']),
    publisher: faker.company.companyName(),
    imageUrl: faker.random.arrayElement([
      `${faker.image.nature()}?random=${random}`,
      `${faker.image.city()}?random=${random}`,
      `${faker.image.food()}?random=${random}`,
    ]),
    topic: faker.random.arrayElement(['Business', 'History', 'Health']),
    isCollection: faker.datatype.boolean(),
    isShortLived: faker.datatype.boolean(),
    isSyndicated: faker.datatype.boolean(),
    createdAt: faker.date.recent(14),
    createdBy: faker.fake('{{hacker.noun}}|{{internet.email}}'), // imitation auth0 user id
    // occasionally, this may create an item that was updated before it was created. It's ok though,
    // we're only setting this so that orderBy in queries can be tested.
    updatedAt: faker.date.recent(7),
  };

  const inputs: Prisma.CuratedItemCreateInput = {
    ...createCuratedItemDefaults,
    ...data,
  };

  return await prisma.curatedItem.create({ data: inputs });
}
