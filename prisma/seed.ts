import { PrismaClient } from '@prisma/client';
import {
  createCuratedItemHelper,
  createNewTabFeedHelper,
  createNewTabScheduleHelper,
} from '../src/test/helpers';
import faker from 'faker';
import { createRejectedItemHelper } from '../dist/test/helpers/createRejectedItemHelper';

const prisma = new PrismaClient();

async function main() {
  const newTabAmerica = await createNewTabFeedHelper(prisma, {
    shortName: 'en_US',
  });
  const newTabGermany = await createNewTabFeedHelper(prisma, {
    shortName: 'de_DE',
  });

  const curatedItemTitles = [
    'One simple trick to save thousands of lines of code',
    'How to decide when to use code generation packages',
    'How to quit using jQuery in 2021',
    'Why using jQuery was always a bad idea',
    'What is the difference between !! and ?? in JavaScript?',
    'How can all the different NPM packages work together without breaking?',
    'Where to find the best deals on keyboards',
  ];

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
