// gta6-meme-x-01 — entry program (Node 22, standard library only).
//
// Job: hand the post over to the grader. The entry itself is the X post
// (a GTA 6 meme posted from a public account with make.fun mentioned
// and/or @makefunai + the play code in its text). POST.json at the repo
// root names that post by URL; this program copies that file into the
// output directory, where the gate reads it and hands the post to the
// judge. Nothing else is produced here.
//
// Run locally to check it:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Inside the grader's container the bot files live at /bot and the
// output goes to /output. Outside it, both paths can be overridden
// through the environment so the program can be run by hand.
const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const sourceFile = join(botDir, 'POST.json');
const targetFile = join(outputDir, 'POST.json');

// Make sure the output directory exists before copying into it.
mkdirSync(outputDir, { recursive: true });

try {
  copyFileSync(sourceFile, targetFile);
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`Could not copy POST.json from ${botDir}: ${reason}`);
  process.exit(1);
}

// The gate only accepts a real post address, so check the copied file
// actually names one: https://x.com/<handle>/status/<digits> (or the
// twitter.com form). A placeholder or a mistyped address fails loudly
// here instead of wasting a submit.
const postUrlPattern = /^https:\/\/(x\.com|twitter\.com)\/[^/]+\/status\/\d+$/;

let postUrl = '';
try {
  const parsed = JSON.parse(readFileSync(targetFile, 'utf8')) as { url?: unknown };
  if (typeof parsed.url === 'string') postUrl = parsed.url.trim();
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`Copied POST.json could not be read back: ${reason}`);
  process.exit(1);
}

if (!postUrlPattern.test(postUrl)) {
  console.error(`POST.json does not contain a valid X post URL: ${postUrl || '(empty)'}`);
  process.exit(1);
}

console.log(`POST.json copied to ${targetFile} — post: ${postUrl}`);
