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
 * Usage:
 *   const groupByScheduledDate = groupBy('scheduledDate');
 *   const groupedItems = groupByScheduledDate(items);
 *
 * @param key
 */
export function groupBy(key: string) {
  return function group(array) {
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
  };
}
