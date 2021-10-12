import { CuratedStatus, PrismaClient } from '@prisma/client';
import chai from 'chai';
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

    // Verify that all Curated Item properties requested by the query are returned
    chai
      .expect(item)
      .to.include.all.keys([
        'externalId',
        'url',
        'excerpt',
        'status',
        'language',
        'imageUrl',
        'topic',
        'isCollection',
        'isShortLived',
        'isSyndicated',
        'createdBy',
        'createdAt',
        'updatedBy',
        'updatedAt',
      ]);
  });

  it('creates a curated item with all properties supplied', async () => {
    const data: CreateCuratedItemHelperInput = {
      title: 'What even is time?',
      excerpt: faker.lorem.sentences(3),
      status: CuratedStatus.RECOMMENDATION,
      language: 'en',
      imageUrl: faker.image.imageUrl(),
      createdBy: 'big-company|name.surname@example.com',
      topic: 'Business',
      isCollection: false,
      isShortLived: false,
      isSyndicated: true,
    };

    const item = await createCuratedItemHelper(db, data);

    // Expect to see everything as specified to the helper
    chai.expect(item).to.deep.include(data);
  });
});
