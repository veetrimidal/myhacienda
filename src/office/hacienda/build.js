// The Hacienda's building: terracotta tile floors, whitewashed stucco walls under a clay-tile cap, painted Talavera
// tiles, arched doorways, a patio down the middle of the wing with a tiled fountain, bougainvillea and string lights.
// The company floor and the wing call these when HACIENDA is set (world/pro/floor.js, world/pro/wing.js).
import * as THREE from 'three';
import { rand } from '../core/env.js';
import { scene } from '../scene/renderer.js';
import { canvasTex, cyl, lampBulbs, mat, put, rbox, toonMat } from '../scene/blocks.js';
import { BULB_OFF } from '../world/terrace.js';

export const CLAY = '#B9583A', CLAY_D = '#8F3F27', STUCCO = '#F3EBDD', ADOBE = '#E7D3B3', FOREST = '#0D3B2A';
export const LIME = '#D4F53C', ORANGE = '#F26522';

/* ---------- textures (drawn once each) ---------- */
const cache = new Map();
const once = (k, f) => (cache.has(k) ? cache.get(k) : (cache.set(k, f()), cache.get(k)));

/** saltillo terracotta: square tiles, each its own fired shade, cream grout. `hue` shifts the clay (0 = classic) */
export function terracottaTex(n = 4, hue = 0) {
  return once(`tc${n}:${hue}`, () => canvasTex(512, 512, (g, w) => {
    const s = w / n;
    g.fillStyle = '#E2CDAA'; g.fillRect(0, 0, w, w);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const l = rand(38, 50), sat = rand(48, 60), hh = 16 + hue + rand(-3, 3);
      const grd = g.createLinearGradient(i * s, j * s, (i + 1) * s, (j + 1) * s);
      grd.addColorStop(0, `hsl(${hh}, ${sat}%, ${l + 4}%)`); grd.addColorStop(1, `hsl(${hh - 2}, ${sat}%, ${l - 3}%)`);
      g.fillStyle = grd; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '60,25,10' : '255,220,190'},${rand(0.04, 0.12)})`; g.fillRect(i * s + rand(6, s - 10), j * s + rand(6, s - 10), rand(2, 7), rand(2, 5)); }
    }
  }));
}
/** whitewashed stucco: a warm white, trowel marks */
export function stuccoTex(base = STUCCO) {
  return once(`st:${base}`, () => canvasTex(256, 256, (g, w) => {
    g.fillStyle = base; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '120,90,60' : '255,255,255'},${rand(0.03, 0.08)})`; g.beginPath(); g.ellipse(rand(0, w), rand(0, w), rand(4, 18), rand(2, 8), rand(0, Math.PI), 0, Math.PI * 2); g.fill(); }
  }));
}
/** painted Talavera tiles: cream ground, a four-petal motif in the brand's lime, orange and forest */
export function talaveraTex(n = 4) {
  return once(`tv${n}`, () => canvasTex(512, 512, (g, w) => {
    const s = w / n;
    g.fillStyle = '#D8CCB4'; g.fillRect(0, 0, w, w);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = i * s, y = j * s, c = x + s / 2, d = y + s / 2;
      g.fillStyle = '#F6F0E2'; g.fillRect(x + 2, y + 2, s - 4, s - 4);
      g.fillStyle = FOREST; for (const [a, b] of [[0, 0], [s, 0], [0, s], [s, s]]) { g.beginPath(); g.arc(x + a, y + b, s * 0.16, 0, Math.PI * 2); g.fill(); }
      for (let k = 0; k < 4; k++) {
        const ang = (k * Math.PI) / 2;
        g.save(); g.translate(c, d); g.rotate(ang);
        g.fillStyle = k % 2 ? ORANGE : '#3E7A55'; g.beginPath(); g.ellipse(0, -s * 0.2, s * 0.1, s * 0.18, 0, 0, Math.PI * 2); g.fill();
        g.restore();
      }
      g.fillStyle = LIME; g.beginPath(); g.arc(c, d, s * 0.08, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(13,59,42,.55)'; g.lineWidth = 3; g.strokeRect(x + 8, y + 8, s - 16, s - 16);
    }
  }));
}
/** a woven petate rug for under the pods: natural fibre with lime and orange bands */
export function weaveTex(band = LIME) {
  return once(`wv:${band}`, () => canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#CDB58A'; g.fillRect(0, 0, w, w);
    for (let y = 0; y < w; y += 4) for (let x = 0; x < w; x += 8) { g.fillStyle = (x / 8 + y / 4) % 2 ? 'rgba(120,85,40,.18)' : 'rgba(255,240,200,.16)'; g.fillRect(x, y, 8, 4); }
    for (const [y0, c] of [[14, FOREST], [26, band], [w - 34, band], [w - 22, FOREST]]) { g.fillStyle = c; g.fillRect(0, y0, w, 8); }
  }));
}
export const stuccoMat = () => once('stuccoM', () => toonMat({ map: stuccoTex(), roughness: 0.95 }));
export const clayMat = () => once('clayM', () => mat(CLAY, { roughness: 0.8 }));

/* ---------- pieces ---------- */
/** a clay roof-tile cap along the top of a wall (the barrel tiles the camera sees from above) */
export function tileCap(cx, y, cz, len, alongX, parent = scene) {
  const g = new THREE.Group(); g.position.set(cx, y, cz); if (!alongX) g.rotation.y = Math.PI / 2; parent.add(g);
  put(g, rbox(len + 0.1, 0.08, 0.5, CLAY_D, 0.02), 0, 0, 0);
  const n = Math.max(2, Math.round(len / 0.22)), geo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 10, 1, false, 0, Math.PI);
  const m = clayMat();
  for (let i = 0; i < n; i++) {
    const t = new THREE.Mesh(geo, i % 2 ? m : mat(i % 3 ? '#C2643F' : '#A84B30', { roughness: 0.8 }));
    t.rotation.set(Math.PI / 2, 0, Math.PI / 2); t.position.set(-len / 2 + (i + 0.5) * (len / n), 0.04, 0); t.castShadow = true; g.add(t);
  }
  return g;
}
/** an arch frame: a stucco wall `w` wide and `h` tall with an arched opening (iw wide, springing at sh) */
export function archFrame(x, z, ry, w = 1.6, h = 2.9, iw = 1.1, sh = 2.0, depth = 0.3, parent = scene) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(-iw / 2, 0); s.lineTo(-iw / 2, sh); s.absarc(0, sh, iw / 2, Math.PI, 0, true); s.lineTo(iw / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 18 });
  geo.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(geo, stuccoMat()); m.castShadow = m.receiveShadow = true;
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g); g.add(m);
  // a terracotta band round the opening and a clay cap on top
  const band = new THREE.Shape(); band.absarc(0, sh, iw / 2 + 0.08, Math.PI, 0, true); band.lineTo(iw / 2, sh); band.absarc(0, sh, iw / 2, 0, Math.PI, false); band.closePath();
  for (const sz of [-1, 1]) { const b = new THREE.Mesh(new THREE.ShapeGeometry(band, 18), mat(CLAY, { roughness: 0.8, side: THREE.DoubleSide })); b.position.z = sz * (depth / 2 + 0.025); g.add(b); }
  tileCap(0, h + 0.04, 0, w, true, g);
  return g;
}
/** a row of arches (an arcade) from a to b along x or z, `n` openings */
export function arcade(ax, az, bx, bz, n, h = 2.9) {
  const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bz - az, bx - ax), w = len / n;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    archFrame(ax + (bx - ax) * t, az + (bz - az) * t, -ang, w + 0.01, h, w * 0.72, h * 0.62, 0.32);
  }
}
/** a two-tier tiled fountain, its water catching the light */
export const fountains = [];
export function fountain(x, z, r = 0.7) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const tile = talaveraTex(4).clone(); tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(6, 1); tile.needsUpdate = true;
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.04, 0.42, 36, 1, true), toonMat({ map: tile, roughness: 0.5, side: THREE.DoubleSide }));
  basin.position.y = 0.21; basin.castShadow = true; g.add(basin);
  put(g, new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 8, 40), clayMat()), 0, 0.43, 0).rotation.x = Math.PI / 2;
  const water = new THREE.MeshStandardMaterial({ color: '#5FB3C9', emissive: '#1F6F86', emissiveIntensity: 0.35, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.9 });
  put(g, new THREE.Mesh(new THREE.CircleGeometry(r * 0.96, 36).rotateX(-Math.PI / 2), water), 0, 0.36, 0);
  put(g, cyl(0.09, 0.13, 0.7, stuccoMat(), 14), 0, 0.6, 0);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(r * 0.42, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), clayMat()); bowl.position.y = 1.02; g.add(bowl);
  put(g, new THREE.Mesh(new THREE.CircleGeometry(r * 0.4, 24).rotateX(-Math.PI / 2), water), 0, 1.0, 0);
  put(g, cyl(0.035, 0.05, 0.28, mat(ADOBE), 10), 0, 1.14, 0);
  // the falling water: four thin arcs from the top bowl to the basin
  const fall = new THREE.MeshStandardMaterial({ color: '#BFE6F0', transparent: true, opacity: 0.55, emissive: '#7FC7DA', emissiveIntensity: 0.3, depthWrite: false });
  const drops = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4, c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(Math.cos(a) * r * 0.4, 1.0, Math.sin(a) * r * 0.4), new THREE.Vector3(Math.cos(a) * r * 0.62, 0.95, Math.sin(a) * r * 0.62), new THREE.Vector3(Math.cos(a) * r * 0.72, 0.38, Math.sin(a) * r * 0.72));
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, 12, 0.018, 6), fall); g.add(m); drops.push(m);
  }
  fountains.push({ g, drops, fall });
  return g;
}
/** bougainvillea in a clay pot: magenta and orange blossoms over dark leaves */
export function bougainvillea(x, z, s = 1, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); g.rotation.y = ry; scene.add(g);
  put(g, cyl(0.26, 0.19, 0.42, clayMat(), 18), 0, 0.21, 0);
  put(g, new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.035, 6, 20), mat(CLAY_D)), 0, 0.42, 0).rotation.x = Math.PI / 2;
  const leaf = mat('#2E5A2B', { roughness: 0.8 }), blooms = [mat('#D6337A', { roughness: 0.7 }), mat('#F05A9A', { roughness: 0.7 }), mat(ORANGE, { roughness: 0.7 })];
  const geo = new THREE.IcosahedronGeometry(0.2, 1);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, m = new THREE.Mesh(geo, i % 3 ? blooms[i % 3] : leaf); m.position.set(Math.sin(a) * rand(0.08, 0.26), 0.62 + rand(0, 0.55), Math.cos(a) * rand(0.08, 0.26)); m.scale.setScalar(rand(0.7, 1.15)); m.castShadow = true; g.add(m); }
  return g;
}
/** a string of warm bulbs between posts or walls, sagging a little (lit at night with the other lamps) */
export function stringLights(pts, y = 2.7, sag = 0.25) {
  const wire = mat('#2B2B2B'), bulbGeo = new THREE.SphereGeometry(0.045, 8, 6);
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], n = Math.max(4, Math.round(Math.hypot(bx - ax, bz - az) / 0.45));
    const p = [];
    for (let i = 0; i <= n; i++) { const t = i / n; p.push(new THREE.Vector3(ax + (bx - ax) * t, y - Math.sin(t * Math.PI) * sag, az + (bz - az) * t)); }
    put(scene, new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), n * 2, 0.008, 4), wire), 0, 0, 0);
    for (let i = 1; i < n; i++) { const m = new THREE.MeshBasicMaterial({ color: BULB_OFF.clone() }); lampBulbs.push(m); put(scene, new THREE.Mesh(bulbGeo, m), p[i].x, p[i].y - 0.05, p[i].z); }
  }
}
/** a wooden sign with painted letters (the entrance, the patio) */
export function woodSign(x, y, z, ry, title, sub, w = 2.4) {
  const tex = canvasTex(1024, 300, (g, cw, ch) => {
    g.fillStyle = '#5B3A24'; g.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(30,15,5,${rand(0.05, 0.15)})`; g.fillRect(0, rand(0, ch), cw, rand(1, 3)); }
    g.strokeStyle = LIME; g.lineWidth = 10; g.strokeRect(14, 14, cw - 28, ch - 28);
    g.fillStyle = '#F8F8F2'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '800 118px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText(title, cw / 2, sub ? ch * 0.42 : ch / 2);
    if (sub) { g.fillStyle = LIME; g.font = '700 50px "Be Vietnam Pro", system-ui, sans-serif'; g.fillText(sub, cw / 2, ch * 0.78); }
  });
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
  put(g, rbox(w + 0.12, w * 0.3 + 0.12, 0.08, '#3E2716', 0.02), 0, 0, -0.03);
  put(g, new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.293), new THREE.MeshBasicMaterial({ map: tex })), 0, 0, 0.015);
  return g;
}
/** the fountains' water shimmers (core/loop.js calls this each frame) */
export function tickHacienda(t) {
  for (const f of fountains) f.fall.opacity = 0.45 + Math.sin(t * 6) * 0.12;
}
