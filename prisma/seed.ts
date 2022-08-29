import { PrismaClient } from '@prisma/client';
import {
  createApprovedItemHelper,
  createRejectedItemHelper,
  createScheduledItemHelper,
} from '../src/test/helpers';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Default pagination is 30 items per page. Let's generate enough data for
  // several pages
  const approvedItemTitles: string[] = [];

  // We need so many to be able to generate enough scheduled entries
  // for the +/-7 day period around the date the seed script is run.
  for (let i = 0; i < 500; i++) {
    approvedItemTitles.push(faker.lorem.sentence());
  }

  for (const title of approvedItemTitles) {
    const approvedItem = await createApprovedItemHelper(prisma, { title });

    await createScheduledItemHelper(prisma, {
      scheduledSurfaceGuid: faker.random.arrayElement([
        'NEW_TAB_EN_US',
        'NEW_TAB_DE_DE',
      ]),
      approvedItem,
    }).catch(console.error);
  }

  const rejectedItemTitles = [
    '10 Unforgivable Sins Of PHP',
    'Take The Stress Out Of PHP',
    'The Untold Secret To Mastering PHP In Just 3 Days',
    'You Can Thank Us Later - 3 Reasons To Stop Thinking About PHP',
    'Why Ignoring PHP Will Cost You Time and Sales',
    'PHP: This Is What Professionals Do',
    'PHP Your Way To Success',
  ];

  for (const title of rejectedItemTitles) {
    await createRejectedItemHelper(prisma, { title });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
