/**
 * Eyeshine HUD — binds frozen DOM ids; missing nodes are skipped.
 */
import { DOM, $, CENSUS_TARGET } from './config.js';

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function createHud() {
  const overlay = $(DOM.overlay);
  const title = $(DOM.overlayTitle);
  const text = $(DOM.overlayText);
  const btn = $(DOM.overlayBtn);
  const compass = $(DOM.compass);
  const objective = $(DOM.objective);
  const log = $(DOM.log);
  const stamina = $(DOM.stamina);
  const spirit = $(DOM.spirit);
  const prompt = $(DOM.prompt);
  const fact = $(DOM.fact);
  const damage = $(DOM.damage);
  const sr = $(DOM.srLive);
  const hud = $(DOM.hud);
  let factTimer = 0;

  function setText(el, s) {
    if (el) el.textContent = s;
  }

  function setBar(el, v01) {
    if (!el) return;
    const u = clamp(v01, 0, 1);
    const pct = `${Math.round(u * 100)}%`;
    el.style.width = pct;
    el.setAttribute('aria-valuenow', String(Math.round(u * 100)));
  }

  return {
    setOverlay({ title: t, text: p, btn: b, show } = {}) {
      if (t != null) setText(title, t);
      if (p != null) setText(text, p);
      if (b != null) setText(btn, b);
      if (!overlay) return;
      if (show === false) overlay.classList.add('hidden');
      else if (show === true) overlay.classList.remove('hidden');
    },

    setPlaying() {
      if (overlay) overlay.classList.add('hidden');
      if (hud) hud.removeAttribute('aria-hidden');
    },

    setCompass(yaw) {
      if (!compass) return;
      const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const two = Math.PI * 2;
      let a = yaw % two;
      if (a < 0) a += two;
      const i = Math.round(a / (Math.PI / 4)) % 8;
      compass.textContent = `${dirs[(i + 7) % 8]}   ${dirs[i]}   ${dirs[(i + 1) % 8]}`;
    },

    setObjective(s) {
      setText(objective, s);
    },

    setLog(n, total) {
      const t = total == null ? CENSUS_TARGET : total;
      setText(log, `${n} / ${t}`);
    },

    setBars(stamina01, spirit01) {
      setBar(stamina, stamina01);
      setBar(spirit, spirit01);
    },

    setPrompt(s) {
      if (!prompt) return;
      prompt.textContent = s || '';
      prompt.classList.toggle('hidden', !s);
    },

    setFact(htmlOrText) {
      if (!fact) return;
      if (htmlOrText == null || htmlOrText === '') {
        fact.textContent = '';
        fact.classList.add('hidden');
        return;
      }
      fact.classList.remove('hidden');
      if (typeof htmlOrText === 'string' && htmlOrText.includes('<')) {
        fact.innerHTML = htmlOrText;
      } else {
        fact.textContent = String(htmlOrText);
      }
      clearTimeout(factTimer);
      factTimer = setTimeout(() => {
        fact.classList.add('hidden');
      }, 6400);
    },

    setDanger(v01) {
      if (!damage) return;
      damage.style.opacity = String(clamp(v01, 0, 1) * 0.55);
    },

    announce(s) {
      if (!sr) return;
      sr.textContent = '';
      requestAnimationFrame(() => {
        sr.textContent = s;
      });
    },
  };
}
