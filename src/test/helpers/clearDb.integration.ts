import { PrismaClient } from '@prisma/client';
import { clearDb } from './clearDb';
import { createCuratedItemHelper } from './createCuratedItemHelper';
import { createNewTabFeedHelper } from './createNewTabFeedHelper';
import { createNewTabScheduleHelper } from './createNewTabScheduleHelper';
import { createRejectedItemHelper } from './createRejectedItemHelper';

const db = new PrismaClient();

describe('clearDb', () => {
  beforeEach(async () => {
    // It is ironic that the tested function has to be used here, but there's no
    // other easy way to ensure the database is empty before the test runs
    // except to copy the code from inside that function to the beforeEach() here.
    await clearDb(db);
  });
  afterAll(async () => {
    await db.$disconnect();
  });

  it('deletes contents of all tables', async () => {
    // Create some data in each of the tables
    const curatedItem = await createCuratedItemHelper(db, {
      title: 'What even is time?',
    });
    await createCuratedItemHelper(db, {
      title: 'Why earthquakes are a thing',
    });

    const newTabFeed = await createNewTabFeedHelper(db, { shortName: 'en_US' });

    await createNewTabScheduleHelper(db, {
      curatedItem,
      newTabFeed,
    });

    await createRejectedItemHelper(db, {
      title: '7 Life-Saving Tips About PHP',
    });

    // Check that we have data in the DB
    const items = await db.curatedItem.findMany({});
    expect(items).toHaveLength(2);
    const newTabs = await db.newTabFeed.findMany({});
    expect(newTabs).toHaveLength(1);
    const scheduledItems = await db.newTabFeedSchedule.findMany({});
    expect(scheduledItems).toHaveLength(1);
    const rejectedItems = await db.rejectedItem.findMany({});
    expect(rejectedItems).toHaveLength(1);

    // Remove all the records
    await clearDb(db);

    // Get a list of tables
    const tables: { Tables_in_curation_corpus: string }[] =
      await db.$queryRaw`SHOW tables;`;

    for (const table of tables) {
      const tableName = table.Tables_in_curation_corpus;
      const prismaModelName = tableName[0].toLowerCase() + tableName.slice(1);

      // Check that each table, except the migrations table, has no records
      if (tableName !== '_prisma_migrations') {
        const result = await db[prismaModelName].findMany({});
        expect(result).toHaveLength(0);
      }
    }
  });
});
