import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer } from '../src/player.js';

const frame = player => Array.from({ length: player.cells }, (_, index) => player.character(index));

for (const content of ['A', 'abcdefg', '0123456789ABCDEFGHIJK']) {
  test(`pages and stream fill the grid and loop (${content.length} characters)`, () => {
    const player = createPlayer(content);
    player.resize(4, 3);
    assert.deepEqual(frame(player), Array.from({ length: 12 }, (_, index) => content[index % content.length]));
    player.togglePlay();
    for (let page = 1; page <= 20; page++) {
      player.advance(1000);
      assert.deepEqual(frame(player), Array.from({ length: 12 }, (_, index) => content[(page * 12 + index) % content.length]));
    }
    player.togglePlay();
    const paused = frame(player);
    assert.equal(player.advance(10000), false);
    assert.deepEqual(frame(player), paused);

    const stream = createPlayer(content);
    stream.resize(4, 3);
    stream.speed = 400;
    stream.toggleStream();
    const expected = frame(stream);
    for (let step = 0; step < 100; step++) {
      expected[step % 12] = content[(12 + step) % content.length];
      stream.advance(100);
      assert.deepEqual(frame(stream), expected);
    }
  });
}

test('each whitespace character becomes a dot while Unicode graphemes stay intact', () => {
  const player = createPlayer('a\n\n    b\tc\r\nd\x1b[31m é 👩🏽‍💻');
  player.resize(22, 1);
  assert.equal(frame(player).join(''), 'a······b·c··d�[31m·é·👩🏽‍💻');
});

test('playback controls hide immediately, reveal on activity, and stay visible while paused', () => {
  const player = createPlayer('some text');
  player.resize(4, 3);
  player.togglePlay();
  assert.equal(player.idle, true);
  player.activity();
  player.advance(1999);
  assert.equal(player.idle, false);
  player.advance(1);
  assert.equal(player.idle, true);
  player.togglePlay();
  player.advance(5000);
  assert.equal(player.idle, false);
  player.toggleStream();
  assert.equal(player.playing, true);
  assert.equal(player.idle, true);
});

test('resize retains the stream position and ignores unchanged dimensions', () => {
  const player = createPlayer('0123456789ABCDEFGHIJK');
  player.resize(4, 3);
  player.toggleStream();
  player.advance(500);
  const position = (player.start + player.progress) % 21;
  player.resize(6, 2);
  assert.equal(player.character(0), '0123456789ABCDEFGHIJK'[position]);
  const before = frame(player);
  player.resize(6, 2);
  assert.deepEqual(frame(player), before);
});
