import { createWorld } from './world.js?v=assets34';
import { chapterAt, chapterOpacity } from './timeline.js?v=story16';

const $ = s => document.querySelector(s);
const chapters = [...document.querySelectorAll('.chapter')];
const copies = chapters.map(el => el.querySelector('.copy'));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const state = { progress: 0 };

let world;
if (!reduceMotion.matches) {
  try {
    world = createWorld($('#world'));
    document.body.classList.add('webgl-ready');
  } catch (error) {
    console.error('3D scene unavailable', error);
    document.body.classList.add('no-webgl');
  }
}

$('#world').addEventListener('webglcontextlost', e => {
  e.preventDefault();
  world = undefined;
  document.body.classList.remove('webgl-ready');
  document.body.classList.add('no-webgl');
});

gsap.registerPlugin(ScrollTrigger);
const scrollTween = gsap.to(state, {
  progress: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: '#story',
    start: 'top top',
    end: 'bottom bottom',
    scrub: reduceMotion.matches ? true : 0.8
  }
});

let chapterOffsets = [];
function measure() {
  chapterOffsets = chapters.map(el => el.offsetTop);
}
measure();

function maxScroll() {
  return document.documentElement.scrollHeight - innerHeight;
}

let playing = false, filmPosition = 0;
function setPlaying(value) {
  if (value && !playing) filmPosition = window.scrollY;
  playing = value;
  $('#play').setAttribute('aria-pressed', String(value));
  $('#play').setAttribute('aria-label', value ? 'Pause film' : 'Play film automatically');
  $('#play').innerHTML = value ? 'Ⅱ <span>PAUSE FILM</span>' : '▷ <span>WATCH FILM</span>';
}

window.go = go;
function go(index, instant = true) {
  window.__currentChapterIndex = index;
  setPlaying(false);
  const targetY = chapterOffsets[index] + (index > 0 && index < 11 ? innerHeight * 0.15 : 0);
  state.progress = maxScroll() > 0 ? targetY / maxScroll() : 0;
  window.scrollTo({
    top: targetY,
    behavior: (instant || reduceMotion.matches) ? 'instant' : 'smooth'
  });
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.update();
    scrollTween.scrollTrigger?.getTween()?.progress(1);
  }
}

$('#begin').onclick = () => {
  if (!soundOn) triggerSoundStart();
  go(1);
};
$('#replay').onclick = () => go(0);
$('.wordmark').onclick = e => { e.preventDefault(); go(0); };
$('#play').onclick = () => {
  if (window.scrollY >= maxScroll() - 2) window.scrollTo({ top: 0, behavior: 'instant' });
  if (!soundOn && !playing) triggerSoundStart();
  setPlaying(!playing);
};

['wheel', 'touchstart'].forEach(event => addEventListener(event, () => setPlaying(false), { passive: true }));
addEventListener('keydown', e => {
  if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) setPlaying(false);
});

const dialog = $('#chapters-dialog');
$('#chapters-button').onclick = () => { setPlaying(false); dialog.showModal(); };
$('#close-chapters').onclick = () => dialog.close();
dialog.addEventListener('click', e => {
  if (e.target === dialog) {
    const b = dialog.getBoundingClientRect();
    if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) dialog.close();
  }
});

chapters.forEach((chapter, index) => {
  const a = document.createElement('a');
  a.href = '#' + chapter.id;
  a.innerHTML = `<span>${String(index).padStart(2, '0')}</span>${chapter.dataset.name}`;
  a.onclick = e => {
    e.preventDefault();
    dialog.close();
    go(index);
  };
  $('#chapter-links').append(a);
});

let seeking = false;
$('#progress').addEventListener('pointerdown', () => { seeking = true; setPlaying(false); });
addEventListener('pointerup', () => seeking = false);
$('#progress').addEventListener('input', e => {
  setPlaying(false);
  state.progress = Number(e.target.value) / 1000;
  window.scrollTo({ top: state.progress * maxScroll(), behavior: 'instant' });
  ScrollTrigger.update();
  scrollTween.scrollTrigger?.getTween()?.progress(1);
});

// Modak interaction
const modakBtn = $('#modak');
if (modakBtn) {
  modakBtn.addEventListener('mouseenter', () => world?.setModakHover(true));
  modakBtn.addEventListener('mouseleave', () => world?.setModakHover(false));
  modakBtn.onclick = () => {
    world?.burst();
    $('#blessing').textContent = 'Wisdom is the sweetest reward.';
    bell(528);
    spawnMushakaBurst(innerWidth * 0.5, innerHeight * 0.5, 45);
  };
}

// -------------------------------------------------------------
// CINEMATIC PROCEDURAL WEB AUDIO ENGINE
// -------------------------------------------------------------
let audio, master, biquadFilter, compressor, soundOn = false;
let bgMusicSource = null, bgMusicGain = null;

function createAudio() {
  audio = new (window.AudioContext || window.webkitAudioContext)();
  master = audio.createGain();
  master.gain.value = 0;

  // Biquad Lowpass Filter for underwater Visarjan effect
  biquadFilter = audio.createBiquadFilter();
  biquadFilter.type = 'lowpass';
  biquadFilter.frequency.value = 20000;
  biquadFilter.Q.value = 1.0;

  compressor = audio.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-18, audio.currentTime);
  compressor.knee.setValueAtTime(30, audio.currentTime);
  compressor.ratio.setValueAtTime(12, audio.currentTime);
  compressor.attack.setValueAtTime(0.003, audio.currentTime);
  compressor.release.setValueAtTime(0.25, audio.currentTime);

  master.connect(biquadFilter).connect(compressor).connect(audio.destination);
  // All sound now comes from the Ekadantaya flute MP3 + cinematic bell cues.
  // Procedural Om drone and sequencer removed.
}

// tone() — helper for bell() cinematic cues only
function tone(frequency, when, length, volume, type = 'sine') {
  if (!audio) return;
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
  osc.connect(gain).connect(master);
  osc.start(when);
  osc.stop(when + length + 0.1);
}

// Temple bell — cinematic chapter-entrance cues
function bell(frequency = 396, decay = 4.2) {
  if (!soundOn || !audio) return;
  const now = audio.currentTime;
  [1.0, 2.01, 2.76, 4.07, 5.42].forEach((ratio, i) => {
    tone(frequency * ratio, now, Math.max(0.6, decay - i * 0.7), 0.075 / (i + 1));
  });
}

async function triggerSoundStart() {
  try {
    if (!audio) createAudio();
    await audio.resume();
    soundOn = true;
    master.gain.setTargetAtTime(0.7, audio.currentTime, 0.3);
    $('#sound').setAttribute('aria-pressed', 'true');
    $('#sound-label').textContent = 'SOUND ON';
    document.body.classList.add('sound-on');
    bell(261.63, 4.5);

    // ── EKADANTAYA FLUTE — background devotional music ──
    // Load once, loop forever, route through master chain so it
    // responds to SOUND OFF toggle, biquad filter (Visarjan underwater),
    // and the dynamics compressor automatically.
    if (!bgMusicSource) {
      try {
        const res  = await fetch('./assets/Ekadantaya Vakratundaya Gouritanyay Dheemahi Flute Cover  Instrumental.mp3');
        const buf  = await res.arrayBuffer();
        const decoded = await audio.decodeAudioData(buf);

        bgMusicGain = audio.createGain();
        bgMusicGain.gain.value = 0;               // start silent
        bgMusicGain.connect(master);               // flows through biquad → compressor → destination

        bgMusicSource = audio.createBufferSource();
        bgMusicSource.buffer = decoded;
        bgMusicSource.loop   = true;
        bgMusicSource.connect(bgMusicGain);
        bgMusicSource.start(0);

        // Fade in gently over 3 seconds — sits under procedural sounds
        bgMusicGain.gain.setTargetAtTime(0.38, audio.currentTime, 3.0);
      } catch (e) {
        console.warn('Background music could not load:', e);
      }
    }
  } catch (err) {
    console.error(err);
    $('#sound-label').textContent = 'SOUND UNAVAILABLE';
  }
}

$('#sound').onclick = async () => {
  if (!soundOn) {
    await triggerSoundStart();
  } else {
    soundOn = false;
    master.gain.setTargetAtTime(0, audio.currentTime, 0.3);
    // Fade out background music separately (it goes to near-zero, not cut)
    if (bgMusicGain) bgMusicGain.gain.setTargetAtTime(0, audio.currentTime, 0.5);
    $('#sound').setAttribute('aria-pressed', 'false');
    $('#sound-label').textContent = 'SOUND OFF';
    document.body.classList.remove('sound-on');
  }
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    setPlaying(false);
    audio?.suspend();
  } else if (soundOn) {
    audio?.resume().catch(() => {});
  }
});
addEventListener('pagehide', () => {
  audio?.close();
});

// -------------------------------------------------------------
// MUSHAKA (THE SACRED MOUSE) GOLDEN FOOTPRINT & STARDUST TRAIL
// -------------------------------------------------------------
const mCanvas = $('#mushaka-canvas');
const mCtx = mCanvas?.getContext('2d');
let mParticles = [];
let lastMouseX = -100, lastMouseY = -100;
let distSincePrint = 0;

function resizeMushaka() {
  if (!mCanvas) return;
  mCanvas.width = innerWidth;
  mCanvas.height = innerHeight;
}
resizeMushaka();
addEventListener('resize', resizeMushaka);

function spawnMushakaBurst(x, y, count = 25) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    mParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1.5 + Math.random() * 2.5,
      alpha: 1,
      decay: 0.015 + Math.random() * 0.02,
      color: Math.random() > 0.4 ? '#d6b77d' : '#ffea9f',
      isFootprint: false
    });
  }
}

addEventListener('pointermove', e => {
  // Only activate subtle Mushaka trail after Ganesha Rebirth (chapter 7+)
  if (lastIndex < 7) return;

  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  const dist = Math.hypot(dx, dy);

  // Stardust trail
  if (Math.random() > 0.4) {
    mParticles.push({
      x: e.clientX + (Math.random() - 0.5) * 8,
      y: e.clientY + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.3 - Math.random() * 0.6,
      size: 1 + Math.random() * 2,
      alpha: 0.8,
      decay: 0.02 + Math.random() * 0.025,
      color: '#ffdf94',
      isFootprint: false
    });
  }

  // Golden tiny footprints every 36px traveled
  distSincePrint += dist;
  if (distSincePrint > 36) {
    distSincePrint = 0;
    const angle = Math.atan2(dy, dx);
    mParticles.push({
      x: e.clientX,
      y: e.clientY,
      angle: angle,
      alpha: 0.75,
      decay: 0.009,
      size: 3.5,
      color: '#d6b77d',
      isFootprint: true
    });
  }

  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}, { passive: true });

function renderMushaka() {
  if (!mCtx) return;
  mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);

  for (let i = mParticles.length - 1; i >= 0; i--) {
    const p = mParticles[i];
    p.alpha -= p.decay;
    if (p.alpha <= 0) {
      mParticles.splice(i, 1);
      continue;
    }

    mCtx.save();
    mCtx.globalAlpha = p.alpha;

    if (p.isFootprint) {
      // Draw delicate golden footprint paw mark
      mCtx.translate(p.x, p.y);
      mCtx.rotate(p.angle);
      mCtx.fillStyle = p.color;
      mCtx.shadowColor = '#d6b77d';
      mCtx.shadowBlur = 6;
      // Main heel pad
      mCtx.beginPath();
      mCtx.ellipse(0, 0, p.size, p.size * 0.7, 0, 0, Math.PI * 2);
      mCtx.fill();
      // Three tiny toe pads
      [-p.size * 0.6, 0, p.size * 0.6].forEach(offset => {
        mCtx.beginPath();
        mCtx.arc(p.size * 1.1, offset, p.size * 0.28, 0, Math.PI * 2);
        mCtx.fill();
      });
    } else {
      p.x += p.vx;
      p.y += p.vy;
      mCtx.fillStyle = p.color;
      mCtx.shadowColor = '#ffcf73';
      mCtx.shadowBlur = 4;
      mCtx.beginPath();
      mCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      mCtx.fill();
    }
    mCtx.restore();
  }
}

// -------------------------------------------------------------
// STORY TIMELINE & CHAPTER TRANSITIONS
// -------------------------------------------------------------
let lastIndex = -1, previousTime = 0;

function flashScreen() {
  if (reduceMotion.matches) return;
  document.body.classList.add('flash-active');
  setTimeout(() => document.body.classList.remove('flash-active'), 500);
}

function updateStory() {
  const scrollY = window.scrollY;
  const progressPos = state.progress * maxScroll();
  const currentScroll = progressPos;
  const { index, local } = chapterAt(currentScroll, chapterOffsets, chapters.at(-1).offsetHeight);
  document.body.classList.toggle('weapon-shot', index===4 && local>=.25 && local<.56);
  document.body.classList.toggle('impact-black', index===4 && local>=.49 && local<.56);
  const opacity = chapterOpacity(index, local, reduceMotion.matches);

  // Screen shake classes during battle (4) and Shakti rage (5)
  if (index === 4 || index === 5) {
    document.body.classList.add('shake-active');
  } else {
    document.body.classList.remove('shake-active');
  }

  // Underwater acoustic & visual mode during Visarjan (10)
  if (index === 10 && local > 0.35) {
    document.body.classList.add('underwater-scene');
    if (biquadFilter && audio) {
      biquadFilter.frequency.setTargetAtTime(340, audio.currentTime, 0.4);
    }
  } else {
    document.body.classList.remove('underwater-scene');
    if (biquadFilter && audio) {
      biquadFilter.frequency.setTargetAtTime(20000, audio.currentTime, 0.4);
    }
  }

  if (index !== lastIndex) {
    copies.forEach((copy, i) => {
      const active = i === index;
      copy.style.visibility = active ? 'visible' : 'hidden';
      copy.closest('section').setAttribute('aria-hidden', String(!active));
      copy.closest('section').inert = !active;
    });

    $('#chapter-number').textContent = String(index).padStart(2, '0');
    $('#chapter-name').textContent = chapters[index].dataset.name.toUpperCase();
    $('#progress-number').textContent = `${String(index + 1).padStart(2, '0')} / 12`;
    $('#progress').setAttribute('aria-valuetext', chapters[index].dataset.name);

    [...$('#chapter-links').children].forEach((a, i) => {
      if (i === index) a.setAttribute('aria-current', 'step');
      else a.removeAttribute('aria-current');
    });

    // Cinematic Chapter Entrance Bell Cues
    if (lastIndex >= 0 && soundOn) {
      if (index === 7) {
        flashScreen();
        bell(528, 4.5);
      } else if (index === 10) {
        bell(261.63, 5.0);
      } else {
        bell(261.63);
      }
    }

    lastIndex = index;
    if (!world || reduceMotion.matches) {
      $('#art').style.backgroundImage = `url(./assets/${index === 10 ? 'visarjan' : index > 0 && index < 7 ? 'kailash' : 'ganesha'}.png)`;
    }
  }

  copies[index].style.opacity = opacity;
  copies[index].style.translate = `0 ${reduceMotion.matches ? 0 : (1 - opacity) * 18}px`;

  if (!seeking) $('#progress').value = Math.round(state.progress * 1000);
  $('#progress').style.setProperty('--progress', state.progress * 100 + '%');

  return { index, local };
}

function render(time) {
  const delta = Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;

  if (!document.hidden) {
    if (playing && !dialog.open) {
      filmPosition = Math.min(maxScroll(), filmPosition + maxScroll() / 390 * delta);
      window.scrollTo({ top: filmPosition, behavior: 'instant' });
      if (window.scrollY >= maxScroll() - 1) setPlaying(false);
    }
    const { index, local } = updateStory();
    if (!reduceMotion.matches) world?.render(time, index, local, delta);
    renderMushaka();
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

addEventListener('resize', () => {
  world?.resize();
  measure();
  ScrollTrigger.refresh();
});

reduceMotion.addEventListener('change', () => {
  if (reduceMotion.matches) {
    setPlaying(false);
    world?.suspend();
    document.body.classList.remove('webgl-ready');
  } else if (!world) {
    try {
      world = createWorld($('#world'));
      document.body.classList.add('webgl-ready');
    } catch {}
  } else {
    document.body.classList.add('webgl-ready');
  }
  lastIndex = -1;
  measure();
  ScrollTrigger.refresh();
});

document.fonts.ready.then(() => {
  measure();
  ScrollTrigger.refresh();
});

const initial = chapters.findIndex(c => '#' + c.id === location.hash);
if (initial > 0) go(initial);

