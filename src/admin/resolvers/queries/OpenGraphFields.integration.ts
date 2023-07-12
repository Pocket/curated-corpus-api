import { expect } from 'chai';
import { print } from 'graphql';
import request from 'supertest';
import { ApolloServer } from '@apollo/server';

import { GET_OPEN_GRAPH_FIELDS } from './sample-queries.gql';
import { MozillaAccessGroup } from '../../../shared/types';
import { startServer } from '../../../express';
import { IAdminContext } from '../../context';
import express from 'express';

const getDummyPageWithOGDescription = (description) => {
  return (
    '<html> <head>' +
    (description &&
      `<meta property="og:description" 
  content="${description}" />`) +
    '</head>' +
    '</html>'
  );
};

const pagePath = '/testpage';
const missingPagePath = '/missingPage';
const hangingPagePath = '/hangingPage';
const emptyPagePath = '/emptyPage';

const sampleDescriptionText = 'this is a test';

const makeWebServer = () => {
  const app = express();
  app.get(pagePath, async (req, res) => {
    res.status(200);
    res.contentType('text/html; charset=utf-8');
    res.send(getDummyPageWithOGDescription(sampleDescriptionText));
  });
  app.get(emptyPagePath, (req, res) => {
    res.status(200);
    res.contentType('text/html; charset=utf-8');
    res.send('');
  });
  app.get(hangingPagePath, async (req, res) => {
    res.status(200);
    res.contentType('text/html; charset=utf-8');
    await new Promise((f) => setTimeout(f, 500000));
    res.send(getDummyPageWithOGDescription(sampleDescriptionText));
  });
  return app.listen(0); // finds open port
};
describe('queries: OpenGraphFields', () => {
  let app: Express.Application;
  let server: ApolloServer<IAdminContext>;
  let graphQLUrl: string;

  beforeAll(async () => {
    // port 0 tells express to dynamically assign an available port
    ({ app, adminServer: server, adminUrl: graphQLUrl } = await startServer(0));
  });

  afterAll(async () => {
    await server.stop();
  });

  const headers = {
    name: 'Test User',
    username: 'test.user@test.com',
    groups: `group1,group2,${MozillaAccessGroup.READONLY}`,
  };

  describe('getOpenGraphFields query', () => {
    // Fake sample Rejected Curated Corpus items

    let webServer;

    beforeEach(async () => {
      webServer = makeWebServer();
    });

    afterEach(async () => {
      await webServer.close();
    });

    it('should get OG data', async () => {
      const serverInfo = webServer.address();
      const serverURL = `http://localhost:${serverInfo.port}${pagePath}`;
      const {
        body: { data },
      } = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_OPEN_GRAPH_FIELDS),
          variables: {
            url: serverURL,
          },
        });
      expect(data?.getOpenGraphFields.description).to.equal(
        sampleDescriptionText
      );
    });

    it('missing page', async () => {
      const serverInfo = webServer.address();
      const serverURL = `http://localhost:${serverInfo.port}${missingPagePath}`;
      const {
        body: { data },
      } = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_OPEN_GRAPH_FIELDS),
          variables: {
            url: serverURL,
          },
        });
      expect(data?.getOpenGraphFields.description).to.be.undefined;
    });

    it('hanging page', async () => {
      const serverInfo = webServer.address();
      const serverURL = `http://localhost:${serverInfo.port}${hangingPagePath}`;
      const {
        body: { data },
      } = await request(app)
        .post(graphQLUrl)
        .set(headers)
        .send({
          query: print(GET_OPEN_GRAPH_FIELDS),
          variables: {
            url: serverURL,
          },
        });
      expect(data?.getOpenGraphFields.description).to.be.undefined;
    });
  });
});
