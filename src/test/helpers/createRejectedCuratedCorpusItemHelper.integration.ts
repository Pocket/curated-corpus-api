import { PrismaClient } from '@prisma/client';
import chai from 'chai';
import { clearDb } from './clearDb';
import {
  createRejectedCuratedCorpusItemHelper,
  CreateRejectedCuratedCorpusItemHelperInput,
} from './createRejectedCuratedCorpusItemHelper';

const db = new PrismaClient();

describe('createRejectedCuratedCorpusItemHelper', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('creates a rejected item with just the title supplied', async () => {
    const data: CreateRejectedCuratedCorpusItemHelperInput = {
      title: 'Never Suffer From PHP Again',
    };

    const item = await createRejectedCuratedCorpusItemHelper(db, data);

    // Expect to see the title we passed to the helper
    expect(item.title).toBe(data.title);

    // Expect to see the remaining fields filled in for us
    expect(item.externalId).toBeTruthy();
    expect(item.url).toBeTruthy();
    expect(item.topic).toBeTruthy();
    expect(item.publisher).toBeTruthy();
    expect(item.language).toBeTruthy();
    expect(item.reason).toBeTruthy();
  });

  it('creates a curated item with all properties supplied', async () => {
    const data: CreateRejectedCuratedCorpusItemHelperInput = {
      url: 'https://www.test.com/',
      title: 'Never Suffer From PHP Again',
      topic: 'Business',
      publisher: 'Any Publisher',
      language: 'en',
      reason: 'unspecified',
    };

    const item = await createRejectedCuratedCorpusItemHelper(db, data);

    // Expect to see everything as specified to the helper
    chai.expect(item).to.deep.include(data);
  });
});
