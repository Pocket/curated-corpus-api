import { PrismaClient } from '@prisma/client';
import { clearDb } from './clearDb';
import {
  createNewTabFeedHelper,
  CreateNewTabFeedHelperInput,
} from './createNewTabFeedHelper';

const db = new PrismaClient();

describe('createNewTabFeedHelper', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('creates a New Tab feed with required props supplied', async () => {
    const data: CreateNewTabFeedHelperInput = {
      shortName: 'de_DE',
    };

    const item = await createNewTabFeedHelper(db, data);

    // Expect to see the data we passed to the helper
    expect(item.shortName).toBe(data.shortName);

    // Expect to see the remaining fields filled in for us
    expect(item.name).toBeTruthy();
    expect(item.utcOffset).toBeTruthy();
  });

  it('creates a New Tab feed with all properties supplied', async () => {
    const data: CreateNewTabFeedHelperInput = {
      name: 'New Tab Germany',
      shortName: 'de_DE',
      utcOffset: '+07:00',
    };

    const item = await createNewTabFeedHelper(db, data);

    // Expect to see everything as specified to the helper
    expect(item.name).toBe(data.name);
    expect(item.shortName).toBe(data.shortName);
    expect(item.utcOffset).toBe(data.utcOffset);
  });
});
