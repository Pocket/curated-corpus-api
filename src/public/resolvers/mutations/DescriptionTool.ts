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
  { input }
): Promise<DescriptionTool> {
  const pageMetadata = await getMetaData(input.url);
  const result: DescriptionTool = {
    data: pageMetadata.description,
  };
  return result;
}
