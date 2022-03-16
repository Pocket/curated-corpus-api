import { CuratedStatus, PrismaClient } from '@prisma/client';
import { expect } from 'chai';
import { faker } from '@faker-js/faker';
import { clearDb } from './clearDb';
import {
  createApprovedItemHelper,
  CreateApprovedItemHelperInput,
} from './createApprovedItemHelper';

const db = new PrismaClient();

describe('createApprovedItemHelper', () => {
  beforeEach(async () => {
    await clearDb(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('creates an approved item with just the title supplied', async () => {
    const data: CreateApprovedItemHelperInput = { title: 'What even is time?' };

    const item = await createApprovedItemHelper(db, data);

    // Expect to see the title we passed to the helper
    expect(item.title).to.equal(data.title);

    // Expect to see the remaining fields filled in for us
    expect(item.externalId).to.be.not.undefined;
    expect(item.prospectId).to.be.not.undefined;
    expect(item.language).to.be.not.undefined;
    expect(item.publisher).to.be.not.undefined;
    expect(item.url).to.be.not.undefined;
    expect(item.imageUrl).to.be.not.undefined;
    expect(item.excerpt).to.be.not.undefined;
    expect(item.status).to.be.not.undefined;
    expect(item.topic).to.be.not.undefined;
    expect(item.isCollection).to.be.a('boolean');
    expect(item.isTimeSensitive).to.be.a('boolean');
    expect(item.isSyndicated).to.be.a('boolean');
  });

  it('creates a curated item with all properties supplied', async () => {
    const data: CreateApprovedItemHelperInput = {
      prospectId: '123-abc',
      title: 'What even is time?',
      excerpt: faker.lorem.sentences(3),
      status: CuratedStatus.RECOMMENDATION,
      language: 'en',
      imageUrl: faker.image.imageUrl(),
      createdBy: 'big-company|name.surname@example.com',
      topic: 'Business',
      isCollection: false,
      isTimeSensitive: false,
      isSyndicated: true,
    };

    const item = await createApprovedItemHelper(db, data);

    // Expect to see everything as specified to the helper
    expect(item).to.deep.include(data);
  });
});
