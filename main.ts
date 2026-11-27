// THE DAILY WORLD - Friday 27 November 2026
// A make.fun news-image entry (Node 22, standard library only).
// Draws a newspaper front page summing up 27 November 2026 in code and
// writes a deterministic 1024x1024 PNG to (MAKEFUN_OUTPUT_DIR ?? "/output")/entry.png.
// No network, no assets, no randomness: two runs write the same bytes.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- PNG encoder

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(width: number, height: number, rgb: Buffer): Buffer {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const off = y * (1 + width * 3);
    raw[off] = 0; // filter: none
    rgb.copy(raw, off + 1, y * width * 3, (y + 1) * width * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- 5x7 bitmap font

type Glyph = string[];
const FONT: Record<string, Glyph> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  ':': ['00000', '01100', '00000', '00000', '00000', '01100', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '*': ['00000', '00100', '10101', '01110', '10101', '00100', '00000'],
};

const CHAR_W = 6; // 5 px glyph + 1 px gap
const CHAR_H = 7;

// ---------------------------------------------------------------- canvas

const W = 1024;
const H = 1024;
const PAPER: [number, number, number] = [247, 242, 230];
const INK: [number, number, number] = [28, 23, 18];
const RED: [number, number, number] = [158, 27, 30];
const BLUE: [number, number, number] = [43, 74, 111];
const SKY: [number, number, number] = [207, 224, 238];
const SUN: [number, number, number] = [240, 196, 84];
const GREY: [number, number, number] = [120, 116, 108];
const LIGHT: [number, number, number] = [255, 255, 255];

type RGB = [number, number, number];

const buf = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  buf[i * 3] = PAPER[0];
  buf[i * 3 + 1] = PAPER[1];
  buf[i * 3 + 2] = PAPER[2];
}

function px(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(xx, yy, c);
}

function hline(x: number, y: number, w: number, t: number, c: RGB): void {
  rect(x, y, w, t, c);
}

function circle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) px(x, y, c);
    }
  }
}

function textWidth(s: string, scale: number): number {
  return s.length * CHAR_W * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: RGB): void {
  const upper = s.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const g = FONT[upper[i]] ?? FONT[' '];
    const ox = x + i * CHAR_W * scale;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (g[row][col] === '1') rect(ox + col * scale, y + row * scale, scale, scale, c);
      }
    }
  }
}

function drawCentred(s: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}

function wrap(s: string, maxWidth: number, scale: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const trial = line ? line + ' ' + w : w;
    if (textWidth(trial, scale) <= maxWidth) {
      line = trial;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrapped(s: string, x: number, y: number, maxWidth: number, scale: number, c: RGB, gap: number): number {
  const lines = wrap(s, maxWidth, scale);
  for (let i = 0; i < lines.length; i++) {
    drawText(lines[i], x, y + i * (CHAR_H * scale + gap), scale, c);
  }
  return y + lines.length * (CHAR_H * scale + gap);
}

// ---------------------------------------------------------------- front page

const M = 36; // margin
const CW = W - 2 * M; // content width 952

// Frame: double rule border
rect(14, 14, W - 28, 3, INK);
rect(14, H - 17, W - 28, 3, INK);
rect(14, 14, 3, H - 28, INK);
rect(W - 17, 14, 3, H - 28, INK);
rect(24, 24, W - 48, 1, INK);
rect(24, H - 25, W - 48, 1, INK);
rect(24, 24, 1, H - 48, INK);
rect(W - 25, 24, 1, H - 48, INK);

// Masthead
drawCentred('THE DAILY WORLD', W / 2, 44, 9, INK);
hline(M, 122, CW, 1, INK);

// Dateline row
drawText('NO. 331', M, 132, 2, INK);
drawCentred('FRIDAY 27 NOVEMBER 2026', W / 2, 130, 3, INK);
drawText('PRICE $2.50', W - M - textWidth('PRICE $2.50', 2), 132, 2, INK);
hline(M, 158, CW, 3, INK);
hline(M, 164, CW, 1, INK);

// Kicker
drawCentred('THE DAY AFTER THANKSGIVING', W / 2, 178, 2, RED);

// Headline
drawCentred('BLACK FRIDAY', W / 2, 200, 12, INK);
drawCentred('CROWDS FLOOD THE SALES', W / 2, 292, 6, INK);

// Standfirst
drawCentred('SHOPPERS QUEUE BEFORE DAWN IN NEW YORK, LONDON AND', W / 2, 348, 2, INK);
drawCentred('PARIS AS THE BIGGEST SHOPPING DAY OF THE YEAR OPENS', W / 2, 368, 2, INK);

// ---------------------------------------------------------------- hero picture
const PX0 = M;
const PY0 = 392;
const PW = CW;
const PH = 268;

// Sky
rect(PX0, PY0, PW, PH, SKY);
// Sun
circle(PX0 + PW - 90, PY0 + 52, 30, SUN);
// Distant buildings (left of the storefront, clear of the sale sign)
rect(PX0 + 30, PY0 + 90, 120, 110, [90, 108, 128]);
rect(PX0 + 170, PY0 + 60, 100, 140, [70, 88, 110]);
// Building windows
for (let i = 0; i < 4; i++) {
  rect(PX0 + 48 + i * 26, PY0 + 108, 14, 18, [240, 230, 200]);
  rect(PX0 + 188 + i * 22, PY0 + 78, 12, 16, [240, 230, 200]);
}
// Storefront, moved right so the queue stands clear of its sale sign
rect(PX0 + 560, PY0 + 120, 352, 110, [178, 52, 46]);
rect(PX0 + 560, PY0 + 120, 352, 14, [120, 30, 28]);
// Awning stripes
for (let i = 0; i < 8; i++) {
  rect(PX0 + 560 + i * 44, PY0 + 134, 22, 26, i % 2 === 0 ? LIGHT : RED);
}
// Sale sign on the storefront
rect(PX0 + 590, PY0 + 168, 292, 46, LIGHT);
rect(PX0 + 590, PY0 + 168, 292, 3, INK);
rect(PX0 + 590, PY0 + 211, 292, 3, INK);
drawCentred('SALE 50% OFF', PX0 + 736, PY0 + 176, 3, RED);
// Door and windows
rect(PX0 + 590, PY0 + 222, 40, 8, INK);
rect(PX0 + 840, PY0 + 222, 40, 8, INK);
rect(PX0 + 646, PY0 + 222, 176, 8, [60, 60, 60]);
// Sidewalk and road
rect(PX0, PY0 + 230, PW, 38, [214, 208, 196]);
hline(PX0, PY0 + 230, PW, 2, GREY);
hline(PX0, PY0 + 252, PW, 2, [255, 255, 255]);

// Queue of shoppers: heads, bodies, bags
const SHIRTS: RGB[] = [[43, 74, 111], [158, 27, 30], [46, 110, 70], [120, 72, 140], [190, 120, 30], [40, 120, 120]];
for (let i = 0; i < 6; i++) {
  const qx = PX0 + 60 + i * 56;
  const qy = PY0 + 236;
  circle(qx + 11, qy - 34, 10, [232, 190, 150]); // head
  rect(qx, qy - 22, 22, 26, SHIRTS[i]); // body
  rect(qx + 3, qy + 4, 6, 12, INK); // legs
  rect(qx + 13, qy + 4, 6, 12, INK);
  rect(qx + 24, qy - 8, 12, 14, [190, 120, 30]); // shopping bag
  rect(qx + 27, qy - 12, 6, 4, INK); // bag handle
}
// Picture frame
rect(PX0, PY0, PW, 3, INK);
rect(PX0, PY0 + PH - 3, PW, 3, INK);
rect(PX0, PY0, 3, PH, INK);
rect(PX0 + PW - 3, PY0, 3, PH, INK);

// Caption
drawCentred('SHOPPERS WAIT OUTSIDE A DEPARTMENT STORE BEFORE DAWN', W / 2, 672, 2, INK);
drawCentred('ON BLACK FRIDAY IN NEW YORK', W / 2, 692, 2, INK);
hline(M, 722, CW, 1, INK);

// ---------------------------------------------------------------- three columns
const COL_W = 300;
const COL_X = [M, M + 326, M + 652];
const COL_Y = 740;

const COLUMNS: { head: string; body: string }[] = [
  {
    head: 'THANKSGIVING TRAVEL',
    body: 'Millions head home after the holiday. Airports report their busiest travel weekend of the year as families return from Thanksgiving.',
  },
  {
    head: 'ONLINE DEALS',
    body: 'Web sales open strong as shoppers hunt discounts from home. Retailers expect record online orders on the biggest shopping day of the year.',
  },
  {
    head: 'AROUND THE WORLD',
    body: 'Climate talks in Turkey close after two weeks. Markets watch holiday spending closely. Football returns for the weekend fixtures.',
  },
];

for (let c = 0; c < 3; c++) {
  const x = COL_X[c];
  drawText(COLUMNS[c].head, x, COL_Y, 2, RED);
  hline(x, COL_Y + 22, COL_W, 2, INK);
  drawWrapped(COLUMNS[c].body, x, COL_Y + 36, COL_W, 2, INK, 5);
  // red square bullets for the third column
  if (c === 2) {
    const lines = wrap(COLUMNS[c].body, COL_W - 18, 2);
    for (let i = 0; i < lines.length; i++) {
      rect(x, COL_Y + 36 + i * 19 + 4, 7, 7, RED);
    }
    // redraw body text shifted right to clear the bullets
    rect(x, COL_Y + 36, COL_W, 150, PAPER);
    drawText(COLUMNS[c].head, x, COL_Y, 2, RED);
    hline(x, COL_Y + 22, COL_W, 2, INK);
    for (let i = 0; i < lines.length; i++) {
      drawText(lines[i], x + 18, COL_Y + 36 + i * 19, 2, INK);
      rect(x, COL_Y + 36 + i * 19 + 4, 7, 7, RED);
    }
  }
}

// ---------------------------------------------------------------- footer
hline(M, 956, CW, 3, INK);
hline(M, 962, CW, 1, INK);
drawCentred('THE DAILY WORLD - FRIDAY 27 NOVEMBER 2026', W / 2, 976, 2, INK);

// ---------------------------------------------------------------- write output

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePng(W, H, buf));
