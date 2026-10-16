import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_LISTING_VIDEOS,
  isWixVideoUrl,
  parseVideos,
  parseYouTubeId,
  youTubeEmbedUrl,
  wixVideoPlaybackUrl,
  wixVideoFromMediaItem,
} from '../src/lib/listing-attachments.ts';

const ID = 'dQw4w9WgXcQ';

test('parseYouTubeId accepts every common link shape and embed code', () => {
  for (const input of [
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?feature=share&v=${ID}&t=42`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `youtu.be/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `<iframe width="560" src="https://www.youtube.com/embed/${ID}?si=x" allowfullscreen></iframe>`,
  ]) {
    assert.equal(parseYouTubeId(input), ID, input);
  }
});

test('parseYouTubeId rejects lookalikes, other providers and bad IDs', () => {
  for (const input of [
    `https://youtube.com.evil.io/watch?v=${ID}`,
    `https://evil.io/youtube.com/watch?v=${ID}`,
    `javascript:alert(1)//youtu.be/${ID}`,
    'https://youtu.be/short',
    `https://youtu.be/${ID}x`,
    'https://youtu.be/<script>aa',
    'https://vimeo.com/123456',
    `https://user:pw@youtube.com/watch?v=${ID}`,
    '',
  ]) {
    assert.equal(parseYouTubeId(input), null, input);
  }
});

test('embed URL is always rebuilt on youtube-nocookie', () => {
  assert.equal(youTubeEmbedUrl(ID), `https://www.youtube-nocookie.com/embed/${ID}`);
});

test('isWixVideoUrl only allows HTTPS wixstatic hosts', () => {
  assert.equal(isWixVideoUrl('https://video.wixstatic.com/video/abc_123/file'), true);
  assert.equal(isWixVideoUrl('http://video.wixstatic.com/video/abc/file'), false);
  assert.equal(isWixVideoUrl('https://wixstatic.com.evil.io/video.mp4'), false);
  assert.equal(isWixVideoUrl('https://example.com/video.mp4'), false);
});

test('parseVideos validates mixed sources, dedupes and normalises', () => {
  const errors = [];
  const videos = parseVideos([
    { source: 'youtube', videoId: ID, url: 'https://anything', title: ' Walkthrough ' },
    { source: 'youtube', videoId: ID },
    { source: 'wix', url: 'https://video.wixstatic.com/video/abc/file', id: 'abc', poster: 'https://evil.io/p.jpg' },
  ], errors);
  assert.deepEqual(errors, []);
  assert.deepEqual(videos, [
    { source: 'youtube', videoId: ID, url: `https://youtu.be/${ID}`, title: 'Walkthrough' },
    { source: 'wix', url: 'https://video.wixstatic.com/video/abc/file', id: 'abc' },
  ]);
});

test('parseVideos rejects bad entries, too many videos and long labels', () => {
  const errors = [];
  parseVideos([
    { source: 'youtube', videoId: '<script>' },
    { source: 'wix', url: 'https://example.com/a.mp4' },
    { source: 'vimeo', url: 'https://vimeo.com/1' },
    { source: 'youtube', videoId: ID, title: 'x'.repeat(121) },
  ], errors);
  assert.equal(errors.length, 4);
  const tooMany = [];
  parseVideos(Array.from({ length: MAX_LISTING_VIDEOS + 1 }, () => ({ source: 'youtube', videoId: ID })), tooMany);
  assert.match(tooMany[0], /at most 20/);
  const notArray = [];
  assert.equal(parseVideos('x', notArray), undefined);
  assert.equal(notArray.length, 1);
});

test('Wix media identifiers become playable URLs and survive a mixed-source save/load', () => {
  const reference = 'wix:video://v1/abc_123/walkthrough.mp4#posterUri=abc.jpg&posterWidth=640&posterHeight=360';
  const selected = wixVideoFromMediaItem({
    _id: 'abc_123', displayName: ' Walkthrough ',
    url: 'https://static.wixstatic.com/media/original-file',
    media: { video: reference },
    thumbnailUrl: 'https://static.wixstatic.com/media/abc.jpg',
  });
  assert.deepEqual(selected, {
    source: 'wix', id: 'abc_123', title: 'Walkthrough',
    url: 'https://video.wixstatic.com/video/abc_123/file',
    poster: 'https://static.wixstatic.com/media/abc.jpg',
  });
  const errors = [];
  const videos = parseVideos(JSON.parse(JSON.stringify([
    { source: 'youtube', videoId: ID }, selected,
  ])), errors);
  assert.deepEqual(errors, []);
  assert.equal(videos.length, 2);
  assert.deepEqual(videos[1], selected);
  assert.deepEqual(parseVideos([{ source: 'wix', url: reference }], []), [
    { source: 'wix', url: selected.url },
  ]);
});

test('Media Manager prefers a browser-playable resolution over the general file URL', () => {
  const selected = wixVideoFromMediaItem({
    url: 'https://static.wixstatic.com/media/original-file',
    media: { video: { resolutions: [
      { format: 'hls', url: 'https://video.wixstatic.com/video/abc/master.m3u8' },
      { format: '720p.mp4', url: 'https://video.wixstatic.com/video/abc/720p/mp4/file.mp4' },
    ] } },
  });
  assert.equal(selected.url, 'https://video.wixstatic.com/video/abc/720p/mp4/file.mp4');
  assert.equal(wixVideoFromMediaItem({ url: 'https://video.wixstatic.com/video/abc/file' }).url, 'https://video.wixstatic.com/video/abc/file');
});

test('Wix video normalization rejects unsafe or malformed references', () => {
  for (const value of ['wix:video://v1/', 'wix:video://v1/../bad', 'wix:video://evil/abc', 'javascript:alert(1)', 'https://wixstatic.com.evil.io/file']) {
    assert.equal(wixVideoPlaybackUrl(value), null, value);
  }
  assert.equal(wixVideoFromMediaItem({ media: { video: 'wix:video://v1/abc' } }).url, 'https://video.wixstatic.com/video/abc/file');
  assert.equal(wixVideoFromMediaItem(null), null);
});
