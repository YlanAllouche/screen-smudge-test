import fs from 'node:fs';
import readline from 'node:readline';
import stringWidth from 'string-width';
import { createPlayer } from './player.js';

export function terminal(text) {
  const input = process.stdin;
  const output = process.stdout;
  const player = createPlayer(text);

  function draw() {
    player.resize(output.columns, Math.max(1, output.rows - (player.idle ? 0 : 1)));
    const lines = [];
    for (let row = 0; row < player.rows; row++) {
      let line = '';
      for (let col = 0; col < player.cols; col++) {
        const character = player.character(row * player.cols + col);
        line += stringWidth(character) === 1 ? character : '�';
      }
      lines.push(`\x1b[${row + 1};1H${line}`);
    }
    if (!player.idle) {
      const label = `${player.playing ? 'Pause' : 'Play'} | Space play/pause  S stream  B theme  +/- speed  Q quit | ${player.speed}ms/${player.streaming ? 'row' : 'page'} | ${player.status()}`;
      lines.push(`\x1b[${output.rows};1H${label.slice(0, player.cols).padEnd(player.cols)}`);
    }
    output.write((player.light ? '\x1b[30;107m' : '\x1b[97;40m') + lines.join(''));
  }

  readline.emitKeypressEvents(input);
  input.setRawMode(true);
  output.write('\x1b[?1049h\x1b[?25l\x1b[?7l');
  process.once('exit', () => {
    input.setRawMode(false);
    fs.writeSync(1, '\x1b[0m\x1b[?7h\x1b[?25h\x1b[?1049l');
  });
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.once(signal, () => process.exit());
  }
  input.on('keypress', (value, key) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) process.exit();
    player.activity();
    if (key.name === 'space') player.togglePlay();
    if (key.name === 's') player.toggleStream();
    if (key.name === 'b') player.light = !player.light;
    if (value === '+' || value === '=') player.speed = Math.max(1, Math.round(player.speed / 1.25));
    if (value === '-' || value === '_') player.speed = Math.round(player.speed * 1.25);
    draw();
  });
  output.on('resize', draw);
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    const changed = player.advance(now - last);
    last = now;
    if (changed) draw();
  }, 16);
  draw();
}
