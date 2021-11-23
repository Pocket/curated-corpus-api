import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { S3 } from 'aws-sdk';
import config from '../../config';
import { FileUpload } from 'graphql-upload';
import { ApprovedItemS3ImageUrl } from '../../shared/types';

/**
 * @param s3
 * @param image
 */
export async function uploadImageToS3(
  s3: S3,
  image: FileUpload
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
