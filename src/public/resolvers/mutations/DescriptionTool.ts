import { DescriptionTool } from '../../../shared/types';
import getMetaData from 'metadata-scraper';

/**
 *
 * @param parent
 * @param data
 * @param context
 * @param db
 */
export async function mutateDescriptionTool(
  parent,
  { data }
): Promise<DescriptionTool> {
  const url = 'https://github.com/BetaHuhn/metadata-scraper';
  const pageMetadata = await getMetaData(url);
  const result: DescriptionTool = {
    data: pageMetadata.description,
  };
  return result;
}
