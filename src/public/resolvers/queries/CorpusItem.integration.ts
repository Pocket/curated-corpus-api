import { expect } from 'chai';
import { getServer } from '../../../test/public-server';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import {
  CORPUS_ITEM_REFERENCE_RESOLVER,
  CORPUS_ITEM_TARGET_REFERENCE_RESOLVER,
} from './sample-queries.gql';
import { createApprovedItemHelper } from '../../../test/helpers';
import { db } from '../../../test/admin-server';

describe('CorpusItem reference resolver', () => {
  const server = getServer(new CuratedCorpusEventEmitter());

  beforeAll(async () => {
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('returns the corpus item if it exists by reference resolver id', async () => {
    // Create an approved item.
    const approvedItem = await createApprovedItemHelper(db, {
      title: 'Story one',
    });

    const result = await server.executeOperation({
      query: CORPUS_ITEM_REFERENCE_RESOLVER,
      variables: {
        representations: [
          {
            __typename: 'CorpusItem',
            id: approvedItem.externalId,
          },
        ],
      },
    });

    expect(result.errors).to.be.undefined;

    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].title).to.equal(approvedItem.title);
    expect(result.data?._entities[0].authors).to.have.lengthOf(
      <number>approvedItem.authors?.length
    );
  });

  it('should return null if the reference resolver id provided is not known', async () => {
    const result = await server.executeOperation({
      query: CORPUS_ITEM_REFERENCE_RESOLVER,
      variables: {
        representations: [
          {
            __typename: 'CorpusItem',
            id: 'ABRACADABRA',
          },
        ],
      },
    });

    // The entity should be null
    expect(result.errors).to.be.undefined;
    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0]).to.be.null;
  });

  it('returns the corpus item if it exists by reference resolver url', async () => {
    // Create an approved item.
    const approvedItem = await createApprovedItemHelper(db, {
      title: 'Story one',
    });

    const result = await server.executeOperation({
      query: CORPUS_ITEM_REFERENCE_RESOLVER,
      variables: {
        representations: [
          {
            __typename: 'CorpusItem',
            url: approvedItem.url,
          },
        ],
      },
    });

    expect(result.errors).to.be.undefined;

    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].title).to.equal(approvedItem.title);
    expect(result.data?._entities[0].authors).to.have.lengthOf(
      <number>approvedItem.authors?.length
    );
  });

  it('should return null if the reference resolver url provided is not known', async () => {
    const result = await server.executeOperation({
      query: CORPUS_ITEM_REFERENCE_RESOLVER,
      variables: {
        representations: [
          {
            __typename: 'CorpusItem',
            url: 'ABRACADABRA',
          },
        ],
      },
    });

    // The entity should be null
    expect(result.errors).to.be.undefined;
    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0]).to.be.null;
  });

  it('returns the corpus item if it exists', async () => {
    // Create an approved item.
    const approvedItem = await createApprovedItemHelper(db, {
      title: 'Story one',
    });

    const result = await server.executeOperation({
      query: CORPUS_ITEM_REFERENCE_RESOLVER,
      variables: {
        representations: [
          {
            __typename: 'SavedItem',
            url: approvedItem.url,
          },
        ],
      },
    });

    expect(result.errors).to.be.undefined;

    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].corpusItem.title).to.equal(
      approvedItem.title
    );
    expect(result.data?._entities[0].corpusItem.authors).to.have.lengthOf(
      <number>approvedItem.authors?.length
    );
  });

  it('should return null if the url provided is not known', async () => {
    const result = await server.executeOperation({
      query: CORPUS_ITEM_REFERENCE_RESOLVER,
      variables: {
        representations: [
          {
            __typename: 'SavedItem',
            url: 'ABRACADABRA',
          },
        ],
      },
    });

    expect(result.errors).to.be.undefined;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].corpusItem).to.be.null;
  });

  it('returns the corpus target if its syndicated', async () => {
    // Create an approved item.
    const approvedItem = await createApprovedItemHelper(db, {
      title: 'Story one',
      url: 'https://getpocket.com/explore/item/why-exhaustion-is-not-unique-to-our-overstimulated-age',
    });

    const result = await server.executeOperation({
      query: CORPUS_ITEM_TARGET_REFERENCE_RESOLVER,
      variables: {
        representations: [
          {
            __typename: 'CorpusItem',
            id: approvedItem.externalId,
          },
        ],
      },
    });

    expect(result.errors).to.be.undefined;

    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].title).to.equal(approvedItem.title);
    expect(result.data?._entities[0].target.slug).to.equal(
      'why-exhaustion-is-not-unique-to-our-overstimulated-age'
    );
    expect(result.data?._entities[0].target.__typename).to.equal(
      'SyndicatedArticle'
    );
  });

  it('returns the corpus target if its collection', async () => {
    // Create an approved item.
    const approvedItem = await createApprovedItemHelper(db, {
      title: 'Story one',
      url: 'https://getpocket.com/collections/avocado-toast-was-king-these-recipes-are-vying-for-the-throne',
    });

    const result = await server.executeOperation({
      query: CORPUS_ITEM_TARGET_REFERENCE_RESOLVER,
      variables: {
        representations: [
          {
            __typename: 'CorpusItem',
            id: approvedItem.externalId,
          },
        ],
      },
    });

    expect(result.errors).to.be.undefined;

    expect(result.data).to.not.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0].title).to.equal(approvedItem.title);
    expect(result.data?._entities[0].target.slug).to.equal(
      'avocado-toast-was-king-these-recipes-are-vying-for-the-throne'
    );
    expect(result.data?._entities[0].target.__typename).to.equal('Collection');
  });
});
