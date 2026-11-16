// Shared by the browser and terminal renderers.
export function createPlayer(text) {
  const compact = text
    .replace(/\r\n?/g, '\n')
    .replace(/\s+/g, whitespace => whitespace === ' ' ? ' '
      : ' ' + (whitespace.includes('\n') ? whitespace.split('\n').length > 2 ? '¶' : '↵' : '')
      + (whitespace.replace(/\n/g, '') ? '⋯' : '') + ' ')
    .replace(/[\x00-\x08\x0e-\x1f\x7f-\x9f]/g, '�');
  const characters = Array.from(
    new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(compact),
    segment => segment.segment,
  );

  return {
    cols: 0, rows: 0, cells: 0, start: 0, progress: 0, elapsed: 0, inactive: 0,
    playing: false, streaming: false, light: false, idle: false, speed: 1000,

    resize(cols, rows) {
      if (cols === this.cols && rows === this.rows) return;
      this.start = (this.start + this.progress) % characters.length;
      this.progress = 0;
      this.cols = cols;
      this.rows = rows;
      this.cells = cols * rows;
    },

    activity() {
      this.idle = false;
      this.inactive = 0;
    },

    togglePlay() {
      this.playing = !this.playing;
      this.idle = this.playing;
      this.inactive = 0;
    },

    toggleStream() {
      this.start = (this.start + this.progress) % characters.length;
      this.progress = this.elapsed = 0;
      this.streaming = !this.streaming;
      if (this.streaming) this.playing = true;
      this.idle = this.playing;
      this.inactive = 0;
    },

    advance(dt) {
      if (!this.playing) return false;
      const wasIdle = this.idle;
      this.inactive += dt;
      if (this.inactive >= 2000) this.idle = true;
      const interval = this.speed / (this.streaming ? this.cols : 1);
      this.elapsed += dt;
      const steps = Math.floor(this.elapsed / interval);
      if (steps) {
        this.elapsed %= interval;
        if (this.streaming) {
          this.progress += steps;
          this.start = (this.start + Math.floor(this.progress / this.cells) * this.cells) % characters.length;
          this.progress %= this.cells;
        } else {
          this.start = (this.start + steps * this.cells) % characters.length;
        }
      }
      return steps > 0 || wasIdle !== this.idle;
    },

    character(index) {
      return characters[(this.start + index + (index < this.progress ? this.cells : 0)) % characters.length];
    },

    status() {
      const percent = Math.floor(100 * ((this.start + this.progress) % characters.length) / characters.length);
      return `${this.streaming ? 'Stream' : 'Pages'} · ${percent}%`;
    },
  };
}
