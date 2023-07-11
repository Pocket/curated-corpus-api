import { OpenGraphFields } from '../../../shared/types';
import getMetaData from 'metadata-scraper';

/**
 *
 * @param parent
 * @param data Data contains a URL of the page to request
 */
export async function getOpenGraphFields(
  parent,
  { url }
): Promise<OpenGraphFields> {
  const pageMetadata = await getMetaData(url, { maxRedirects: 2, timeout: 5 });
  return {
    description: pageMetadata?.description || null,
  };
}
