import { ScheduledSurface, ScheduledSurfaces } from './types';
import {ApprovedItem, ApprovedItemAuthor, CorpusItem, ScheduledSurfaceItem} from "../database/types";
import {DateTime} from "luxon";

/**
 * Generate an integer Epoch time from a JavaScript Date object.
 *
 * @param date
 */
export const getUnixTimestamp = (date: Date): number => {
  return parseInt((date.getTime() / 1000).toFixed(0));
};

/**
 * Returns a function that groups an array of objects by a given property's
 * value.
 *
 * @param array
 * @param key
 */
export function groupBy(array: any[], key: string) {
  const obj = array.reduce((acc, obj) => {
    const property = obj[key];
    acc[property] = acc[property] || [];
    acc[property].push(obj);
    return acc;
  }, {});

  const result: any[] = [];
  for (const key in obj) {
    result.push(obj[key]);
  }

  return result;
}

/**
 * Converts a Date object to a YYYY-MM-DD string (in UTC)
 */
export function toUtcDateString(date: Date) {
  const month = date.getUTCMonth() + 1; // zero-indexed
  const padMonthString = month.toString().padStart(2, '0');
  const padDayString = date.getUTCDate().toString().padStart(2, '0');
  return `${date.getUTCFullYear()}-${padMonthString}-${padDayString}`;
}

// Pocket shared data utility constructs/functions

// array for easy access to scheduled surface guids
export const scheduledSurfaceAllowedValues = ScheduledSurfaces.map(
  (surface) => {
    return surface.guid;
  }
);

// array for easy access to scheduled surface access groups
export const scheduledSurfaceAccessGroups = ScheduledSurfaces.map(
  (surface: ScheduledSurface) => {
    return surface.accessGroup;
  }
);

export const getScheduledSurfaceByAccessGroup = (
  group: string
): ScheduledSurface | undefined => {
  return ScheduledSurfaces.find(
    (surface: ScheduledSurface) => surface.accessGroup === group
  );
};

export const getScheduledSurfaceByGuid = (
  guid: string
): ScheduledSurface | undefined => {
  return ScheduledSurfaces.find(
    (surface: ScheduledSurface) => surface.guid === guid
  );
};

export const getCorpusItemFromApprovedItem = (
  approvedItem: ApprovedItem
): CorpusItem => {
  return {
    id: approvedItem.externalId,
    url: approvedItem.url,
    title: approvedItem.title,
    excerpt: approvedItem.excerpt,
    authors: approvedItem.authors as ApprovedItemAuthor[],
    language: approvedItem.language,
    publisher: approvedItem.publisher,
    imageUrl: approvedItem.imageUrl,
    // so the type definition in /src/database/types has topic as optional,
    // which typescript resolves as `string | undefined`. however, if the
    // topic is missing in the db, prisma returns `null` - hence the
    // nullish coalescing operator below.
    //
    // i wonder why typescript won't accept both. is there some deep dark
    // JS reason? or is it just better practice?
    topic: approvedItem.topic ?? undefined,
  };
};
// End Pocket shared data utility constructs/functions
