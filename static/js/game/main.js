/**
 * Eyeshine — night census loop. Greet allies; bound from the fossa.
 */
import * as THREE from 'three';
import { DOM, $, PATHS, TITLE, CENSUS_TARGET, PLAYER, FOSSA } from './config.js';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createWildlife } from './wildlife.js';
import { createFx } from './fx.js';
import { createAudio } from './audio.js';
import { createHud } from './hud.js';

const BEST_KEY = 'eyeshineBest';

function loadBest() {
  try {
    return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(n) {
  try {
    const prev = loadBest();
    const best = Math.max(prev, n);
    localStorage.setItem(BEST_KEY, String(best));
    return best;
  } catch {
    return n;
  }
}

function normalizeSpecies(data) {
  const raw = Array.isArray(data) ? data : (data && (data.species || data.results)) || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => ({
    common_name: s.common_name || s.name || 'Lemur',
    scientific_name: s.scientific_name || '',
    conservation_status: s.conservation_status || '',
    description: s.description || '',
    image: s.image || s.image_filename || '',
  })).filter((s) => s.common_name);
}

async function loadSpecies() {
  try {
    const r = await fetch(PATHS.speciesJson);
    if (!r.ok) throw new Error('species.json');
    const data = normalizeSpecies(await r.json());
    if (data.length) return data;
    throw new Error('empty');
  } catch {
    const r = await fetch('/api/species');
    if (!r.ok) throw new Error('api');
    return normalizeSpecies(await r.json());
  }
}

const canvas = $(DOM.canvas);
const shell = $(DOM.shell) || (canvas && canvas.parentElement);
if (!canvas) {
  console.warn('Eyeshine: #game-canvas missing');
} else {
  boot().catch((err) => console.error('Eyeshine failed', err));
}

async function boot() {
  const hud = createHud();
  const audio = createAudio();
  const best0 = loadBest();
  hud.setOverlay({
    title: TITLE,
    text: `Walk the moonlit rainforest as a lemur. Log ${CENSUS_TARGET} species. Bound from the fossa. WASD move · mouse look · Shift bound · Space leap · E greet.${best0 ? ` Best census: ${best0}.` : ''}`,
    btn: 'Enter the night',
    show: true,
  });
  hud.setLog(0, CENSUS_TARGET);
  hud.setObjective('Log the night census');
  hud.setBars(1, 1);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(68, 16 / 9, 0.08, 140);

  let species = [];
  try {
    species = await loadSpecies();
  } catch {
    species = [];
  }
  if (!species.length) {
    species = [
      { common_name: 'Ring-tailed Lemur', scientific_name: 'Lemur catta', conservation_status: 'Endangered', description: 'Female-led troops; a long black-and-white ringed tail.', image: 'ring_tailed.jpg' },
      { common_name: 'Aye-aye', scientific_name: 'Daubentonia madagascariensis', conservation_status: 'Endangered', description: 'Nocturnal, with a skeletal middle finger for tap-foraging.', image: 'aye_aye.jpg' },
      { common_name: 'Indri', scientific_name: 'Indri indri', conservation_status: 'Critically Endangered', description: 'Largest living lemur; whale-like songs carry for miles.', image: 'indri.jpg' },
      { common_name: "Verreaux's Sifaka", scientific_name: 'Propithecus verreauxi', conservation_status: 'Critically Endangered', description: 'Sideways dancers and ten-metre leapers.', image: 'sifaka.jpg' },
      { common_name: 'Red Ruffed Lemur', scientific_name: 'Varecia rubra', conservation_status: 'Critically Endangered', description: 'Russet seed-dispersers of the Masoala canopy.', image: 'red_ruffed.jpg' },
      { common_name: 'Mouse Lemur', scientific_name: 'Microcebus murinus', conservation_status: 'Least Concern', description: 'One of the smallest primates; fierce night hunters of insects.', image: 'mouse_lemur.jpg' },
      { common_name: 'Golden Bamboo Lemur', scientific_name: 'Hapalemur aureus', conservation_status: 'Critically Endangered', description: 'Eats cyanide-rich giant bamboo shoots.', image: 'bamboo_lemur.jpg' },
      { common_name: 'Diademed Sifaka', scientific_name: 'Propithecus diadema', conservation_status: 'Critically Endangered', description: 'Gold, white, grey and black silk — among the most endangered.', image: 'diademed_sifaka.jpg' },
    ];
  }

  const world = await createWorld(scene, renderer);
  scene.add(camera);
  const player = createPlayer(camera, renderer, world, audio);
  const wildlife = createWildlife(scene, world, species, audio);
  const fx = createFx(renderer, scene, camera);

  const input = {
    forward: false, back: false, left: false, right: false,
    bound: false, jump: false, crouch: false, greet: false,
  };
  const keyMap = {
    KeyW: 'forward', ArrowUp: 'forward',
    KeyS: 'back', ArrowDown: 'back',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'bound', ShiftRight: 'bound',
    Space: 'jump',
    KeyC: 'crouch',
    KeyE: 'greet',
  };

  let state = 'ready';
  let muted = false;
  const lookDir = new THREE.Vector3();
  let drag = false;
  let lx = 0;
  let ly = 0;

  function resize() {
    const w = Math.max(2, Math.floor((shell && shell.clientWidth) || canvas.clientWidth || 960));
    const h = Math.max(2, Math.floor((shell && shell.clientHeight) || Math.round(w * 9 / 16)));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    fx.resize(w, h);
  }
  resize();
  window.addEventListener('resize', resize);

  function persist() {
    return saveBest(wildlife.logged);
  }

  function resetRound() {
    player.respawn();
    if (wildlife.reset) wildlife.reset();
    if (world.resetPickups) world.resetPickups();
    if (world.resetPickups) world.resetPickups();
    hud.setLog(0, CENSUS_TARGET);
    hud.setBars(1, 1);
    hud.setDanger(0);
    fx.setDanger(0);
    hud.setPrompt('');
    hud.setObjective('Log the night census');
  }

  function enterPlay() {
    if (state === 'dead' || state === 'win') resetRound();
    state = 'playing';
    hud.setPlaying();
    audio.resume();
    audio.drone(true);
    hud.announce('Night census. Walk, look, greet eight species. Bound if the fossa scents you.');
    try { player.controls.lock(); } catch { /* mobile / denied */ }
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    audio.drone(false);
    hud.setOverlay({
      title: 'Still',
      text: 'The forest waits. Click to resume the census.',
      btn: 'Resume',
      show: true,
    });
    hud.announce('Paused');
    try { player.controls.unlock(); } catch { /* ignore */ }
  }

  function win() {
    if (state !== 'playing') return;
    state = 'win';
    const best = persist();
    audio.drone(false);
    audio.win();
    try { player.controls.unlock(); } catch { /* ignore */ }
    hud.setObjective('Census complete');
    hud.setOverlay({
      title: 'Census complete',
      text: `You logged ${wildlife.logged} species under the moon. Best: ${best}. The fossa never closed.`,
      btn: 'Walk again',
      show: true,
    });
    hud.announce(`Census complete. ${wildlife.logged} species logged.`);
  }

  function lose() {
    if (state !== 'playing') return;
    state = 'dead';
    const best = persist();
    audio.drone(false);
    audio.lose();
    hud.setBars(player.stamina / PLAYER.staminaMax, 0);
    hud.setDanger(1);
    fx.setDanger(1);
    try { player.controls.unlock(); } catch { /* ignore */ }
    hud.setObjective('You fled');
    hud.setOverlay({
      title: 'The fossa found you',
      text: `You fled into the understory. Logged ${wildlife.logged} / ${CENSUS_TARGET}. Best: ${best}.`,
      btn: 'Try again',
      show: true,
    });
    hud.announce(`The fossa found you. Logged ${wildlife.logged} of ${CENSUS_TARGET}.`);
  }

  player.controls.addEventListener('unlock', () => {
    if (state === 'playing') pause();
  });

  const overlayBtn = $(DOM.overlayBtn);
  if (overlayBtn) overlayBtn.addEventListener('click', (e) => {
    e.preventDefault();
    enterPlay();
  });

  canvas.addEventListener('click', () => {
    if (state === 'playing') input.greet = true;
    else enterPlay();
  });

  canvas.addEventListener('pointerdown', (e) => {
    if (player.controls.isLocked) return;
    drag = true;
    lx = e.clientX;
    ly = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || player.controls.isLocked || state !== 'playing') return;
    player.look(e.clientX - lx, e.clientY - ly);
    lx = e.clientX;
    ly = e.clientY;
  });
  canvas.addEventListener('pointerup', () => { drag = false; });
  canvas.addEventListener('pointercancel', () => { drag = false; });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') {
      muted = !muted;
      audio.setMuted(muted);
      if (!muted && state === 'playing') audio.drone(true);
      hud.announce(muted ? 'Muted' : 'Sound on');
      return;
    }
    if (e.code === 'Escape' && state === 'playing') {
      pause();
      return;
    }
    const k = keyMap[e.code];
    if (!k) return;
    input[k] = true;
    if (e.code === 'Space') e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    const k = keyMap[e.code];
    if (k) input[k] = false;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') pause();
  });

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now * 0.001;

    if (state === 'playing') {
      const sprinting = input.bound && player.stamina > 1 && !player.crouching;
      player.update(dt, input);
      if (world.setFocus) world.setFocus(player.position);
      world.update(t, dt);
      wildlife.update(dt, player.position, sprinting);

      if (input.greet) {
        camera.getWorldDirection(lookDir);
        const hit = wildlife.tryGreet(player.position, lookDir);
        if (hit) {
          const short = (hit.description || '').slice(0, 180);
          hud.setFact(
            `<strong>${hit.name}</strong> <em>${hit.scientific_name}</em> · ${hit.conservation_status}` +
            (short ? `<br>${short}` : ''),
          );
          hud.setLog(wildlife.logged, CENSUS_TARGET);
          hud.announce(`Logged ${hit.name}, ${hit.conservation_status}. ${wildlife.logged} of ${CENSUS_TARGET}.`);
        }
      }

      camera.getWorldDirection(lookDir);
      hud.setCompass(Math.atan2(lookDir.x, -lookDir.z));
      hud.setLog(wildlife.logged, CENSUS_TARGET);
      hud.setBars(player.stamina / PLAYER.staminaMax, 1);
      if (wildlife.chasing) hud.setObjective('Bound — the fossa has your scent');
      else hud.setObjective('Log the night census');
      hud.setPrompt(wildlife.focusName ? `E  Greet · ${wildlife.focusName}` : '');

      const danger = wildlife.chasing
        ? Math.max(0, 1 - wildlife.fossaDist / FOSSA.detectRadius)
        : Math.max(0, 1 - wildlife.fossaDist / (FOSSA.detectRadius * 0.55)) * 0.35;
      hud.setDanger(danger);
      fx.setDanger(danger);

      if (wildlife.logged >= CENSUS_TARGET) win();
      else if (wildlife.fossaDist <= FOSSA.catchRadius) lose();
    } else {
      world.update(t, dt);
      camera.getWorldDirection(lookDir);
      hud.setCompass(Math.atan2(lookDir.x, -lookDir.z));
      hud.setBars(1, 1);
    }

    fx.render();
    input.greet = false;
  }
  requestAnimationFrame(frame);
}
