import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client';
import { client } from '../../../database/client';

import { CORPUS_ITEM_REFERENCE_RESOLVER } from './sample-queries.gql';
import { clearDb, createApprovedItemHelper } from '../../../test/helpers';
import { startServer } from '../../../express';
import { IPublicContext } from '../../context';

describe('CorpusItem reference resolver', () => {
  let app: Express.Application;
  let server: ApolloServer<IPublicContext>;
  let graphQLUrl: string;
  let db: PrismaClient;

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({
      app,
      publicServer: server,
      publicUrl: graphQLUrl,
    } = await startServer(0));
    db = client();
    await clearDb(db);
  });

  afterAll(async () => {
    await server.stop();
    await db.$disconnect();
  });

  it('returns the corpus item if it exists', async () => {
    // Create an approved item.
    const approvedItem = await createApprovedItemHelper(db, {
      title: 'Story one',
    });

    const result = await request(app)
      .post(graphQLUrl)
      .send({
        query: print(CORPUS_ITEM_REFERENCE_RESOLVER),
        variables: {
          representations: [
            {
              __typename: 'CorpusItem',
              id: approvedItem.externalId,
            },
          ],
        },
      });

    expect(result.body.errors).to.be.undefined;

    expect(result.body.data).to.not.be.null;
    expect(result.body.data?._entities).to.have.lengthOf(1);
    expect(result.body.data?._entities[0].title).to.equal(approvedItem.title);
    expect(result.body.data?._entities[0].authors).to.have.lengthOf(
      <number>approvedItem.authors?.length
    );
  });

  it('should throw an error if the id provided is not known', async () => {
    const result = await request(app)
      .post(graphQLUrl)
      .send({
        query: print(CORPUS_ITEM_REFERENCE_RESOLVER),
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
    expect(result.body.errors).to.not.be.undefined;

    expect(result.body.errors?.[0].message).to.contain(
      `Could not find Corpus Item with ID of "ABRACADABRA"`
    );
    expect(result.body.errors?.[0].extensions?.code).to.equal('BAD_USER_INPUT');
  });

  it('returns the corpus item if it exists', async () => {
    // Create an approved item.
    const approvedItem = await createApprovedItemHelper(db, {
      title: 'Story one',
    });

    const result = await request(app)
      .post(graphQLUrl)
      .send({
        query: print(CORPUS_ITEM_REFERENCE_RESOLVER),
        variables: {
          representations: [
            {
              __typename: 'SavedItem',
              url: approvedItem.url,
            },
          ],
        },
      });

    expect(result.body.errors).to.be.undefined;

    expect(result.body.data).to.not.be.null;
    expect(result.body.data?._entities).to.have.lengthOf(1);
    expect(result.body.data?._entities[0].corpusItem.title).to.equal(
      approvedItem.title
    );
    expect(result.body.data?._entities[0].corpusItem.authors).to.have.lengthOf(
      <number>approvedItem.authors?.length
    );
  });

  it('should return null if the url provided is not known', async () => {
    const result = await request(app)
      .post(graphQLUrl)
      .send({
        query: print(CORPUS_ITEM_REFERENCE_RESOLVER),
        variables: {
          representations: [
            {
              __typename: 'SavedItem',
              url: 'ABRACADABRA',
            },
          ],
        },
      });

    expect(result.body.errors).to.be.undefined;
    expect(result.body.data?._entities).to.have.lengthOf(1);
    expect(result.body.data?._entities[0].corpusItem).to.be.null;
  });
});
