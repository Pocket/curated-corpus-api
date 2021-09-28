import { CuratedStatus, PrismaClient } from '@prisma/client';
import faker from 'faker';
import { clearDb } from './clearDb';
import {
  createCuratedItemHelper,
  CreateCuratedItemHelperInput,
} from './createCuratedItemHelper';

const db = new PrismaClient();

describe('createCuratedItemHelper', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('creates a curated item with just the title supplied', async () => {
    const data: CreateCuratedItemHelperInput = { title: 'What even is time?' };

    const item = await createCuratedItemHelper(db, data);

    // Expect to see the title we passed to the helper
    expect(item.title).toBe(data.title);

    // Expect to see the remaining fields filled in for us
    expect(item.externalId).toBeTruthy();
    expect(item.excerpt).toBeTruthy();
    expect(item.status).toBeTruthy();
    expect(item.language).toBeTruthy();
    expect(item.imageUrl).toBeTruthy();
    expect(item.createdBy).toBeTruthy();
  });

  it('creates a curated item with all properties supplied', async () => {
    const data: CreateCuratedItemHelperInput = {
      title: 'What even is time?',
      excerpt: faker.lorem.sentences(3),
      status: CuratedStatus.RECOMMENDATION,
      language: 'en',
      imageUrl: faker.image.imageUrl(),
      createdBy: 'big-company|name.surname@example.com',
    };

    const item = await createCuratedItemHelper(db, data);

    // Expect to see everything as specified to the helper
    expect(item.title).toBe(data.title);
    expect(item.excerpt).toBe(data.excerpt);
    expect(item.status).toBe(data.status);
    expect(item.language).toBe(data.language);
    expect(item.imageUrl).toBe(data.imageUrl);
    expect(item.createdBy).toBe(data.createdBy);
  });
});