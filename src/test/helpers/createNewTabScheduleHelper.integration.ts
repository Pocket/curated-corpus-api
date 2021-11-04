import {
  CuratedItem,
  NewTabFeedSchedule,
  NewTabGuid,
  PrismaClient,
} from '@prisma/client';
import { clearDb } from './clearDb';
import { createCuratedItemHelper } from './createCuratedItemHelper';
import {
  CreateNewTabScheduledHelperInput,
  createNewTabScheduleHelper,
} from './createNewTabScheduleHelper';
import faker from 'faker';

const db = new PrismaClient();

describe('createNewTabFeedHelper', () => {
  let curatedItem: CuratedItem;
  let newTabGuid: NewTabGuid;

  beforeEach(async () => {
    await clearDb(db);

    curatedItem = await createCuratedItemHelper(db, {
      title: 'What even is time?',
    });
    newTabGuid = NewTabGuid.DE_DE;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('creates a New Tab scheduled item with required props supplied', async () => {
    const data: CreateNewTabScheduledHelperInput = {
      curatedItem,
      newTabGuid,
    };

    const item: NewTabFeedSchedule = await createNewTabScheduleHelper(db, data);

    // Expect to see the data we passed to the helper
    expect(item.curatedItemId).toBe(curatedItem.id);
    expect(item.newTabGuid).toBe(newTabGuid);

    // Expect to see the remaining fields filled in for us
    expect(item.createdBy).toBeTruthy();
    expect(item.scheduledDate).toBeTruthy();
  });

  it('creates a New Tab feed with all properties supplied', async () => {
    const data: CreateNewTabScheduledHelperInput = {
      createdBy: faker.fake('auth-provider|test@example.com'),
      scheduledDate: '2022-01-01T00:00:00.000Z',
      curatedItem,
      newTabGuid,
    };

    const item: NewTabFeedSchedule = await createNewTabScheduleHelper(db, data);

    // Expect to see everything as specified to the helper
    expect(item.curatedItemId).toBe(curatedItem.id);
    expect(item.newTabGuid).toBe(newTabGuid);
    expect(item.createdBy).toBe(data.createdBy);
    expect(item.scheduledDate.toISOString()).toBe(data.scheduledDate);
  });
});
