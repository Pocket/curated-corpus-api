import { uploadImageToS3 } from './upload';
import s3 from './s3';
import { FileUpload } from 'graphql-upload';
import { createReadStream, unlinkSync, writeFileSync } from 'fs';
import config from '../../config';

const testFilePath = __dirname + '/test-image.jpeg';

describe('Upload', () => {
  beforeEach(() => {
    writeFileSync(testFilePath, 'I am an image');
  });

  afterEach(() => {
    unlinkSync(testFilePath);
  });

  it('uploads an image to s3 using graphql FileUpload type', async () => {
    const image: FileUpload = {
      filename: 'test.jpeg',
      mimetype: 'image/jpeg',
      encoding: '7bit',
      createReadStream: () => createReadStream(testFilePath),
    };

    const upload = await uploadImageToS3(s3, image);

    // Check that the returned url matches the expected pattern
    // http://localstack:4566/curated-corpus-api-local-images/some-random-path.jpeg
    const urlPrefix = config.aws.s3.localEndpoint;
    const urlPattern = new RegExp(
      `^${urlPrefix}/${config.aws.s3.bucket}/.+.jpeg$`
    );
    expect(upload.url).toMatch(urlPattern);
  });
});
