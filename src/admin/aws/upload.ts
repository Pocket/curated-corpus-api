import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';

import config from '../../config';
import Upload from 'graphql-upload/Upload.js';
import { ApprovedItemS3ImageUrl } from '../../shared/types';
import { getFileUploadFromUrl } from './utils';

/**
 * @param s3
 * @param image
 */
export async function uploadImageToS3(
  s3: S3,
  image: Upload
): Promise<ApprovedItemS3ImageUrl> {
  const { mimetype, createReadStream } = image;
  const stream = createReadStream();
  const key = `${uuidv4()}.${mime.extension(mimetype)}`;

  const command = new PutObjectCommand({
    Bucket: config.aws.s3.bucket,
    Key: key,
    Body: stream,
    ContentType: mimetype,
    ACL: 'public-read',
  });

  await s3.send(command);

  return {
    url: `${config.aws.s3.path}${key}`,
  };
}

/**
 * Get image content from URL and upload to s3
 * @param s3
 * @param url
 */
export async function uploadImageToS3FromUrl(
  s3: S3,
  url: string
): Promise<ApprovedItemS3ImageUrl> {
  const image = await getFileUploadFromUrl(url);
  return uploadImageToS3(s3, image);
}
