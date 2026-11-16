import { createPlayer } from '../player.js';

async function app() {
  const element = id => document.getElementById(id);
  const canvas = element('screen');
  const context = canvas.getContext('2d');
  const player = createPlayer(await (await fetch('/text')).text());
  let width, height, cellWidth, cellHeight;

  function draw() {
    document.body.classList.toggle('idle', player.idle);
    document.body.classList.toggle('light', player.light);
    context.fillStyle = player.light ? '#fff' : '#000';
    context.fillRect(0, 0, width, height);
    context.fillStyle = player.light ? '#000' : '#fff';
    for (let index = 0; index < player.cells; index++) {
      context.fillText(
        player.character(index),
        (index % player.cols + .5) * cellWidth,
        (Math.floor(index / player.cols) + .5) * cellHeight,
        cellWidth,
      );
    }
    element('play').textContent = player.playing ? 'Pause' : 'Play';
    element('stream').setAttribute('aria-pressed', player.streaming);
    element('unit').textContent = player.streaming ? 'ms / row' : 'ms / page';
    element('position').textContent = player.status();
  }

  function layout() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    context.scale(devicePixelRatio, devicePixelRatio);
    context.font = '22px ' + element('font').value;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    player.resize(Math.max(1, Math.floor(width / context.measureText('M').width)), Math.max(1, Math.floor(height / 26)));
    cellWidth = width / player.cols;
    cellHeight = height / player.rows;
    draw();
  }

  element('play').onclick = () => { player.togglePlay(); draw(); };
  element('stream').onclick = () => { player.toggleStream(); draw(); };
  element('theme').onclick = () => { player.light = !player.light; draw(); };
  element('speed').oninput = () => { player.speed = +element('speed').value; };
  element('font').onchange = layout;
  for (const event of ['pointermove', 'pointerdown', 'keydown', 'input']) {
    document.addEventListener(event, () => { player.activity(); draw(); });
  }
  layout();
  new ResizeObserver(layout).observe(canvas);
  let last;
  requestAnimationFrame(function tick(now) {
    if (player.advance(last === undefined ? 0 : now - last)) draw();
    last = now;
    requestAnimationFrame(tick);
  });
}

app();
