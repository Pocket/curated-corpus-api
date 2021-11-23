import fetch from 'node-fetch';
import { expect } from 'chai';
import config from '../../config';
import { ReviewedCorpusItemEventType } from '../types';
import { CuratedCorpusItemUpdate } from '../../events/snowplow/schema';
import { ReviewedItemSnowplowHandler } from './ReviewedItemSnowplowHandler';
import { tracker } from '../../events/snowplow/tracker';
import { CuratedCorpusEventEmitter } from '../curatedCorpusEventEmitter';

async function snowplowRequest(path: string, post = false): Promise<any> {
  const response = await fetch(`http://${config.snowplow.endpoint}${path}`, {
    method: post ? 'POST' : 'GET',
  });
  return await response.json();
}

async function resetSnowplowEvents(): Promise<void> {
  await snowplowRequest('/micro/reset', true);
}

async function getAllSnowplowEvents(): Promise<{ [key: string]: any }> {
  return snowplowRequest('/micro/all');
}

async function getGoodSnowplowEvents(): Promise<{ [key: string]: any }> {
  return snowplowRequest('/micro/good');
}

function parseSnowplowData(data: string): { [key: string]: any } {
  return JSON.parse(Buffer.from(data, 'base64').toString());
}

function assertValidSnowplowObjectUpdateEvents(
  events,
  triggers: CuratedCorpusItemUpdate['trigger'][]
) {
  const parsedEvents = events
    .map(parseSnowplowData)
    .map((parsedEvent) => parsedEvent.data);

  expect(parsedEvents).to.include.deep.members(
    triggers.map((trigger) => ({
      schema: config.snowplow.schemas.objectUpdate,
      data: { trigger: trigger, object: 'reviewed_corpus_item' },
    }))
  );
}

function assertApiAndUserSchema(eventContext: { [p: string]: any }) {
  expect(eventContext.data).to.include.deep.members([
    {
      schema: config.snowplow.schemas.user,
      data: {
        user_id: parseInt(eventData.user.id),
        hashed_user_id: testAccountData.hashedId,
      },
    },
    {
      schema: config.snowplow.schemas.apiUser,
      data: { api_id: parseInt(eventData.apiUser.apiId) },
    },
  ]);
}

function assertValidSnowplowEventContext(data) {
  const eventContext = parseSnowplowData(data);
  assertApiAndUserSchema(eventContext);
}

const testAccountData = {
  id: '1',
  hashedId: 'sfddads',
  emailAliases: ['test@pocket.com'],
  ssoServices: [SsoService.GOOGLE, SsoService.FIREFOX],
  isPremium: false,
  isSaveDigestSubscriber: false,
  isProductUpdatesSubscriber: false,
  createdAt: 16564364,
};

const eventData = {
  user: {
    ...testAccountData,
  },
  apiUser: { apiId: '1' },
};

describe('ReviewedItemSnowplowHandler', () => {
  beforeEach(async () => {
    await resetSnowplowEvents();
  });

  it('should send good events to snowplow', async () => {
    const emitter = new CuratedCorpusEventEmitter();
    new ReviewedItemSnowplowHandler(emitter, tracker, [
      ReviewedCorpusItemEventType.ACCOUNT_DELETE,
      ReviewedCorpusItemEventType.ACCOUNT_EMAIL_UPDATED,
    ]);
    emitter.emit(ReviewedCorpusItemEventType.ACCOUNT_DELETE, {
      ...eventData,
      eventType: ReviewedCorpusItemEventType.ACCOUNT_DELETE,
    });
    emitter.emit(ReviewedCorpusItemEventType.ACCOUNT_EMAIL_UPDATED, {
      ...eventData,
      eventType: ReviewedCorpusItemEventType.ACCOUNT_EMAIL_UPDATED,
    });

    // wait a sec * 3
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // make sure we only have good events
    const allEvents = await getAllSnowplowEvents();
    expect(allEvents.total).to.equal(2);
    expect(allEvents.good).to.equal(2);
    expect(allEvents.bad).to.equal(0);

    const goodEvents = await getGoodSnowplowEvents();

    assertValidSnowplowEventContext(goodEvents[0].rawEvent.parameters.cx);
    assertValidSnowplowEventContext(goodEvents[1].rawEvent.parameters.cx);
    assertValidSnowplowObjectUpdateEvents(
      goodEvents.map((goodEvent) => goodEvent.rawEvent.parameters.ue_px),
      ['account_delete', 'account_email_updated']
    );
  });
});
