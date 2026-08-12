/**
 * Eyeshine post — ACES night grade, eyeshine bloom, danger vignette.
 */
import * as THREE from 'three';
import { DOM, $ } from './config.js';

const GrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    amount: { value: 0.012 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    varying vec2 vUv;
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float g = hash(vUv * vec2(1600.0, 900.0) + time);
      float v = smoothstep(1.05, 0.22, length(vUv - 0.5));
      vec3 graded = c.rgb * vec3(1.04, 1.01, 0.98);
      graded *= 0.88 + 0.16 * v;
      gl_FragColor = vec4(graded + (g - 0.5) * amount, c.a);
    }
  `,
};

function configureRenderer(renderer, pixelRatio) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(pixelRatio);
  renderer.autoClear = true;
}

export function createFx(renderer, scene, camera) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  const low = reduce || cores <= 4 || mem <= 4;
  const pr = low ? 1 : Math.min(2, window.devicePixelRatio || 1);
  configureRenderer(renderer, pr);

  let composer = null;
  let bloom = null;
  let grain = null;
  let ready = false;
  let pending = null;

  (async () => {
    try {
      const [
        { EffectComposer },
        { RenderPass },
        { UnrealBloomPass },
        { OutputPass },
        { ShaderPass },
      ] = await Promise.all([
        import('three/addons/postprocessing/EffectComposer.js'),
        import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/UnrealBloomPass.js'),
        import('three/addons/postprocessing/OutputPass.js'),
        import('three/addons/postprocessing/ShaderPass.js'),
      ]);
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      if (!reduce) {
        bloom = new UnrealBloomPass(new THREE.Vector2(2, 2), 0.38, 0.42, 0.82);
        composer.addPass(bloom);
      }
      if (!reduce && !low) {
        grain = new ShaderPass(GrainShader);
        composer.addPass(grain);
      }
      composer.addPass(new OutputPass());
      if (pending) composer.setSize(pending.w, pending.h);
      else composer.setSize(renderer.domElement.clientWidth || 2, renderer.domElement.clientHeight || 2);
      ready = true;
    } catch {
      ready = false;
      composer = null;
    }
  })();

  return {
    render() {
      if (grain) grain.uniforms.time.value = performance.now() * 0.001;
      if (ready && composer) composer.render();
      else renderer.render(scene, camera);
    },

    resize(w, h) {
      pending = { w, h };
      if (composer) composer.setSize(w, h);
    },

    setDanger(v01) {
      const el = $(DOM.damage);
      if (!el) return;
      const u = Math.max(0, Math.min(1, v01));
      el.style.opacity = String(u * 0.55);
    },

    dispose() {
      if (composer) composer.dispose();
      composer = null;
      ready = false;
    },
  };
}
