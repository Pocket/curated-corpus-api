import nock from 'nock';
import { unlinkSync, writeFileSync } from 'fs';
import { FileUpload } from 'graphql-upload';
import { getFileUploadFromUrl } from './utils';
import { InvalidImageUrl } from './errors';

function getStreamContent(stream) {
  let content = '';
  return new Promise((resolve, reject) => {
    stream.on('data', (data) => (content += data.toString()));
    stream.on('end', () => resolve(content));
  });
}

describe('Upload Utils', () => {
  const testFilePath = __dirname + '/test-image.jpeg';

  beforeEach(() => {
    writeFileSync(testFilePath, 'I am an image');
  });

  afterEach(() => {
    unlinkSync(testFilePath);
  });

  it('converts an image from a URL to a graphql FileUpload type', async () => {
    nock('https://image.com')
      .get('/dancing-in-the-air.jpeg')
      .replyWithFile(200, testFilePath, {
        'Content-Type': 'image/jpeg',
      });

    const image: FileUpload = await getFileUploadFromUrl(
      'https://image.com/dancing-in-the-air.jpeg'
    );

    const stream = image.createReadStream();
    const content = await getStreamContent(stream);

    expect(content).toEqual('I am an image');
    expect(image.filename).toBe('image.jpeg');
    expect(image.mimetype).toBe('image/jpeg');
    expect(image.encoding).toBe('7bit');
  });

  it('throws an error if the URL content is not an image', async () => {
    nock('https://image.com')
      .get('/dancing-in-the-air.jpeg')
      .replyWithFile(200, testFilePath, {
        'Content-Type': 'application/json',
      });

    await expect(
      getFileUploadFromUrl('https://image.com/dancing-in-the-air.jpeg')
    ).rejects.toThrow(InvalidImageUrl);
  });
});
