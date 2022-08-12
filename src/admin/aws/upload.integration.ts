import { uploadImageToS3, uploadImageToS3FromUrl } from './upload';
import s3 from './s3';
import Upload from 'graphql-upload/Upload.js';
import { createReadStream, unlinkSync, writeFileSync } from 'fs';
import config from '../../config';
import nock from 'nock';
import { ApprovedItemS3ImageUrl } from '../../shared/types';

const testFilePath = __dirname + '/test-image.jpeg';

function expectSuccessfulUpload(upload: ApprovedItemS3ImageUrl) {
  // Check that the returned url matches the expected pattern
  // http://localstack:4566/curated-corpus-api-local-images/some-random-path.jpeg
  const urlPrefix = config.aws.s3.localEndpoint;
  const urlPattern = new RegExp(
    `^${urlPrefix}/${config.aws.s3.bucket}/.+.jpeg$`
  );
  expect(upload.url).toMatch(urlPattern);
}

describe('Upload', () => {
  beforeEach(() => {
    writeFileSync(testFilePath, 'I am an image');
  });

  afterEach(() => {
    unlinkSync(testFilePath);
  });

  it('uploads an image to s3 using graphql Upload type', async () => {
    const image: Upload = {
      filename: 'test.jpeg',
      mimetype: 'image/jpeg',
      encoding: '7bit',
      createReadStream: () => createReadStream(testFilePath),
    };

    const upload = await uploadImageToS3(s3, image);

    expectSuccessfulUpload(upload);
  });

  it('uploads an image to s3 using the url', async () => {
    nock('https://pocket-image-cache.com')
      .get('/dancing-in-the-air.jpeg')
      .replyWithFile(200, testFilePath, {
        'Content-Type': 'image/jpeg',
      });

    const upload = await uploadImageToS3FromUrl(
      s3,
      'https://pocket-image-cache.com/dancing-in-the-air.jpeg'
    );

    expectSuccessfulUpload(upload);
  });
});
