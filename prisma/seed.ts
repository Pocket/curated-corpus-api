import { PrismaClient } from '@prisma/client';
import {
  createCuratedItemHelper,
  createNewTabFeedHelper,
  createNewTabScheduleHelper,
} from '../src/test/helpers';
import faker from 'faker';
import { createRejectedCuratedCorpusItemHelper } from '../src/test/helpers/createRejectedCuratedCorpusItemHelper';

const prisma = new PrismaClient();

async function main() {
  const newTabAmerica = await createNewTabFeedHelper(prisma, {
    shortName: 'en_US',
  });
  const newTabGermany = await createNewTabFeedHelper(prisma, {
    shortName: 'de_DE',
  });

  // Default pagination is 30 items per page. Let's generate enough data for
  // several pages
  const curatedItemTitles: string[] = [];

  for (let i = 0; i < 170; i++) {
    curatedItemTitles.push(faker.lorem.sentence());
  }

  for (const title of curatedItemTitles) {
    const curatedItem = await createCuratedItemHelper(prisma, { title });

    await createNewTabScheduleHelper(prisma, {
      newTabFeed: faker.random.arrayElement([newTabAmerica, newTabGermany]),
      curatedItem,
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
    await createRejectedCuratedCorpusItemHelper(prisma, { title });
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
