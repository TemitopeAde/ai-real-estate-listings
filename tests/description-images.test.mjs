import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizeDescriptionImages } from '../src/lib/description-images.ts';

const wix = 'https://static.wixstatic.com/media/11062b_58a1e9~mv2.jpg';

test('Wix media images are served as 16:10 resized copies and lazy-loaded', () => {
  assert.equal(
    optimizeDescriptionImages(`<p>Hi</p><img src="${wix}?token=x">`),
    `<p>Hi</p><img src="${wix}/v1/fill/w_1280,h_800/file.webp" loading="lazy" decoding="async">`,
  );
});

test('transformed, animated, external and non-Wix-media images keep their source', () => {
  for (const src of [
    `${wix}/v1/fit/w_640,h_640/file.jpg`,
    'https://static.wixstatic.com/media/anim~mv2.gif',
    'https://example.com/photo.jpg',
    'http://static.wixstatic.com/media/insecure.jpg',
  ]) {
    assert.equal(optimizeDescriptionImages(`<img src="${src}" />`), `<img src="${src}" loading="lazy" decoding="async" />`);
  }
});

test('existing loading attributes are kept and HTML without images is unchanged', () => {
  assert.equal(
    optimizeDescriptionImages(`<img loading="eager" decoding="sync" src='${wix}'>`),
    `<img loading="eager" decoding="sync" src='${wix}/v1/fill/w_1280,h_800/file.webp'>`,
  );
  const html = '<p>No <strong>images</strong> here.</p>';
  assert.equal(optimizeDescriptionImages(html), html);
  assert.equal(optimizeDescriptionImages(''), '');
});
