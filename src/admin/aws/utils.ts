import { FileUpload } from 'graphql-upload';
import fetch from 'node-fetch';
import mime from 'mime-types';
import { InvalidImageUrl } from './errors';

/**
 * Fetch image from URL and transform into a GraphQL FileUpload object
 * @param url
 */
export async function getFileUploadFromUrl(url: string): Promise<FileUpload> {
  try {
    const res = await fetch(url);
    const contentType = res.headers.get('content-type');

    checkValidImageContentType(contentType);

    return {
      filename: `image.${mime.extension(contentType)}`,
      mimetype: contentType,
      encoding: '7bit',
      createReadStream: () => res.body,
    };
  } catch (e) {
    throw new InvalidImageUrl();
  }
}

/**
 * Check content type header is a valid image content type.
 * Must begin with image
 * @param contentType
 */
export function checkValidImageContentType(contentType): boolean {
  if (!contentType?.startsWith('image')) throw new Error();

  return true;
}
