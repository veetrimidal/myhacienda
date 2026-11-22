#!/usr/bin/env node
// Builds the Hacienda: Krafted Lab's 3D office for the bot team (src/office/hacienda/), as a static site ready to
// publish to its claude.ai artifact. English only; the bots' check-ins come from the artifact's database.
//
//   node scripts/build-hacienda.mjs        # output: hacienda-site/
//
// The artifact host reserves paths starting with "_", so Next's assets go under /hc (assetPrefix) and the files Next
// only needs for client-side navigation between pages (__next.*.txt, _not-found/) are left out.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'hacienda-site'), WORK = path.join(ROOT, '.demo-build', 'src'), OUT = 'out-hacienda';
const SOURCES = ['app', 'src', 'public', 'package.json', 'package-lock.json', 'next.config.mjs', 'tsconfig.json', 'next-env.d.ts'];

fs.rmSync(SITE, { recursive: true, force: true });
fs.rmSync(path.dirname(WORK), { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });
for (const s of SOURCES) if (fs.existsSync(path.join(ROOT, s))) fs.cpSync(path.join(ROOT, s), path.join(WORK, s), { recursive: true });
fs.symlinkSync(path.relative(WORK, path.join(ROOT, 'node_modules')), path.join(WORK, 'node_modules'));

execFileSync(process.execPath, [path.join(WORK, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'], {
  cwd: WORK, stdio: 'inherit',
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', OFFICE_STATIC: '1', OFFICE_STATIC_LANG: 'en', OFFICE_HACIENDA: '1', OFFICE_ASSET_PREFIX: '/hc', OFFICE_DIST_DIR: OUT, OFFICE_TURBO_ROOT: ROOT },
});
fs.cpSync(path.join(WORK, OUT), SITE, { recursive: true });
fs.mkdirSync(path.join(SITE, 'hc'), { recursive: true });
fs.renameSync(path.join(SITE, '_next'), path.join(SITE, 'hc', '_next'));
// nothing else may start with "_": drop the navigation payloads, the 404 copies and the city's shop logos (the
// Hacienda stands in the countryside), and the share images that still show My Office
const drop = (p) => fs.rmSync(path.join(SITE, p), { recursive: true, force: true });
for (const d of ['_not-found', '404', 'assets/brands', 'assets/vehicles/README.md', 'opengraph-image.jpg', 'twitter-image.jpg']) drop(d);
for (const dir of ['.', 'panel']) for (const f of fs.readdirSync(path.join(SITE, dir))) if (f.startsWith('__next.')) drop(path.join(dir, f));
const media = path.join(SITE, 'hc', '_next', 'static', 'media');
for (const f of fs.readdirSync(media)) if (/^(opengraph|twitter)-image/.test(f)) fs.rmSync(path.join(media, f));
// the tab icon: the Hacienda's arch
const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#1C1F18"/><path fill="#F26522" fill-rule="evenodd" d="M5 20V11a7 7 0 0 1 14 0v9zM9.5 20v-6a2.5 2.5 0 0 1 5 0v6z"/></svg>';
fs.writeFileSync(path.join(SITE, 'icon.svg'), ICON);
for (const f of fs.readdirSync(media)) if (/^icon\..*\.svg$/.test(f)) fs.writeFileSync(path.join(media, f), ICON);
// the artifact serves the site from a versioned folder (/_f/<version>/), not the domain's root: every path the pages
// and scripts ask for becomes relative to the page
const ABS = /(["'`(\s])\/(hc\/_next\/|assets\/|icon\.svg|icon-512\.png|apple-icon\.png|favicon\.ico|manifest\.webmanifest|sw\.js)/g;
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
for (const f of walk(SITE)) {
  if (!/\.(html|txt|js|css|webmanifest|json)$/.test(f) || f.endsWith('cars.json')) continue;
  const was = fs.readFileSync(f, 'utf8'), now = was.replace(ABS, '$1./$2');
  if (now !== was) fs.writeFileSync(f, now);
}
console.log(`\nThe Hacienda in ${path.relative(process.cwd(), SITE) || '.'}/`);
