/* main.js */
/* Canvas wave background + channel interactions + WebAudio approx of Wii sounds */

(() => {
  // ---------- Canvas background (Wii-like animated waves) ----------
  const canvas = document.getElementById('bgcanvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  let t0 = performance.now();

  // parameters: layers of waves
  const layers = [
    { amp: 40, freq: 0.0022, speed: 0.0009, hue: 210, light: 66, alpha: 0.28, offset: 0 },
    { amp: 26, freq: 0.0035, speed: 0.0016, hue: 205, light: 56, alpha: 0.20, offset: 120 },
    { amp: 14, freq: 0.0052, speed: 0.0026, hue: 200, light: 48, alpha: 0.14, offset: 250 }
  ];

  function resizeCanvas() {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
  }
  addEventListener('resize', resizeCanvas);

  function draw() {
    const now = performance.now();
    const dt = now - t0;

    // background gradient (subtle)
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b1c3a');
    g.addColorStop(0.55, '#08305f');
    g.addColorStop(1, '#001024');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // draw wave layers
    layers.forEach((layer, li) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      const detail = 120;
      for (let i = 0; i <= detail; i++) {
        const x = (i / detail) * w;
        const phase = dt * layer.speed + (i / detail) * 2 * Math.PI * layer.freq + layer.offset;
        const y = h * 0.45 + Math.sin(phase) * layer.amp * (1 + Math.sin(dt * 0.00015 + li));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();

      // color with blur/shadow feel using globalAlpha & gradient
      ctx.fillStyle = `hsla(${layer.hue}, 70%, ${layer.light}%, ${layer.alpha})`;
      ctx.fill();
    });

    // subtle sparkle particles (randomized)
    for (let i = 0; i < 8; i++) {
      const x = (Math.sin((now * 0.0003) + i) * 0.5 + 0.5) * w;
      const y = 60 + (i * 30) % (h * 0.6);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.02 + (i%3)*0.02})`;
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }
  draw();

  // ---------- WebAudio: simple Wii-like hover & click approximations ----------
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const aCtx = new AudioCtx();

  function playHoverTone() {
    // short ascending soft tone
    const now = aCtx.currentTime;
    const osc = aCtx.createOscillator();
    const gain = aCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(820, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    const biquad = aCtx.createBiquadFilter();
    biquad.type = 'lowpass';
    biquad.frequency.setValueAtTime(2400, now);
    osc.connect(biquad);
    biquad.connect(gain);
    gain.connect(aCtx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  function playClickTone() {
    // short click + low body
    const now = aCtx.currentTime;
    // click plank
    const noise = aCtx.createBufferSource();
    const bufferSize = aCtx.sampleRate * 0.03;
    const buffer = aCtx.createBuffer(1, bufferSize, aCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * i / bufferSize);
    }
    noise.buffer = buffer;
    const noiseGain = aCtx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noise.connect(noiseGain);
    // low tone body
    const osc = aCtx.createOscillator();
    const og = aCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    og.gain.setValueAtTime(0.03, now);
    osc.connect(og);
    og.connect(aCtx.destination);
    noiseGain.connect(aCtx.destination);
    noise.start(now);
    noise.stop(now + 0.03);
    osc.start(now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);
    osc.stop(now + 0.26);
  }

  // ---------- Channel interactions: random subtle float offsets ----------
  const channelsContainer = document.getElementById('channels');
  const channels = Array.from(document.querySelectorAll('.channel'));

  // give each channel a random idle transform offset and float animation via JS (so movement's not identical)
  channels.forEach((el, idx) => {
    // base random offsets and unique speed/phase
    const rx = (Math.random() * 16) - 8;
    const ry = (Math.random() * 12) - 6;
    const rrot = (Math.random() * 3) - 1.5;
    const speed = 2.4 + Math.random() * 2.4;
    el.dataset._rx = rx; el.dataset._ry = ry; el.dataset._rrot = rrot; el.dataset._speed = speed;
    // small transform to seed difference
    el.style.transform = `translate3d(${rx}px, ${ry}px, 0) rotate(${rrot}deg)`;
  });

  function updateChannelFloat() {
    const now = performance.now() / 1000;
    channels.forEach((el, idx) => {
      const rx = parseFloat(el.dataset._rx);
      const ry = parseFloat(el.dataset._ry);
      const rrot = parseFloat(el.dataset._rrot);
      const speed = parseFloat(el.dataset._speed);
      const ox = Math.sin(now * speed + idx * 1.5) * (6 + idx);
      const oy = Math.cos(now * (speed * 0.8) + idx * 1.2) * (6 + idx * 0.5);
      const rot = Math.sin(now * (speed * 0.7) + idx) * (1.6) + rrot;
      el.style.transform = `translate3d(${rx + ox}px, ${ry + oy}px, 0) rotate(${rot}deg)`;
    });
    requestAnimationFrame(updateChannelFloat);
  }
  updateChannelFloat();

  // Hover / focus sound and subtle scale on keyboard nav
  channels.forEach((ch) => {
    ch.addEventListener('mouseenter', () => {
      // resume audio context on first user interaction (Autoplay policy)
      if (aCtx.state === 'suspended') aCtx.resume();
      playHoverTone();
    });
    ch.addEventListener('click', (ev) => {
      if (aCtx.state === 'suspended') aCtx.resume();
      playClickTone();
      openPanel(ch.dataset.key, ch.dataset.title);
    });
    ch.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        playClickTone();
        openPanel(ch.dataset.key, ch.dataset.title);
      }
    });
  });

  // ---------- Panel content logic ----------
  const panel = document.getElementById('panel');
  const panelContent = document.getElementById('panelContent');
  const closeBtn = document.getElementById('closePanel');

  function openPanel(key, title) {
    // populate minimal content; you should replace with YOUR actual content
    let html = `<h2>${title}</h2>`;
    if (key === 'projects') {
      html += `<p>Here are some highlighted projects. Add project cards with images, links and descriptions here.</p>`;
    } else if (key === 'about') {
      html += `<p>A short bio: I'm a developer who loves interactive UI and game-inspired interfaces.</p>`;
    } else if (key === 'contact') {
      html += `<p>Email: <a href="mailto:you@example.com">you@example.com</a><br>Socials: GitHub, LinkedIn</p>`;
    } else if (key === 'cv') {
      html += `<p>Download my CV: <a href="#">Download</a></p>`;
    } else if (key === 'recs') {
      html += `<p>Here are recommendations and testimonials from colleagues and clients.</p>`;
    }
    panelContent.innerHTML = html;
    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden','false');
    // small entrance animation
    panel.style.transform = 'translate(-50%, -50%) scale(1)';
    panel.style.opacity = '1';
  }

  closeBtn.addEventListener('click', () => {
    panel.classList.add('hidden');
    panel.setAttribute('aria-hidden','true');
    panel.style.transform = 'translate(-50%, -50%) scale(0.96)';
  });

  // close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
      closeBtn.click();
    }
  });

  // Accessibility: keyboard navigation between channels (arrow keys)
  let focusedIndex = 0;
  document.addEventListener('keydown', (ev) => {
    if (document.activeElement && document.activeElement.classList.contains('channel')) {
      focusedIndex = channels.indexOf(document.activeElement);
    }
    if (['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'].includes(ev.key)) {
      ev.preventDefault();
      // grid navigation: we assume channels array order matches visual order
      if (ev.key === 'ArrowRight') focusedIndex = Math.min(channels.length - 1, focusedIndex + 1);
      if (ev.key === 'ArrowLeft') focusedIndex = Math.max(0, focusedIndex - 1);
      if (ev.key === 'ArrowDown') focusedIndex = Math.min(channels.length - 1, focusedIndex + 2);
      if (ev.key === 'ArrowUp') focusedIndex = Math.max(0, focusedIndex - 2);
      channels[focusedIndex].focus();
      playHoverTone();
    }
  });

})();


const cursor = document.getElementById('wii-cursor');

document.addEventListener('mousemove', (e) => {
  const x = e.clientX;
  const y = e.clientY;

  // Aplicamos movimiento suavizado
  cursor.style.transform = `translate(${x}px, ${y}px)`;
});


