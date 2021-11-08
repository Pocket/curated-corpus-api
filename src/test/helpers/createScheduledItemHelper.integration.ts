import { ApprovedItem, ScheduledItem, PrismaClient } from '@prisma/client';
import { clearDb } from './clearDb';
import { createApprovedItemHelper } from './createApprovedItemHelper';
import {
  CreateScheduledItemHelperInput,
  createScheduledItemHelper,
} from './createScheduledItemHelper';
import faker from 'faker';

const db = new PrismaClient();

describe('createScheduledItemHelper', () => {
  let approvedItem: ApprovedItem;
  let newTabGuid: string;

  beforeEach(async () => {
    await clearDb(db);

    approvedItem = await createApprovedItemHelper(db, {
      title: 'What even is time?',
    });
    newTabGuid = 'DE_DE';
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('should create a scheduled item with required props supplied', async () => {
    const data: CreateScheduledItemHelperInput = {
      approvedItem,
      newTabGuid,
    };

    const item: ScheduledItem = await createScheduledItemHelper(db, data);

    // Expect to see the data we passed to the helper
    expect(item.approvedItemId).toBe(approvedItem.id);
    expect(item.newTabGuid).toBe(newTabGuid);

    // Expect to see the remaining fields filled in for us
    expect(item.createdBy).toBeTruthy();
    expect(item.scheduledDate).toBeTruthy();
  });

  it('should create a scheduled item with all properties supplied', async () => {
    const data: CreateScheduledItemHelperInput = {
      createdBy: faker.fake('auth-provider|test@example.com'),
      scheduledDate: '2022-01-01T00:00:00.000Z',
      approvedItem,
      newTabGuid,
    };

    const item: ScheduledItem = await createScheduledItemHelper(db, data);

    // Expect to see everything as specified to the helper
    expect(item.approvedItemId).toBe(approvedItem.id);
    expect(item.newTabGuid).toBe(newTabGuid);
    expect(item.createdBy).toBe(data.createdBy);
    expect(item.scheduledDate.toISOString()).toBe(data.scheduledDate);
  });
});
