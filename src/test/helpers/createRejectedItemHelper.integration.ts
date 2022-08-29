import { PrismaClient } from '@prisma/client';
import { expect } from 'chai';
import { clearDb } from './clearDb';
import {
  createRejectedItemHelper,
  CreateRejectedItemHelperInput,
} from './createRejectedItemHelper';

const db = new PrismaClient();

describe('createRejectedItemHelper', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('creates a rejected item with just the title supplied', async () => {
    const data: CreateRejectedItemHelperInput = {
      title: 'Never Suffer From PHP Again',
    };

    const item = await createRejectedItemHelper(db, data);

    // Expect to see the title we passed to the helper
    expect(item.title).to.equal(data.title);

    // Expect to see the remaining fields filled in for us
    expect(item.externalId).to.be.not.undefined;
    expect(item.prospectId).to.be.not.undefined;
    expect(item.url).to.be.not.undefined;
    expect(item.topic).to.be.not.undefined;
    expect(item.publisher).to.be.not.undefined;
    expect(item.language).to.be.not.undefined;
    expect(item.reason).to.be.not.undefined;
  });

  it('creates a rejected item with all properties supplied', async () => {
    const data: CreateRejectedItemHelperInput = {
      prospectId: 'abc-123',
      url: 'https://www.test.com/',
      title: 'Never Suffer From PHP Again',
      topic: 'Business',
      publisher: 'Any Publisher',
      language: 'EN',
      reason: 'unspecified',
    };

    const item = await createRejectedItemHelper(db, data);

    // Expect to see everything as specified to the helper
    expect(item).to.deep.include(data);
  });
});
