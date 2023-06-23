import { OpenGraphFields } from '../../../shared/types';
import getMetaData from 'metadata-scraper';

/**
 *
 * @param parent
 * @param data
 * @param context
 * @param db
 */
export async function requestOpenGraphFields(
  parent,
  { input }
): Promise<OpenGraphFields> {
  const pageMetadata = await getMetaData(input.url);
  const result: OpenGraphFields = {
    description: pageMetadata?.description || null,
  };
  return result;
}
