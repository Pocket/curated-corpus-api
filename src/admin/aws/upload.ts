import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { S3 } from 'aws-sdk';
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

  const params: S3.Types.PutObjectRequest = {
    Bucket: config.aws.s3.bucket,
    Key: key,
    Body: stream,
    ContentType: mimetype,
    ACL: 'public-read',
  };

  const response = await s3.upload(params).promise();

  return {
    url: response.Location,
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
