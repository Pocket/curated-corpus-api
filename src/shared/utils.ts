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
