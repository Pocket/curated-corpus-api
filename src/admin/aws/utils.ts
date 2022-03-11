import { FileUpload } from 'graphql-upload';
import fetch from 'node-fetch';
import mime from 'mime-types';

/**
 * Fetch image from URL and transform into a GraphQL FileUpload object
 * @param url
 */
export async function getFileUploadFromUrl(url: string): Promise<FileUpload> {
  const res = await fetch(url);
  const contentType = res.headers.get('content-type');

  if (!contentType?.startsWith('image')) {
    throw new Error('URL content is not an image');
  }

  return {
    filename: `image.${mime.extension(contentType)}`,
    mimetype: contentType,
    encoding: '7bit',
    createReadStream: () => res.body,
  };
}
