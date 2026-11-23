// gta6-meme-x-01 v6 — "Jason's Reminder + Paid by my AI agent"
//
// Entry ini adalah meme GTA 6 berupa layar HP Jason: di atas foto aslinya
// ditempel widget Reminder dan satu kartu notifikasi bertuliskan
// "PAID BY MY AI AGENT". Foto aslinya sendiri tidak diubah — hanya dua
// elemen layar HP itu yang ditambahkan di atasnya.
//
// Saat dijalankan, program ini hanya memverifikasi dua artefak yang sudah
// ada di folder bot, lalu menyalin bukti postingannya ke folder output:
//   1. meme.png — harus PNG 1600x1600 yang lengkap dan utuh.
//   2. POST.json — harus berisi URL postingan X yang valid.
// Kalau ada satu saja pemeriksaan yang gagal, program berhenti dengan
// satu baris pesan error dan exit code 1. Kalau semuanya lolos, POST.json
// disalin ke folder output dan program keluar dengan exit code 0.
//
// Hanya memakai stdlib Node (node:fs dan node:path). Node 22+.

import fs from "node:fs";
import path from "node:path";

const NAME = "gta6-meme-x-01 v6";
const BOT_DIR = process.env.MAKEFUN_BOT_DIR || "/bot";
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || "/output";

const MAX_PNG_BYTES = 10 * 1024 * 1024;
const EXPECTED_WIDTH = 1600;
const EXPECTED_HEIGHT = 1600;

// Delapan byte pembuka setiap file PNG.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
// Dua belas byte penutup setiap file PNG yang lengkap:
// panjang 0, nama chunk "IEND", dan CRC IEND.
const PNG_TRAILER = Buffer.from([
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

// https://x.com/<akun>/status/<angka> atau https://twitter.com/<akun>/status/<angka>
const POST_URL_PATTERN = /^https:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/[0-9]+$/;

// Satu-satunya jalan keluar saat gagal: satu baris ke stderr, lalu exit 1.
function fail(reason) {
  const oneLine = String(reason).replace(/\s*\n\s*/g, " ").trim();
  console.error(`${NAME}: ${oneLine}`);
  process.exit(1);
}

function main() {
  const memePath = path.join(BOT_DIR, "meme.png");
  const postPath = path.join(BOT_DIR, "POST.json");

  // ---- meme.png -------------------------------------------------------
  let meme;
  try {
    meme = fs.readFileSync(memePath);
  } catch {
    fail(`meme.png tidak ditemukan atau tidak bisa dibaca di ${memePath}`);
  }

  if (meme.length === 0) {
    fail("meme.png kosong");
  }
  if (meme.length > MAX_PNG_BYTES) {
    fail(`meme.png terlalu besar (${meme.length} byte, batas 10 MB)`);
  }
  if (meme.length < 24) {
    fail("meme.png terlalu pendek untuk menjadi PNG yang valid");
  }
  if (!meme.subarray(0, 8).equals(PNG_MAGIC)) {
    fail("meme.png bukan file PNG (8 byte awal tidak cocok dengan magic PNG)");
  }
  if (meme.subarray(12, 16).toString("ascii") !== "IHDR") {
    fail("meme.png tidak punya chunk IHDR");
  }
  if (meme.readUInt32BE(8) !== 13) {
    fail("meme.png punya chunk IHDR dengan panjang yang salah (harus 13 byte)");
  }

  const width = meme.readUInt32BE(16);
  const height = meme.readUInt32BE(20);
  if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
    fail(`meme.png berukuran ${width}x${height}, harus 1600x1600`);
  }

  if (meme.length < 12 || !meme.subarray(meme.length - 12).equals(PNG_TRAILER)) {
    fail("meme.png tidak lengkap (12 byte terakhir bukan trailer IEND PNG)");
  }

  // ---- POST.json ------------------------------------------------------
  let postText;
  try {
    postText = fs.readFileSync(postPath, "utf8");
  } catch {
    fail(`POST.json tidak ditemukan atau tidak bisa dibaca di ${postPath}`);
  }

  let post;
  try {
    post = JSON.parse(postText);
  } catch {
    fail("POST.json bukan JSON yang valid");
  }
  if (post === null || typeof post !== "object" || Array.isArray(post)) {
    fail("POST.json harus berupa object JSON");
  }
  if (typeof post.url !== "string" || !POST_URL_PATTERN.test(post.url)) {
    fail("POST.json tidak berisi field url postingan X yang valid");
  }
  const url = post.url;

  // ---- Semua lolos: salin bukti postingan ke folder output ------------
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.copyFileSync(postPath, path.join(OUT_DIR, "POST.json"));
  } catch (error) {
    fail(`gagal menyiapkan folder output ${OUT_DIR}: ${error.message}`);
  }

  console.log(`${NAME}: OK — meme.png 1600x1600, post ${url}`);
  process.exit(0);
}

try {
  main();
} catch (error) {
  fail(error && error.message ? error.message : "error tidak terduga");
}
