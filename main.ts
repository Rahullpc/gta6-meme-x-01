// gta6-meme-x-01 v6 — "Jason's Reminder + Paid by my AI agent" (Node 22+, stdlib only).
//
// What this entry is: the boss's GTA 6 screenshot of Jason holding his
// phone in the car, with exactly TWO things changed on the phone screen:
//
//   1. The Reminders widget now says, verbatim:
//        Reminder
//        There are 20 bounty available on make.fun—complete them now!
//   2. A second notification card right below it, mascot logo beside
//      the text, verbatim:
//        PAID BY MY AI AGENT
//        with real money it won in make.fun bounties. make.fun.
//
// Everything else in the photo (status bar, wallpaper, app icons,
// "Contacts", Jason's hand, the car, the trees, the speedometer, the
// game text) is untouched. The picture is meme.png, drawn by
// gen_meme.py; the X post that carries it is named in POST.json.
//
// This file is the gate between the post and the grader. It checks two
// things and refuses to continue until both are true:
//   1. POST.json holds a real X post URL (the REPLACE_AFTER_POSTING
//      placeholder is not one — post the meme first).
//   2. meme.png is really a 1600x1600 PNG (size read from the IHDR
//      header bytes, not trusted from any filename).
// Then it copies POST.json into the output directory and reports the
// post URL. Any failure prints one clear line and exits 1.
//
// Written from scratch for v6 (not copied from any starter kit).
//
// Check the entry by hand before submitting:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const WANT_WIDTH = 1600;
const WANT_HEIGHT = 1600;

// A real post address, e.g. https://x.com/0xvdantee/status/1234567890.
const X_POST = /^https:\/\/(x\.com|twitter\.com)\/[^/]+\/status\/\d+$/;

function fail(reason: string): never {
  console.error(`gta6-meme-x-01 v6: ${reason}`);
  process.exit(1);
}

function readPngSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  const magic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length < 24 || !buf.subarray(0, 8).equals(magic)) {
    fail(`${file} is not a PNG file.`);
  }
  if (buf.subarray(12, 16).toString("ascii") !== "IHDR") {
    fail(`${file} has no IHDR chunk — not a valid PNG.`);
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function readPostUrl(file: string): string {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    fail(`POST.json is not valid JSON (${(err as Error).message}).`);
  }
  if (typeof data !== "object" || data === null || !("url" in data)) {
    fail(`POST.json must be an object with a "url" field.`);
  }
  const url = (data as { url: unknown }).url;
  if (typeof url !== "string" || !X_POST.test(url)) {
    fail(
      `POST.json "url" is not a real X post URL yet (${String(url)}). ` +
        `Post the meme on X first, then put the post URL in POST.json.`,
    );
  }
  return url;
}

const memeFile = join(BOT_DIR, "meme.png");
if (!existsSync(memeFile)) {
  fail(`meme.png is missing from ${BOT_DIR} — run gen_meme.py first.`);
}
const { width, height } = readPngSize(memeFile);
if (width !== WANT_WIDTH || height !== WANT_HEIGHT) {
  fail(
    `meme.png is ${width}x${height}, expected ${WANT_WIDTH}x${WANT_HEIGHT}. ` +
      `Regenerate it with gen_meme.py.`,
  );
}

const postFile = join(BOT_DIR, "POST.json");
if (!existsSync(postFile)) {
  fail(`POST.json not found in ${BOT_DIR} — post the meme first.`);
}
const url = readPostUrl(postFile);

mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(postFile, join(OUT_DIR, "POST.json"));
console.log(`gta6-meme-x-01 v6: OK — meme.png ${width}x${height}, post ${url}`);
