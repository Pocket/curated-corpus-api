import { expect } from 'chai';
import { getServer } from '../../../test/public-server';
import { CuratedCorpusEventEmitter } from '../../../events/curatedCorpusEventEmitter';
import { CORPUS_ITEM_REFERENCE_RESOLVER } from './sample-queries.gql';
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

  it('should throw an error if the id provided is not known', async () => {
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

    // There should be errors
    expect(result.errors).not.to.be.null;

    expect(result.errors?.[0].message).to.contain(
      `Could not find Corpus Item with ID of "ABRACADABRA"`
    );
    expect(result.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');
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

    expect(result.errors).to.be.null;
    expect(result.data?._entities).to.have.lengthOf(1);
    expect(result.data?._entities[0]).to.be.null;
  });
});
