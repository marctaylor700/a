/**
 * Eyeshine wildlife — ally lemurs + a stalking fossa. Greet, never hunt.
 */
import * as THREE from 'three';
import { PALETTE, PATHS, FOSSA, CENSUS_TARGET } from './config.js';

const PREFERRED = [
  'Ring-tailed Lemur',
  'Aye-aye',
  'Indri',
  "Verreaux's Sifaka",
  'Red Ruffed Lemur',
  'Mouse Lemur',
  'Golden Bamboo Lemur',
  'Diademed Sifaka',
  'Black-and-white Ruffed Lemur',
  'Blue-eyed Black Lemur',
  'Fork-marked Lemur',
  'Silky Sifaka',
];

function styleOf(name) {
  const n = name.toLowerCase();
  if (n.includes('ring-tailed')) return { fur: 0xc9b089, accent: 0xf2ead8, dark: 0x1a1410, stripe: true, scale: 0.92, ears: 1, tail: 1.15 };
  if (n.includes('aye-aye')) return { fur: 0x2c261c, accent: 0x4a4030, dark: 0x0e0c0a, stripe: false, scale: 0.82, ears: 1.7, tail: 1 };
  if (n.includes('indri')) return { fur: 0x1c1c1c, accent: 0xf0ece4, dark: 0x0a0a0a, stripe: false, scale: 1.2, ears: 0.7, tail: 0.22 };
  if (n.includes('silky')) return { fur: 0xf4f2ee, accent: 0xe8dcc8, dark: 0x2a2118, stripe: false, scale: 1.1, ears: 0.8, tail: 0.65 };
  if (n.includes('sifaka')) return { fur: 0xf0ebe2, accent: 0xc44a2a, dark: 0x2a2118, stripe: false, scale: 1.12, ears: 0.85, tail: 0.7 };
  if (n.includes('red ruffed')) return { fur: 0xa8321e, accent: 0x1a1210, dark: 0x140c0a, stripe: false, scale: 1.05, ears: 1.15, tail: 1 };
  if (n.includes('ruffed')) return { fur: 0xf0f0ec, accent: 0x161616, dark: 0x111, stripe: false, scale: 1.05, ears: 1.15, tail: 1 };
  if (n.includes('mouse') || n.includes('dwarf') || n.includes('pygmy')) {
    return { fur: 0x8a6238, accent: 0xc4a070, dark: 0x3a2818, stripe: false, scale: 0.42, ears: 1.2, tail: 0.85 };
  }
  if (n.includes('bamboo') || n.includes('gentle')) return { fur: 0x6a7a48, accent: 0xb8a070, dark: 0x2a3020, stripe: false, scale: 0.78, ears: 0.9, tail: 0.75 };
  if (n.includes('blue-eyed') || n.includes('black lemur')) return { fur: 0x161616, accent: 0x3a2a20, dark: 0x080808, stripe: false, scale: 0.9, ears: 1.05, tail: 0.95 };
  if (n.includes('fork')) return { fur: 0xc8b070, accent: 0x2a2010, dark: 0x1a140c, stripe: false, scale: 0.62, ears: 1.1, tail: 1.05 };
  return { fur: 0x8a6848, accent: 0xd4b890, dark: 0x2a2018, stripe: false, scale: 0.88, ears: 1, tail: 0.95 };
}

function pickSpecies(list) {
  const byName = new Map();
  for (const s of list) byName.set(s.common_name, s);
  const out = [];
  for (const n of PREFERRED) {
    if (byName.has(n)) out.push(byName.get(n));
  }
  for (const s of list) {
    if (out.length >= 11) break;
    if (!out.includes(s)) out.push(s);
  }
  return out.slice(0, 11);
}

function circleAlpha() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 18, 32, 32, 32);
  g.addColorStop(0, '#fff');
  g.addColorStop(1, '#000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

function makeLemur(style) {
  const g = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: style.fur, roughness: 0.88, metalness: 0.02 });
  const acc = new THREE.MeshStandardMaterial({ color: style.accent, roughness: 0.86 });
  const dark = new THREE.MeshStandardMaterial({ color: style.dark, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), fur);
  body.scale.set(0.95, 1.05, 1.35);
  body.position.y = 0.34;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), fur);
  head.position.set(0, 0.58, 0.26);
  g.add(head);
  const muz = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), acc);
  muz.position.set(0, 0.54, 0.38);
  muz.scale.set(1, 0.7, 1.1);
  g.add(muz);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), fur);
    ear.scale.set(0.7, 1.15 * style.ears, 0.45);
    ear.position.set(side * 0.12, 0.72, 0.22);
    g.add(ear);
  }
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1008,
    emissive: PALETTE.eyeshine,
    emissiveIntensity: 3.8,
    roughness: 0.22,
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(2.5, 1.65, 0.32),
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), eyeMat);
    eye.position.set(side * 0.065, 0.6, 0.38);
    g.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), glowMat);
    glint.position.copy(eye.position);
    g.add(glint);
  }
  const tail = new THREE.Group();
  tail.position.set(0, 0.38, -0.32);
  const segs = style.stripe ? 10 : 7;
  for (let i = 0; i < segs; i++) {
    const mat = style.stripe ? (i % 2 === 0 ? dark : acc) : (i > segs - 3 ? acc : fur);
    const sph = new THREE.Mesh(new THREE.SphereGeometry(0.055 - i * 0.003, 8, 6), mat);
    const u = i / segs;
    sph.position.set(0, Math.sin(u * 1.4) * 0.22 * style.tail, -i * 0.085 * style.tail);
    tail.add(sph);
  }
  g.add(tail);
  g.userData.tail = tail;
  g.userData.head = head;
  for (const [sx, sz] of [[-1, 0.12], [1, 0.12], [-1, -0.14], [1, -0.14]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.22, 6), dark);
    leg.position.set(sx * 0.1, 0.12, sz);
    g.add(leg);
  }
  g.scale.setScalar(style.scale);
  return g;
}

function makeFossa() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: PALETTE.fossa, roughness: 0.82 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a2018, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), mat);
  body.scale.set(0.7, 0.52, 1.9);
  body.position.y = 0.28;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat);
  head.position.set(0, 0.32, 0.54);
  head.scale.set(0.85, 0.68, 1.18);
  g.add(head);
  const eyeM = new THREE.MeshStandardMaterial({
    color: 0x200800,
    emissive: PALETTE.laterite,
    emissiveIntensity: 4.4,
    roughness: 0.25,
  });
  const glow = new THREE.MeshBasicMaterial({
    color: new THREE.Color(2.2, 0.45, 0.12),
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeM);
    e.position.set(s * 0.055, 0.35, 0.66);
    g.add(e);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), glow);
    gl.position.copy(e.position);
    g.add(gl);
  }
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.07 - i * 0.007, 8, 6), mat);
    t.position.set(0, 0.26 + i * 0.02, -0.55 - i * 0.12);
    g.add(t);
  }
  for (const [sx, sz] of [[-1, 0.3], [1, 0.3], [-1, -0.34], [1, -0.34]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.26, 6), dark);
    leg.position.set(sx * 0.12, 0.12, sz);
    g.add(leg);
  }
  return g;
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export function createWildlife(scene, world, species, audio) {
  const list = pickSpecies(Array.isArray(species) ? species : []);
  const alpha = circleAlpha();
  const lemurs = [];
  const loggedNames = [];
  const group = new THREE.Group();
  scene.add(group);

  const used = [];
  const staged = [
    { x: 1.35, z: 4.15 },
    { x: -1.7, z: 2.6 },
    { x: 3.4, z: 1.1 },
  ];
  function place() {
    if (used.length < staged.length) {
      const s = staged[used.length];
      used.push(s);
      return s;
    }
    for (let k = 0; k < 40; k++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 14 + Math.random() * 36;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      if (used.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < 64)) continue;
      used.push({ x, z });
      return { x, z };
    }
    return { x: 20 + used.length * 3, z: -18 };
  }

  for (const sp of list) {
    const st = styleOf(sp.common_name);
    const mesh = makeLemur(st);
    const p = place();
    const near = Math.hypot(p.x, p.z) < 14;
    const perch = near ? 0 : (Math.random() < 0.55 ? 1.15 + Math.random() * 1.5 : 0);
    const gy = world.getHeight(p.x, p.z) + perch;
    mesh.position.set(p.x, gy, p.z);
    mesh.rotation.y = near ? Math.atan2(-p.x, -(8.4 - p.z)) : Math.random() * Math.PI * 2;
    group.add(mesh);
    const rec = {
      mesh,
      name: sp.common_name,
      sci: sp.scientific_name || '',
      status: sp.conservation_status || '',
      desc: sp.description || '',
      x: p.x,
      z: p.z,
      baseY: gy,
      yaw: mesh.rotation.y,
      phase: Math.random() * 6.28,
    };
    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 8),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(2.6, 1.7, 0.28),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    shine.position.set(0, 0.6, 0.42);
    mesh.add(shine);
    rec.shine = shine;
    lemurs.push(rec);
    const img = sp.image || sp.image_filename;
    if (img) {
      new THREE.TextureLoader().load(
        PATHS.images + img,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const decal = new THREE.Mesh(
            new THREE.CircleGeometry(0.09, 16),
            new THREE.MeshBasicMaterial({ map: tex, alphaMap: alpha, transparent: true, depthWrite: false }),
          );
          decal.position.set(0, 0.58, 0.41);
          mesh.add(decal);
        },
        undefined,
        () => {},
      );
    }
  }

  const fossa = makeFossa();
  const fossaHome = { x: 32, z: -24 };
  fossa.position.set(fossaHome.x, world.getHeight(fossaHome.x, fossaHome.z), fossaHome.z);
  group.add(fossa);

  let chasing = false;
  let fossaDist = 40;
  let focusName = '';
  let growlT = 0;
  let wander = { x: 24, z: -10 };
  let wanderT = 0;
  let time = 0;

  function reset() {
    loggedNames.length = 0;
    chasing = false;
    growlT = 0;
    fossa.position.set(fossaHome.x, world.getHeight(fossaHome.x, fossaHome.z), fossaHome.z);
  }

  function update(dt, playerPos, sprinting) {
    time += dt;
    focusName = '';
    let best = 99;
    for (let i = 0; i < lemurs.length; i++) {
      const L = lemurs[i];
      L.mesh.position.y = L.baseY + Math.sin(time * 1.35 + L.phase) * 0.03;
      const dx = playerPos.x - L.x;
      const dz = playerPos.z - L.z;
      const d = Math.hypot(dx, dz);
      if (d < 9) L.yaw = lerpAngle(L.yaw, Math.atan2(dx, -dz), dt * 1.6);
      else L.yaw += Math.sin(time * 0.35 + L.phase) * dt * 0.15;
      L.mesh.rotation.y = L.yaw;
      if (L.mesh.userData.tail) {
        L.mesh.userData.tail.rotation.x = Math.sin(time * 1.5 + L.phase) * 0.14;
      }
      if (L.shine) {
        const logged = loggedNames.includes(L.name);
        L.shine.material.opacity = logged ? 0.18 : 0.55 + Math.sin(time * 2.4 + L.phase) * 0.3;
        const s = logged ? 0.55 : 0.9 + Math.sin(time * 1.8 + L.phase) * 0.25;
        L.shine.scale.setScalar(s);
      }
      if (!loggedNames.includes(L.name) && d < best && d < 3.15) {
        best = d;
        focusName = L.name;
      }
    }

    const px = playerPos.x;
    const pz = playerPos.z;
    fossaDist = Math.hypot(fossa.position.x - px, fossa.position.z - pz);
    let detect = FOSSA.detectRadius;
    if (sprinting) detect *= 1.38;
    if (fossaDist < detect) {
      if (!chasing && audio && audio.growl) audio.growl();
      chasing = true;
    } else if (fossaDist > FOSSA.loseInterest) {
      chasing = false;
    }

    let tx;
    let tz;
    if (chasing) {
      tx = px;
      tz = pz;
      growlT -= dt;
      if (growlT <= 0) {
        if (audio && audio.growl) audio.growl();
        growlT = 3.6 + Math.random() * 1.4;
      }
    } else {
      wanderT -= dt;
      if (wanderT <= 0) {
        wander.x = fossaHome.x + (Math.random() - 0.5) * 36;
        wander.z = fossaHome.z + (Math.random() - 0.5) * 36;
        wanderT = 4 + Math.random() * 4;
      }
      tx = wander.x;
      tz = wander.z;
    }
    const dx = tx - fossa.position.x;
    const dz = tz - fossa.position.z;
    const d = Math.hypot(dx, dz);
    const spd = chasing ? FOSSA.chaseSpeed : FOSSA.walkSpeed;
    if (d > 0.08) {
      fossa.position.x += (dx / d) * spd * dt;
      fossa.position.z += (dz / d) * spd * dt;
      fossa.rotation.y = Math.atan2(dx, -dz);
    }
    const fy = world.getHeight(fossa.position.x, fossa.position.z);
    fossa.position.y = fy + Math.abs(Math.sin(time * (chasing ? 11 : 4.2))) * 0.045;
    fossaDist = Math.hypot(fossa.position.x - px, fossa.position.z - pz);
  }

  function tryGreet(playerPos, lookDir) {
    if (loggedNames.length >= CENSUS_TARGET) return null;
    let best = null;
    let bestDot = 0.55;
    for (let i = 0; i < lemurs.length; i++) {
      const L = lemurs[i];
      if (loggedNames.includes(L.name)) continue;
      const dx = L.mesh.position.x - playerPos.x;
      const dy = L.mesh.position.y + 0.4 - playerPos.y;
      const dz = L.mesh.position.z - playerPos.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > 3.15 || dist < 1e-4) continue;
      const inv = 1 / dist;
      const dot = lookDir.x * dx * inv + lookDir.y * dy * inv + lookDir.z * dz * inv;
      if (dot > bestDot) {
        bestDot = dot;
        best = L;
      }
    }
    if (!best) return null;
    loggedNames.push(best.name);
    if (audio && audio.greet) audio.greet();
    return {
      name: best.name,
      scientific_name: best.sci,
      conservation_status: best.status,
      description: best.desc,
    };
  }

  return {
    update,
    tryGreet,
    reset,
    get fossaDist() { return fossaDist; },
    get logged() { return loggedNames.length; },
    loggedNames,
    get chasing() { return chasing; },
    get focusName() { return focusName; },
  };
}
