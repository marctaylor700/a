/**
 * Eyeshine forest — wet laterite, moonlit canopy, stream, fireflies.
 */
import * as THREE from 'three';
import { WORLD, PALETTE, PATHS } from './config.js';

const CLEARING = 9;

function hash(ix, iz) {
  let n = Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function fade(t) { return t * t * (3 - 2 * t); }

function valueNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = fade(x - ix);
  const fz = fade(z - iz);
  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

function fbm(x, z) {
  let v = 0;
  let a = 0.55;
  let f = 1;
  let s = 0;
  for (let i = 0; i < 4; i++) {
    v += valueNoise(x * f, z * f) * a;
    s += a;
    a *= 0.5;
    f *= 2.07;
  }
  return v / s;
}

function streamX(z) {
  return Math.sin(z * 0.042) * 16 + Math.sin(z * 0.11 + 0.7) * 5.5;
}

function streamDist(x, z) {
  return Math.abs(x - streamX(z));
}

function heightAt(x, z) {
  const n = fbm(x * 0.017, z * 0.017);
  const n2 = fbm(x * 0.05 + 20, z * 0.05 + 8);
  let h = (n * 2 - 0.92) * WORLD.hillAmp + (n2 - 0.5) * WORLD.hillAmp * 0.28;
  const r = Math.hypot(x, z);
  const valley = Math.max(0, 1 - streamDist(x, z) / 5.2);
  if (r > 28) h -= valley * valley * 1.8;
  if (r < 30) {
    const t = 1 - r / 30;
    h = h * (1 - t * t * 0.97) + 0.16 * t;
  }
  return h;
}

function prep(tex, renderer, rx, ry) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(rx, ry);
  const aniso = renderer?.capabilities?.getMaxAnisotropy?.() || 1;
  tex.anisotropy = Math.min(8, aniso);
  tex.needsUpdate = true;
  return tex;
}

function canvasTex(renderer, rx, ry, draw, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  return prep(new THREE.CanvasTexture(c), renderer, rx, ry);
}

function loadTex(url, renderer, rx, ry, fallback) {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      url,
      (t) => resolve(prep(t, renderer, rx, ry)),
      undefined,
      () => resolve(fallback()),
    );
  });
}

function fallbackGround(renderer) {
  return canvasTex(renderer, 18, 18, (ctx, s) => {
    ctx.fillStyle = '#7a3a28';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1100; i++) {
      ctx.globalAlpha = 0.25 + Math.random() * 0.4;
      ctx.fillStyle = i % 4 ? '#5a3a28' : '#3a5a32';
      ctx.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 10, 1 + Math.random() * 5);
    }
  });
}

function fallbackBark(renderer) {
  return canvasTex(renderer, 1, 3, (ctx, s) => {
    ctx.fillStyle = '#4a3428';
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 6) {
      ctx.strokeStyle = `rgba(20,12,8,${0.25 + Math.random() * 0.35})`;
      ctx.beginPath();
      ctx.moveTo(x + Math.random() * 4, 0);
      ctx.lineTo(x + Math.random() * 4, s);
      ctx.stroke();
    }
  });
}

function fallbackLeaves(renderer) {
  return canvasTex(renderer, 2, 2, (ctx, s) => {
    ctx.fillStyle = '#2d4424';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = i % 2 ? '#6a8a4a' : '#3d5a32';
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 6, 3, Math.random() * 4, 0, 7);
      ctx.fill();
    }
  });
}

function fallbackRock(renderer) {
  return canvasTex(renderer, 2, 2, (ctx, s) => {
    ctx.fillStyle = '#4a463e';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = i % 2 ? '#2e2c28' : '#6a665c';
      ctx.globalAlpha = 0.35;
      ctx.fillRect(Math.random() * s, Math.random() * s, 3, 3);
    }
  });
}

function fallbackRipple(renderer) {
  return canvasTex(renderer, 3, 16, (ctx, s) => {
    ctx.fillStyle = '#143038';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(180,220,230,0.28)';
    for (let y = 4; y < s; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= s; x += 8) ctx.lineTo(x, y + Math.sin((x + y) * 0.2) * 3);
      ctx.stroke();
    }
  }, 128);
}

export async function createWorld(scene, renderer) {
  const group = new THREE.Group();
  scene.add(group);
  scene.background = new THREE.Color(PALETTE.nightDeep);
  scene.fog = new THREE.FogExp2(WORLD.fogColor, 0.011);

  const tpath = PATHS.textures;
  const [groundMap, barkMap, leafMap, rockMap] = await Promise.all([
    loadTex(`${tpath}ground.jpg`, renderer, 22, 22, () => fallbackGround(renderer)),
    loadTex(`${tpath}bark.jpg`, renderer, 1.2, 3.4, () => fallbackBark(renderer)),
    loadTex(`${tpath}leaves.jpg`, renderer, 2.2, 2.2, () => fallbackLeaves(renderer)),
    loadTex(`${tpath}rock.jpg`, renderer, 2, 2, () => fallbackRock(renderer)),
  ]);
  const ripple = fallbackRipple(renderer);

  const laterite = new THREE.Color(PALETTE.laterite);
  const moss = new THREE.Color(PALETTE.leafDark);
  const soil = new THREE.Color(0x2a1c16);
  const geo = new THREE.PlaneGeometry(WORLD.size, WORLD.size, WORLD.segments, WORLD.segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);
    const t = THREE.MathUtils.smoothstep(y, -1.2, 5.5);
    col.copy(moss).lerp(laterite, t * 0.65 + 0.35);
    col.offsetHSL(0, 0, 0.08);
    if (streamDist(x, z) < 3.4) col.lerp(soil, 0.28);
    const r = Math.hypot(x, z);
    if (r < CLEARING) col.lerp(laterite, 0.22);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      map: groundMap,
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.02,
    }),
  );
  ground.receiveShadow = true;
  group.add(ground);

  const dummy = new THREE.Object3D();
  const trunks = [];
  const half = WORLD.size * 0.45;
  let tries = 0;
  while (trunks.length < WORLD.treeCount && tries < WORLD.treeCount * 10) {
    tries++;
    const x = (Math.random() * 2 - 1) * half;
    const z = (Math.random() * 2 - 1) * half;
    if (Math.hypot(x, z) < CLEARING) continue;
    if (streamDist(x, z) < 3.4) continue;
    let ok = true;
    for (let i = 0; i < trunks.length; i++) {
      const t = trunks[i];
      if ((t.x - x) * (t.x - x) + (t.z - z) * (t.z - z) < 16) { ok = false; break; }
    }
    if (!ok) continue;
    trunks.push({ x, z, r: 0.26 + Math.random() * 0.22, leanX: (Math.random() - 0.5) * 0.14, leanZ: (Math.random() - 0.5) * 0.12 });
  }

  const trunkMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.32, 0.46, 1, 8),
    new THREE.MeshStandardMaterial({ map: barkMap, color: 0x9a7a58, roughness: 0.9 }),
    trunks.length,
  );
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  const canopyBase = [];
  const canopyMesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1.7, 1),
    new THREE.MeshStandardMaterial({ map: leafMap, color: 0xc4dc78, roughness: 0.78, transparent: true, alphaTest: 0.28, side: THREE.DoubleSide, dithering: true }),
    trunks.length,
  );
  canopyMesh.castShadow = false;
  const leafTint = new THREE.Color();
  for (let i = 0; i < trunks.length; i++) {
    const t = trunks[i];
    const y = heightAt(t.x, t.z);
    const h = 4.2 + Math.random() * 3.6;
    dummy.position.set(t.x, y + h * 0.5, t.z);
    dummy.rotation.set(t.leanZ, 0, t.leanX);
    dummy.scale.set((t.r / 0.28) * 1.35, h, (t.r / 0.28) * 1.35);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);
    const sx = 1.3 + Math.random() * 0.8;
    const sy = 0.85 + Math.random() * 0.45;
    const sz = 1.3 + Math.random() * 0.8;
    const cy = y + h + 0.4;
    dummy.position.set(t.x + t.leanX * h, cy, t.z + t.leanZ * h);
    dummy.rotation.set(0.1, Math.random() * 6.28, t.leanX * 0.4);
    dummy.scale.set(sx * 1.15, sy * 0.72, sz * 1.15);
    dummy.updateMatrix();
    canopyMesh.setMatrixAt(i, dummy.matrix);
    canopyMesh.setColorAt(i, leafTint.setHSL(0.25 + Math.random() * 0.06, 0.42, 0.34 + Math.random() * 0.14));
    canopyBase.push({ x: dummy.position.x, y: cy, z: dummy.position.z, sx: sx * 1.15, sy: sy * 0.72, sz: sz * 1.15, rx: dummy.rotation.x, ry: dummy.rotation.y, rz: dummy.rotation.z });
  }
  if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true;
  group.add(trunkMesh);
  group.add(canopyMesh);

  const fernMat = new THREE.MeshStandardMaterial({
    map: leafMap,
    color: 0x7a9a40,
    roughness: 0.86,
    side: THREE.DoubleSide,
  });
  const fernMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.28, 0.55, 5), fernMat, WORLD.fernCount);
  let fi = 0;
  for (let i = 0; i < WORLD.fernCount; i++) {
    const x = (Math.random() * 2 - 1) * half;
    const z = (Math.random() * 2 - 1) * half;
    if (Math.hypot(x, z) < 6) continue;
    const y = heightAt(x, z);
    const rot = Math.random() * Math.PI;
    const sc = 0.65 + Math.random() * 0.7;
    dummy.position.set(x, y + 0.22 * sc, z);
    dummy.scale.set(sc * 1.1, sc, sc * 1.1);
    dummy.rotation.set(0.05, rot, 0.04);
    dummy.updateMatrix();
    fernMesh.setMatrixAt(fi++, dummy.matrix);
  }
  fernMesh.count = fi;
  group.add(fernMesh);

  const rockMesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.55, 1),
    new THREE.MeshStandardMaterial({ map: rockMap, color: 0x8a8478, roughness: 0.9 }),
    WORLD.rockCount,
  );
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  for (let i = 0; i < WORLD.rockCount; i++) {
    const x = (Math.random() * 2 - 1) * half;
    const z = (Math.random() * 2 - 1) * half;
    const rr = Math.hypot(x, z) < 5 ? 8 : 0;
    dummy.position.set(x + rr, heightAt(x + rr, z) + 0.12, z);
    dummy.rotation.set(Math.random(), Math.random() * 6, Math.random());
    dummy.scale.set(0.5 + Math.random() * 1.3, 0.35 + Math.random() * 0.7, 0.5 + Math.random() * 1.1);
    dummy.updateMatrix();
    rockMesh.setMatrixAt(i, dummy.matrix);
  }
  group.add(rockMesh);

  const pts = [];
  const span = WORLD.size * 0.48;
  for (let z = 26; z <= span; z += 2) {
    const x = streamX(z);
    pts.push(new THREE.Vector3(x, heightAt(x, z) - 0.22, z));
  }
  const stream = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(12, pts.length * 2), 1.05, 6, false),
    new THREE.MeshPhysicalMaterial({
      map: ripple,
      color: PALETTE.water,
      roughness: 0.06,
      metalness: 0.12,
      transparent: true,
      opacity: 0.78,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    }),
  );
  stream.receiveShadow = true;
  group.add(stream);

  const hemi = new THREE.HemisphereLight(0xb8c4e0, 0x4a2818, 0.72);
  const moon = new THREE.DirectionalLight(PALETTE.moon, 2.05);
  const moonDir = new THREE.Vector3(...WORLD.moonDir).normalize();
  const moonOffset = moonDir.clone().multiplyScalar(68);
  moon.position.copy(moonOffset);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1536, 1536);
  moon.shadow.camera.near = 8;
  moon.shadow.camera.far = 130;
  const sb = 40;
  moon.shadow.camera.left = -sb;
  moon.shadow.camera.right = sb;
  moon.shadow.camera.top = sb;
  moon.shadow.camera.bottom = -sb;
  moon.shadow.bias = -0.00035;
  moon.shadow.normalBias = 0.035;
  const bounce = new THREE.DirectionalLight(PALETTE.laterite, 0.38);
  bounce.position.set(0.25, 0.12, 0.7);
  const glade = new THREE.PointLight(0xffe2b0, 1.15, 28, 1.6);
  glade.position.set(0, 5.4, 2);
  group.add(hemi, moon, moon.target, bounce, glade, new THREE.AmbientLight(0x2a2438, 0.28));

  const starN = 900;
  const starPos = new Float32Array(starN * 3);
  for (let i = 0; i < starN; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(0.12 + 0.88 * Math.random());
    const r = 92;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  group.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xf0e7d8, size: 0.22, sizeAttenuation: true, transparent: true, opacity: 0.88, depthWrite: false, fog: false,
  })));

  const moonPos = moonDir.clone().multiplyScalar(86);
  const moonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.55, 1.45, 1.25), fog: false });
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(6.4, 32), moonMat);
  moonDisc.position.copy(moonPos);
  moonDisc.lookAt(0, 0, 0);
  const moonGlow = new THREE.Mesh(
    new THREE.CircleGeometry(15, 28),
    new THREE.MeshBasicMaterial({ color: 0xffe8c4, transparent: true, opacity: 0.16, fog: false, depthWrite: false }),
  );
  moonGlow.position.copy(moonPos);
  moonGlow.lookAt(0, 0, 0);
  group.add(moonGlow, moonDisc);

  const fireMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(2.15, 1.55, 0.32),
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const fireMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 6, 6), fireMat, WORLD.fireflyCount);
  const fireflies = [];
  for (let i = 0; i < WORLD.fireflyCount; i++) {
    const f = {
      x: (Math.random() * 2 - 1) * 68,
      y: 1.1 + Math.random() * 5.2,
      z: (Math.random() * 2 - 1) * 68,
      p: Math.random() * 6.28,
      w: 0.6 + Math.random() * 1.1,
    };
    fireflies.push(f);
    dummy.position.set(f.x, f.y, f.z);
    dummy.scale.setScalar(1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    fireMesh.setMatrixAt(i, dummy.matrix);
  }
  group.add(fireMesh);

  const fruits = [];
  const fruitGeo = new THREE.IcosahedronGeometry(0.11, 1);
  const fruitMats = [
    new THREE.MeshStandardMaterial({ color: 0xc94a28, emissive: PALETTE.laterite, emissiveIntensity: 0.35, roughness: 0.42 }),
    new THREE.MeshStandardMaterial({ color: 0xefa83b, emissive: PALETTE.eyeshine, emissiveIntensity: 0.28, roughness: 0.4 }),
  ];
  for (let i = 0; i < WORLD.fruitCount; i++) {
    const near = trunks[Math.floor(Math.random() * trunks.length)] || { x: 8, z: 8 };
    const ang = Math.random() * Math.PI * 2;
    const rad = 1.4 + Math.random() * 2.4;
    const x = near.x + Math.cos(ang) * rad;
    const z = near.z + Math.sin(ang) * rad;
    if (Math.hypot(x, z) < 4) continue;
    const y = heightAt(x, z) + 0.28;
    const mesh = new THREE.Mesh(fruitGeo, fruitMats[i % 2]);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
    fruits.push({ mesh, baseY: y, taken: false });
  }

  function setFocus(p) {
    moon.target.position.set(p.x, p.y, p.z);
    moon.position.copy(p).add(moonOffset);
    moon.target.updateMatrixWorld();
  }

  function resetPickups() {
    for (let i = 0; i < fruits.length; i++) {
      fruits[i].taken = false;
      fruits[i].mesh.visible = true;
    }
  }

  function update(t, dt) {
    ripple.offset.y = t * 0.04;
    for (let i = 0; i < canopyBase.length; i++) {
      const b = canopyBase[i];
      dummy.position.set(b.x, b.y, b.z);
      dummy.rotation.set(b.rx, b.ry + Math.sin(t * 0.55 + i * 0.37) * 0.045, b.rz);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.updateMatrix();
      canopyMesh.setMatrixAt(i, dummy.matrix);
    }
    canopyMesh.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < fireflies.length; i++) {
      const f = fireflies[i];
      f.p += dt * f.w;
      dummy.position.set(
        f.x + Math.sin(f.p * 0.7 + f.w) * 0.85,
        f.y + Math.sin(f.p * 1.3) * 0.32,
        f.z + Math.cos(f.p * 0.55 + f.w) * 0.85,
      );
      const pulse = 0.75 + Math.sin(f.p * 2.2) * 0.45;
      dummy.scale.setScalar(pulse);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      fireMesh.setMatrixAt(i, dummy.matrix);
    }
    fireMesh.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < fruits.length; i++) {
      const f = fruits[i];
      if (f.taken) continue;
      f.mesh.position.y = f.baseY + Math.sin(t * 1.6 + i) * 0.07;
      f.mesh.rotation.y += dt * 0.7;
    }
  }

  return {
    group,
    getHeight: heightAt,
    trunks,
    stream,
    fruits,
    setFocus,
    resetPickups,
    update,
    ready: true,
  };
}
