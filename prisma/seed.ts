import { PrismaClient } from '@prisma/client';
import {
  createCuratedItemHelper,
  createNewTabFeedHelper,
  createNewTabScheduleHelper,
} from '../src/test/helpers';
import faker from 'faker';

const prisma = new PrismaClient();

async function main() {
  const newTabAmerica = await createNewTabFeedHelper(prisma, {
    shortName: 'en_US',
  });
  const newTabGermany = await createNewTabFeedHelper(prisma, {
    shortName: 'de_DE',
  });

  const storyTitles = [
    'One simple trick to save thousands of lines of code',
    'How to decide when to use code generation packages',
    'How to quit using jQuery in 2021',
    'Why using jQuery was always a bad idea',
    'What is the difference between !! and ?? in JavaScript?',
    'How can all the different NPM packages work together without breaking?',
    'Where to find the best deals on keyboards',
  ];

  for (const title of storyTitles) {
    const curatedItem = await createCuratedItemHelper(prisma, { title });

    await createNewTabScheduleHelper(prisma, {
      newTabFeed: faker.random.arrayElement([newTabAmerica, newTabGermany]),
      curatedItem,
    }).catch(console.error);
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
