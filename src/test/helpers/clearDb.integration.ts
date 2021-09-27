import { PrismaClient } from '@prisma/client';
import { clearDb } from './clearDb';
import { createCuratedItemHelper } from './createCuratedItemHelper';
import { createNewTabFeedHelper } from './createNewTabFeedHelper';
import { createNewTabScheduleHelper } from './createNewTabScheduleHelper';

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

    // Check that we have items in the DB
    let items = await db.curatedItem.findMany({});
    expect(items).toHaveLength(2);
    let newTabs = await db.newTabFeed.findMany({});
    expect(newTabs).toHaveLength(1);
    let scheduledItems = await db.newTabFeedSchedule.findMany({});
    expect(scheduledItems).toHaveLength(1);

    // Remove all the records
    await clearDb(db);

    // Check again
    items = await db.curatedItem.findMany({});
    expect(items).toHaveLength(0);
    newTabs = await db.newTabFeed.findMany({});
    expect(newTabs).toHaveLength(0);
    scheduledItems = await db.newTabFeedSchedule.findMany({});
    expect(scheduledItems).toHaveLength(0);
  });
});
