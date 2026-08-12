/**
 * Eyeshine player — first-person lemur. Tail is the viewmodel, not a gun.
 */
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { PLAYER, WORLD } from './config.js';

const HALF = WORLD.size * 0.48;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function makeTail() {
  const g = new THREE.Group();
  g.position.set(0.26, -0.36, -0.4);
  g.rotation.set(0.4, -0.55, 0.18);
  for (let i = 0; i < 9; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0x141010 : 0xeee4d4,
      fog: false,
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.04 - i * 0.0024, 10, 8), mat);
    const u = i / 8;
    m.position.set(-u * 0.055, -Math.sin(u * 1.3) * 0.045, -u * 0.088);
    g.add(m);
  }
  return g;
}

export function createPlayer(camera, renderer, world, audio) {
  const canvas = renderer.domElement;
  const controls = new PointerLockControls(camera, canvas);
  camera.rotation.order = 'YXZ';

  const tail = makeTail();
  camera.add(tail);

  let velY = 0;
  let stamina = PLAYER.staminaMax;
  let crouching = false;
  let onGround = true;
  let eye = PLAYER.eyeHeight;
  let bob = 0;
  let stepAcc = 0;
  let jumpLatch = false;
  let spawnReady = false;

  function spawn() {
    const h = world.getHeight(0, 0);
    camera.position.set(0, h + PLAYER.eyeHeight + 0.12, 8.4);
    camera.rotation.order = 'YXZ';
    camera.lookAt(1.2, h + 0.35, 3.6);
    camera.rotation.z = 0;
    velY = 0;
    stamina = PLAYER.staminaMax;
    crouching = false;
    eye = PLAYER.eyeHeight;
    onGround = true;
    spawnReady = true;
  }

  spawn();

  function look(dx, dy) {
    camera.rotation.order = 'YXZ';
    camera.rotation.y -= dx * PLAYER.mouseSens;
    camera.rotation.x -= dy * PLAYER.mouseSens;
    camera.rotation.x = clamp(camera.rotation.x, -1.45, 1.45);
    camera.rotation.z = 0;
  }

  function resolveTrunks(pos) {
    const trunks = world.trunks || [];
    for (let n = 0; n < 2; n++) {
      for (let i = 0; i < trunks.length; i++) {
        const t = trunks[i];
        const dx = pos.x - t.x;
        const dz = pos.z - t.z;
        const d = Math.hypot(dx, dz);
        const min = t.r + PLAYER.radius;
        if (d < min && d > 1e-4) {
          const push = (min - d) / d;
          pos.x += dx * push;
          pos.z += dz * push;
        }
      }
    }
    pos.x = clamp(pos.x, -HALF, HALF);
    pos.z = clamp(pos.z, -HALF, HALF);
  }

  function pickFruit(pos) {
    const fruits = world.fruits;
    if (!fruits) return;
    for (let i = 0; i < fruits.length; i++) {
      const f = fruits[i];
      if (f.taken) continue;
      const p = f.mesh.position;
      const dx = p.x - pos.x;
      const dz = p.z - pos.z;
      const dy = p.y - pos.y;
      if (dx * dx + dz * dz + dy * dy < 1.7) {
        f.taken = true;
        f.mesh.visible = false;
        stamina = Math.min(PLAYER.staminaMax, stamina + 38);
        if (audio && audio.fruit) audio.fruit();
      }
    }
  }

  return {
    controls,
    position: camera.position,
    get stamina() { return stamina; },
    get crouching() { return crouching; },
    get onGround() { return onGround; },

    look,
    respawn: spawn,

    update(dt, input) {
      if (!spawnReady) spawn();
      crouching = !!input.crouch;
      const wantEye = crouching ? PLAYER.crouchHeight : PLAYER.eyeHeight;
      eye += (wantEye - eye) * Math.min(1, dt * 10);

      const moving = input.forward || input.back || input.left || input.right;
      const canBound = input.bound && stamina > 0 && !crouching;
      let speed = crouching ? PLAYER.walkSpeed * 0.55 : PLAYER.walkSpeed;
      if (canBound && moving) {
        speed = PLAYER.boundSpeed;
        stamina = Math.max(0, stamina - PLAYER.staminaDrain * dt);
      } else if (!input.bound) {
        stamina = Math.min(PLAYER.staminaMax, stamina + PLAYER.staminaRegen * dt);
      }

      let f = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
      let r = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const mag = Math.hypot(f, r);
      if (mag > 1) {
        f /= mag;
        r /= mag;
      }
      if (mag > 0) {
        controls.moveForward(f * speed * dt);
        controls.moveRight(r * speed * dt);
      }

      const pos = camera.position;
      resolveTrunks(pos);

      if (input.jump && onGround && !jumpLatch) {
        velY = PLAYER.jumpSpeed;
        onGround = false;
        jumpLatch = true;
      }
      if (!input.jump) jumpLatch = false;

      velY -= PLAYER.gravity * dt;
      pos.y += velY * dt;
      const ground = world.getHeight(pos.x, pos.z);
      const floor = ground + eye;
      if (pos.y <= floor) {
        pos.y = floor;
        if (velY < 0) velY = 0;
        onGround = true;
      } else {
        onGround = false;
      }

      if (onGround && moving && !reduce) {
        bob += dt * (canBound ? 14 : 9);
        pos.y += Math.sin(bob * 2) * PLAYER.bobAmp * (crouching ? 0.4 : 1);
      }

      const sway = moving ? (canBound ? 1 : 0.55) : 0.15;
      tail.rotation.z = 0.18 + Math.sin(performance.now() * 0.004 + bob) * 0.16 * sway;
      tail.rotation.x = 0.4 + Math.sin(performance.now() * 0.0025) * 0.07 * sway;
      if (reduce) {
        tail.rotation.z = 0.18;
        tail.rotation.x = 0.4;
      }

      if (onGround && moving) {
        stepAcc += dt * (canBound ? 2.4 : 1.6);
        if (stepAcc > 0.42) {
          stepAcc = 0;
          if (audio && audio.footstep) audio.footstep();
        }
      }

      pickFruit(pos);
    },
  };
}
