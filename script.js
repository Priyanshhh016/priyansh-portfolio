/* ─────────────────────────────────────────────
   PRIYANSH SHARMA PORTFOLIO · CLIENT SCRIPT
───────────────────────────────────────────── */
(() => {
  'use strict';

  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 0. TEXTURA-STYLE INTERACTIVE WEBGL FLUID SHADER BACKDROP ──
  const glCanvas = document.getElementById('webgl-canvas');
  if (glCanvas) {
    const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
    if (gl) {
      const vsSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_time;
        uniform float u_scroll;

        // Modulo & Permutation Helpers for Simplex Noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187,
                              0.366025403784439,
                             -0.577350269189626,
                              0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        // Domain-warped Fractal Brownian Motion (Performance Optimized: 2 Octaves)
        float fbm(vec2 p) {
          float value = 0.0;
          float amp = 0.55;
          mat2 rot = mat2(cos(0.52), sin(0.52), -sin(0.52), cos(0.52));
          for (int i = 0; i < 2; i++) {
            value += amp * snoise(p);
            p = rot * p * 2.05 + vec2(100.0);
            amp *= 0.5;
          }
          return value;
        }

        void main() {
          vec2 st = gl_FragCoord.xy / u_resolution.xy;
          float aspect = u_resolution.x / u_resolution.y;
          vec2 uv = st;
          uv.x *= aspect;

          vec2 mouseUV = u_mouse;
          mouseUV.x *= aspect;

          // Interactive fluid ripple & eddy from cursor (subtle)
          float dist = distance(uv, mouseUV);
          float mouseForce = smoothstep(0.55, 0.0, dist);
          vec2 mouseOffset = (uv - mouseUV) * mouseForce * 0.24;

          // Scroll phase shift
          float scrollShift = u_scroll * 2.2;

          // Multi-layer domain warping for organic liquid motion
          vec2 q = vec2(0.0);
          q.x = fbm(uv + 0.06 * u_time + mouseOffset);
          q.y = fbm(uv + vec2(1.0) + 0.05 * u_time);

          vec2 r = vec2(0.0);
          r.x = fbm(uv + 1.25 * q + vec2(1.7, 9.2) + 0.10 * u_time - vec2(0.0, scrollShift));
          r.y = fbm(uv + 1.25 * q + vec2(8.3, 2.8) + 0.08 * u_time + mouseOffset * 0.5);

          float f = fbm(uv + 1.4 * r + vec2(0.0, scrollShift * 0.6));

          // Unified Luxury Midnight Navy & Warm Amber Aurora Palette
          vec3 deepNavy     = vec3(0.024, 0.035, 0.075); // Deepest Midnight Navy (#060913)
          vec3 slateNavy    = vec3(0.043, 0.067, 0.125); // Rich Slate Navy currents (#0b1120)
          vec3 etherealBlue = vec3(0.090, 0.130, 0.200); // Subtle moonlight indigo
          vec3 warmAmber    = vec3(0.961, 0.620, 0.043); // Prestigious Golden Amber (#f59e0b)
          vec3 softGold     = vec3(0.984, 0.749, 0.141); // Warm Gold highlight (#fbbf24)

          // Calm, elegant midnight navy foundation
          vec3 color = mix(deepNavy, slateNavy, clamp(length(q) * 0.85, 0.0, 1.0));
          color = mix(color, etherealBlue, clamp(r.x * 0.5 + 0.5, 0.0, 1.0) * 0.40);

          // Ethereal golden amber aurora (subtle, warm, prestigious)
          float amberGlow = smoothstep(0.40, 0.85, f) * 0.38;
          color = mix(color, warmAmber, amberGlow);

          // Interactive Cursor Light
          float cursorAura = smoothstep(0.50, 0.0, dist) * 0.18;
          color += softGold * cursorAura;

          // Deep vignette framing the typography and cards
          float vig = 1.0 - smoothstep(0.45, 1.45, length(st - 0.5) * 1.25);
          color *= (vig * 0.88 + 0.12);

          gl_FragColor = vec4(color, 1.0);
        }
      `;

      function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      }

      const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
      if (vs && fs) {
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);

        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          -1, -1,
           1, -1,
          -1,  1,
          -1,  1,
           1, -1,
           1,  1,
        ]), gl.STATIC_DRAW);

        const aPosLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(aPosLoc);
        gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

        const uResLoc = gl.getUniformLocation(program, 'u_resolution');
        const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
        const uTimeLoc = gl.getUniformLocation(program, 'u_time');
        const uScrollLoc = gl.getUniformLocation(program, 'u_scroll');

        let rawMouseX = window.innerWidth * 0.5;
        let rawMouseY = window.innerHeight * 0.35;
        let smoothMouseX = rawMouseX;
        let smoothMouseY = rawMouseY;
        let targetScroll = 0;
        let smoothScroll = 0;

        window.addEventListener('mousemove', e => {
          rawMouseX = e.clientX;
          rawMouseY = e.clientY;
        }, { passive: true });

        window.addEventListener('scroll', () => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight || 1;
          targetScroll = Math.max(0, Math.min(1, window.scrollY / maxScroll));
        }, { passive: true });

        // Ultra-efficient downsampling: fluid gradients look softer and save 85% GPU fill rate
        function resizeGL() {
          const scale = 0.38;
          glCanvas.width = Math.max(320, Math.round(window.innerWidth * scale));
          glCanvas.height = Math.max(200, Math.round(window.innerHeight * scale));
          gl.viewport(0, 0, glCanvas.width, glCanvas.height);
          gl.uniform2f(uResLoc, glCanvas.width, glCanvas.height);
        }
        window.addEventListener('resize', resizeGL, { passive: true });
        resizeGL();

        const startTime = performance.now();
        function renderGL(now) {
          const time = (now - startTime) * 0.00065;
          
          smoothMouseX += (rawMouseX - smoothMouseX) * 0.06;
          smoothMouseY += (rawMouseY - smoothMouseY) * 0.06;
          smoothScroll += (targetScroll - smoothScroll) * 0.08;

          const normMX = smoothMouseX / window.innerWidth;
          const normMY = 1.0 - (smoothMouseY / window.innerHeight);

          gl.uniform2f(uMouseLoc, normMX, normMY);
          gl.uniform1f(uTimeLoc, time);
          gl.uniform1f(uScrollLoc, smoothScroll);

          gl.drawArrays(gl.TRIANGLES, 0, 6);
          requestAnimationFrame(renderGL);
        }
        requestAnimationFrame(renderGL);
      }
    }
  }

  // ── 1. ULTRA-LIGHTWEIGHT STATIC NOISE BUFFER (0% CPU, 0 REPAINTS) ──
  const noiseCanvas = document.getElementById('noise-canvas');
  if (noiseCanvas) {
    const ctx = noiseCanvas.getContext('2d');
    
    // Create off-screen 160x160 random grain tile
    const tile = document.createElement('canvas');
    tile.width = 160;
    tile.height = 160;
    const tCtx = tile.getContext('2d');
    const tImg = tCtx.createImageData(160, 160);
    const d = tImg.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    }
    tCtx.putImageData(tImg, 0, 0);

    function resizeNoise() {
      noiseCanvas.width = window.innerWidth;
      noiseCanvas.height = window.innerHeight;
      const pattern = ctx.createPattern(tile, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, noiseCanvas.width, noiseCanvas.height);
      }
    }

    window.addEventListener('resize', resizeNoise, { passive: true });
    resizeNoise();
  }

  // ── 2. FLUID CUSTOM CURSOR (DESKTOP ONLY) ──
  const ring = document.getElementById('cursor-ring');
  const dot = document.getElementById('cursor-dot');
  
  if (ring && dot && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let isMoving = false;

    window.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
      
      if (!isMoving) {
        document.body.classList.add('cursor-active');
        ringX = mouseX;
        ringY = mouseY;
        isMoving = true;
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-active');
      isMoving = false;
    });

    // Lerp loop for silky ring drag
    function renderCursor() {
      if (isMoving) {
        ringX += (mouseX - ringX) * 0.16;
        ringY += (mouseY - ringY) * 0.16;
        ring.style.left = `${ringX}px`;
        ring.style.top = `${ringY}px`;
      }
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Click and Magnetic Hover States
    window.addEventListener('mousedown', () => document.body.classList.add('cursor-clicked'));
    window.addEventListener('mouseup', () => document.body.classList.remove('cursor-clicked'));

    const hoverSelectors = 'a, button, .pill, .project-visual, .project-action-btn, .modal-close, .nav-logo, .nav-link, .nav-cta';
    document.querySelectorAll(hoverSelectors).forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  // ── 3. DYNAMIC NAVIGATION ON SCROLL ──
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      mobileToggle.classList.toggle('active', isOpen);
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  // ── 3.5. DYNAMIC HERO PERSPECTIVE & SMOOTH PARALLAX ──
  const heroSection = document.getElementById('hero');
  const heroName = document.getElementById('hero-name');

  if (heroSection && heroName) {
    let targetScroll = window.scrollY;
    let smoothScroll = targetScroll;
    let mouseTargetX = 0, mouseTargetY = 0;
    let smoothMouseX = 0, smoothMouseY = 0;

    window.addEventListener('scroll', () => {
      targetScroll = window.scrollY;
    }, { passive: true });

    let heroRect = null;
    heroSection.addEventListener('mouseenter', () => {
      heroRect = heroSection.getBoundingClientRect();
    });

    heroSection.addEventListener('mousemove', e => {
      if (!heroRect) heroRect = heroSection.getBoundingClientRect();
      mouseTargetX = ((e.clientX - heroRect.left) / heroRect.width - 0.5) * 2;
      mouseTargetY = ((e.clientY - heroRect.top) / heroRect.height - 0.5) * 2;
    }, { passive: true });

    heroSection.addEventListener('mouseleave', () => {
      mouseTargetX = 0;
      mouseTargetY = 0;
      heroRect = null;
    });

    let heroLoopActive = true;
    function updateHeroKinematics() {
      smoothScroll += (targetScroll - smoothScroll) * 0.1;
      smoothMouseX += (mouseTargetX - smoothMouseX) * 0.06;
      smoothMouseY += (mouseTargetY - smoothMouseY) * 0.06;

      const heroHeight = heroSection.offsetHeight || window.innerHeight;
      const progress = Math.max(0, Math.min(1.2, smoothScroll / (heroHeight * 0.85)));

      // Subtle, elegant 3D perspective tilt
      const rotX = -smoothMouseY * 4;
      const rotY = smoothMouseX * 4;
      const transY = -smoothScroll * 0.20;
      const scale = Math.max(0.88, 1 - progress * 0.10);
      
      const opacity = progress > 0.7 ? Math.max(0, 1 - (progress - 0.7) * 2.5) : 1;

      heroName.style.transform = `translate3d(0, ${transY.toFixed(1)}px, 0) scale3d(${scale.toFixed(3)}, ${scale.toFixed(3)}, 1) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      heroName.style.opacity = opacity.toFixed(2);

      // Only schedule next frame if near hero section
      if (window.scrollY < heroHeight * 1.4) {
        requestAnimationFrame(updateHeroKinematics);
      } else {
        heroLoopActive = false;
      }
    }
    requestAnimationFrame(updateHeroKinematics);

    window.addEventListener('scroll', () => {
      const heroHeight = heroSection.offsetHeight || window.innerHeight;
      if (!heroLoopActive && window.scrollY < heroHeight * 1.4) {
        heroLoopActive = true;
        requestAnimationFrame(updateHeroKinematics);
      }
    }, { passive: true });
  }

  // ── 4. SCROLL REVEAL OBSERVER ──
  const revealTargets = [
    '.section-header',
    '.project-block',
    '.about-grid',
    '.contact-inner'
  ];

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, index) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${index * 0.06}s`;
      revealObserver.observe(el);
    });
  });

  // ── 5. PROJECT DATA & ARCHITECTURE MODAL ──
  const projectDatabase = {
    hand: {
      badge: "WORKED ON THIS · VERIFIED BUILD",
      title: "Mimicking Robotic Hand",
      overview: "A custom 3D-printed bionic forearm and articulated mechanical hand engineered by Priyansh Sharma. Features tendon-driven finger linkage actuated by precision servo motors, translating real-time wearable glove gestures into synchronized physical grip kinematics.",
      components: [
        "Custom 3D-Printed Bionic Forearm & Palm Chassis",
        "Articulated 5-DOF Tendon Linkage Digits (ABS/PLA)",
        "Precision High-Torque Micro Servos (x5)",
        "Wearable Gesture Sensor Glove Integration",
        "Multi-Channel PWM Servo Controller Bus",
        "Tension Return Springs & Pivot Pins",
        "Regulated 5V / 4A High-Current DC Bus"
      ],
      highlights: "Physical prototype fabricated with stainless steel fastener joints, internal nylon tendon routing, and custom-toleranced mechanical linkage. Achieves rapid gesture replication with high mechanical durability."
    },
    rover: {
      badge: "WORKED ON THIS · VERIFIED BUILD",
      title: "Terrain X · Tracked Mobile Rover",
      overview: "A heavy-duty continuous-track mobile robotics platform engineered by Priyansh Sharma & Yashi Mishra at Manipal University Jaipur. Designed for high stability across rough terrain, search and rescue, and industrial telemetry.",
      components: [
        "Raspberry Pi 3 Model B (Embedded Linux Core)",
        "Arduino Mega Microcontroller",
        "Dual 37-555 High-Torque DC Geared Motors",
        "Continuous Steel Track Chain Drive Assembly",
        "12V High-Discharge Rechargeable Battery Bus",
        "Foldable Protective Aluminum/Alloy Chassis",
        "Wireless Telemetry Bridge & Motor Driver Board"
      ],
      highlights: "Designed specifically for uneven terrain where wheeled rovers struggle. Powered by dual high-torque 37-555 geared DC motors driving steel chain tracks, governed through a dual-stage computational architecture (Raspberry Pi 3 + Arduino Mega)."
    },
    sealed: {
      badge: "CURRENTLY IN PROGRESS · STRICTLY CONFIDENTIAL // SEALED",
      title: "Confidential Robotics Initiative",
      overview: "A proprietary robotics and physical computing initiative currently in active development by Priyansh Sharma. Under strict non-disclosure and intellectual property safeguards, all technical specifications, component selections, and operational telemetry remain completely sealed.",
      components: [
        "[SEALED // CLASSIFIED HARDWARE]",
        "[SEALED // EMBEDDED REAL-TIME CORE]",
        "[SEALED // CONTROL & ACTUATION PIPELINE]",
        "[SEALED // PROPRIETARY SUBSYSTEMS]"
      ],
      highlights: "ALL INFORMATION SEALED: This system is in active stealth development. No public schematics, architectural details, or demonstration media will be released prior to the final project launch and official unveiling. All details remain strictly confidential and sealed until the end."
    }
  };

  const modal = document.getElementById('project-modal');
  const modalClose = document.getElementById('modal-close');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalBadge = document.getElementById('modal-badge');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  function openProjectModal(projectId) {
    const data = projectDatabase[projectId];
    if (!data || !modal) return;

    modalBadge.textContent = data.badge;
    modalTitle.textContent = data.title;

    modalBody.innerHTML = `
      <div class="modal-section">
        <div class="modal-subtitle">Project Overview</div>
        <p class="modal-text">${data.overview}</p>
      </div>

      <div class="modal-section">
        <div class="modal-subtitle">Primary Hardware Architecture</div>
        <div class="modal-chip-grid">
          ${data.components.map(comp => `<span class="modal-chip">${comp}</span>`).join('')}
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-subtitle">Implementation Notes & Status</div>
        <p class="modal-text">${data.highlights}</p>
      </div>
    `;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.project-action-btn[data-project]').forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.preventDefault();
      const pid = trigger.getAttribute('data-project');
      openProjectModal(pid);
    });
  });

  document.querySelectorAll('.project-visual[data-project]').forEach(vis => {
    let startX = 0, startY = 0;
    vis.addEventListener('pointerdown', e => {
      startX = e.clientX;
      startY = e.clientY;
    });
    vis.addEventListener('click', e => {
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist < 6) {
        e.preventDefault();
        const pid = vis.getAttribute('data-project');
        openProjectModal(pid);
      }
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeProjectModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeProjectModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeProjectModal();
    }
  });

  // ── 7. THREE.JS 3D INTERACTIVE ROBOTICS SUITE ──
  if (typeof THREE !== 'undefined') {
    // Shared interaction controller for 3D canvases
    function setup3DViewer(canvas, buildSceneCallback, isHero = false) {
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 300;
      const height = rect.height || 300;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0, 9);

      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);

      // Create a pivot group that handles rotation
      const pivot = new THREE.Group();
      scene.add(pivot);

      // Call builder to populate pivot & scene
      const customUpdate = buildSceneCallback(scene, pivot, camera, renderer);

      // Drag to rotate with smooth inertia
      let isDragging = false;
      let prevPointerX = 0;
      let prevPointerY = 0;
      let targetRotX = pivot.rotation.x || 0;
      let targetRotY = pivot.rotation.y || 0;
      const autoRotSpeedY = 0.007;

      // Mouse hover tracking for subtle parallax
      let hoverTiltX = 0;
      let hoverTiltY = 0;

      const onPointerDown = (e) => {
        isDragging = true;
        prevPointerX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        prevPointerY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        canvas.style.cursor = 'grabbing';
      };

      const onWindowPointerMove = (e) => {
        if (!isDragging) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        const deltaX = clientX - prevPointerX;
        const deltaY = clientY - prevPointerY;

        targetRotY += deltaX * 0.012;
        targetRotX += deltaY * 0.012;
        targetRotX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, targetRotX));

        prevPointerX = clientX;
        prevPointerY = clientY;
      };

      const onCanvasHover = (e) => {
        if (isDragging) return;
        const w = canvas.clientWidth || 300;
        const h = canvas.clientHeight || 300;
        const normX = ((e.offsetX / w) - 0.5) * 2;
        const normY = ((e.offsetY / h) - 0.5) * 2;
        hoverTiltY = normX * 0.22;
        hoverTiltX = -normY * 0.22;
      };

      const onCanvasLeave = () => {
        hoverTiltX = 0;
        hoverTiltY = 0;
      };

      const onPointerUp = () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
      };

      canvas.addEventListener('mousedown', onPointerDown);
      canvas.addEventListener('mousemove', onCanvasHover, { passive: true });
      canvas.addEventListener('mouseleave', onCanvasLeave, { passive: true });
      window.addEventListener('mousemove', onWindowPointerMove, { passive: true });
      window.addEventListener('mouseup', onPointerUp);

      canvas.addEventListener('touchstart', onPointerDown, { passive: true });
      canvas.addEventListener('touchmove', onWindowPointerMove, { passive: true });
      canvas.addEventListener('touchend', onPointerUp);

      // Resize observer & handler
      function onResize() {
        const r = canvas.getBoundingClientRect();
        const w = r.width || 300;
        const h = r.height || 300;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
      window.addEventListener('resize', onResize, { passive: true });

      // Performance: Intersection Observer to pause rendering when off-screen
      let isVisible = true;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.05 });
      observer.observe(canvas);

      let lastTime = performance.now();
      let smoothHeroScroll = 0;

      function animate(now) {
        requestAnimationFrame(animate);
        if (!isVisible) return;

        const delta = Math.min((now - lastTime) * 0.001, 0.1);
        lastTime = now;

        if (!isDragging && !prefersReducedMotion) {
          targetRotY += autoRotSpeedY;
        }

        // Inertial damping
        pivot.rotation.y += (targetRotY + hoverTiltY - pivot.rotation.y) * 0.08;
        pivot.rotation.x += (targetRotX + hoverTiltX - pivot.rotation.x) * 0.08;

        if (isHero) {
          const heroElem = document.getElementById('hero');
          const heroH = heroElem ? (heroElem.offsetHeight || window.innerHeight) : window.innerHeight;
          const targetHeroProgress = Math.max(0, Math.min(1.0, window.scrollY / (heroH * 0.8)));
          smoothHeroScroll += (targetHeroProgress - smoothHeroScroll) * 0.09;
        }

        if (customUpdate) {
          customUpdate(now * 0.001, delta, smoothHeroScroll);
        }

        renderer.render(scene, camera);
      }
      requestAnimationFrame(animate);
    }



    // ── SCENE 1: ROBOTIC HAND (5-DOF ARTICULATED LINKAGE) ──
    const handCanvas = document.getElementById('canvas-3d-hand');
    if (handCanvas) {
      setup3DViewer(handCanvas, (scene, pivot, camera) => {
        camera.position.set(0, 0, 7.8);
        pivot.position.y = -1.2;

        // Lights
        const amb = new THREE.AmbientLight(0x475569, 1.4);
        scene.add(amb);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
        dirLight.position.set(4, 8, 6);
        scene.add(dirLight);
        const amberLight = new THREE.PointLight(0xf59e0b, 2.8, 20);
        amberLight.position.set(-3, -2, 4);
        scene.add(amberLight);

        // Materials
        const darkMetal = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.85,
          roughness: 0.3
        });
        const goldServo = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.9,
          roughness: 0.2,
          emissive: 0x92400e,
          emissiveIntensity: 0.3
        });
        const chromeRod = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.95,
          roughness: 0.15
        });

        // Forearm / Wrist base
        const wristBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 1.2, 24), darkMetal);
        wristBase.position.y = -0.5;
        pivot.add(wristBase);

        const wristJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.3, 24), goldServo);
        wristJoint.position.y = 0.2;
        pivot.add(wristJoint);

        // Palm Chassis
        const palm = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.9, 0.45), darkMetal);
        palm.position.y = 1.35;
        pivot.add(palm);

        // Palm Circuit / Telemetry Plate
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.05), goldServo);
        pcb.position.set(0, 1.35, 0.25);
        pivot.add(pcb);

        // Create 5 articulated fingers
        // Finger specs: [xOffset, baseAngle, seg1Len, seg2Len, isThumb]
        const fingerConfigs = [
          { x: -1.05, rotZ: 0.55, yBase: 0.7, s1: 0.7, s2: 0.6, isThumb: true },  // Thumb
          { x: -0.72, rotZ: 0.05, yBase: 2.3, s1: 0.85, s2: 0.65, isThumb: false }, // Index
          { x: -0.24, rotZ: 0.0, yBase: 2.35, s1: 0.95, s2: 0.75, isThumb: false }, // Middle
          { x: 0.26, rotZ: -0.04, yBase: 2.3, s1: 0.85, s2: 0.65, isThumb: false }, // Ring
          { x: 0.75, rotZ: -0.12, yBase: 2.2, s1: 0.7, s2: 0.55, isThumb: false }   // Pinky
        ];

        const fingerHierarchies = [];

        fingerConfigs.forEach((cfg, idx) => {
          const rootGroup = new THREE.Group();
          rootGroup.position.set(cfg.x, cfg.yBase, 0);
          rootGroup.rotation.z = cfg.rotZ;
          pivot.add(rootGroup);

          // Knuckle servo
          const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.32, 16), goldServo);
          knuckle.rotation.z = Math.PI / 2;
          rootGroup.add(knuckle);

          // Proximal Joint Pivot (rotates on X)
          const proximalPivot = new THREE.Group();
          rootGroup.add(proximalPivot);

          // Proximal Segment
          const seg1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, cfg.s1, 0.3), darkMetal);
          seg1.position.y = cfg.s1 / 2;
          proximalPivot.add(seg1);

          // Chrome tendon wire
          const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, cfg.s1, 8), chromeRod);
          wire.position.set(0, cfg.s1 / 2, 0.18);
          proximalPivot.add(wire);

          // Intermediate Knuckle Joint Pivot
          const distalPivot = new THREE.Group();
          distalPivot.position.y = cfg.s1;
          proximalPivot.add(distalPivot);

          const interKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), goldServo);
          distalPivot.add(interKnuckle);

          // Distal Segment (Fingertip)
          const seg2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, cfg.s2, 0.26), darkMetal);
          seg2.position.y = cfg.s2 / 2;
          distalPivot.add(seg2);

          // Fingertip Sensor Cap
          const tip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.22), goldServo);
          tip.position.y = cfg.s2;
          distalPivot.add(tip);

          fingerHierarchies.push({ proximal: proximalPivot, distal: distalPivot, cfg, idx });
        });

        return (time) => {
          // Synchronized flexion & wave bio-robotic motion
          fingerHierarchies.forEach(({ proximal, distal, cfg, idx }) => {
            const wave = Math.sin(time * 2.2 + idx * 0.55);
            const flexAmount = (wave + 1) * 0.5; // 0 to 1
            if (cfg.isThumb) {
              proximal.rotation.x = 0.2 + flexAmount * 0.7;
              proximal.rotation.y = -flexAmount * 0.5;
              distal.rotation.x = flexAmount * 0.9;
            } else {
              proximal.rotation.x = flexAmount * 1.1;
              distal.rotation.x = flexAmount * 1.2;
            }
          });

          // Gentle wrist breathing motion
          wristJoint.rotation.y = Math.sin(time * 1.2) * 0.12;
        };
      });
    }

    // ── SCENE 2: TRACKED ROVER PLATFORM ──
    const roverCanvas = document.getElementById('canvas-3d-rover');
    if (roverCanvas) {
      setup3DViewer(roverCanvas, (scene, pivot, camera) => {
        camera.position.set(0, 1.8, 6.2);
        camera.lookAt(0, 0, 0);
        pivot.rotation.x = 0.35;
        pivot.rotation.y = -0.55;

        // Lights
        const amb = new THREE.AmbientLight(0x475569, 1.3);
        scene.add(amb);
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
        keyLight.position.set(5, 7, 5);
        scene.add(keyLight);
        const amberLight = new THREE.PointLight(0xf59e0b, 3.0, 18);
        amberLight.position.set(0, -1, 3);
        scene.add(amberLight);

        // Materials
        const chassisMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          metalness: 0.85,
          roughness: 0.35
        });
        const goldMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.9,
          roughness: 0.25
        });
        const trackMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.7,
          roughness: 0.6
        });
        const lensMat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.4,
          roughness: 0.1
        });
        const pcbMat = new THREE.MeshStandardMaterial({
          color: 0x064e3b,
          metalness: 0.4,
          roughness: 0.5
        });

        // Main Rover Chassis
        const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 3.2), chassisMat);
        pivot.add(hull);

        // Raspberry Pi Deck Plate
        const rpiPlate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.2), pcbMat);
        rpiPlate.position.set(0, 0.4, 0.1);
        pivot.add(rpiPlate);

        // USB & Ethernet port blocks
        const portBlock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.5), goldMat);
        portBlock.position.set(-0.55, 0.55, -0.7);
        pivot.add(portBlock);

        // GPIO Pin Header strip
        const gpioStrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 1.4), goldMat);
        gpioStrip.position.set(0.65, 0.5, 0.2);
        pivot.add(gpioStrip);

        // Track Assemblies (Left and Right)
        const trackTreadMeshes = [];
        const bogieWheels = [];

        [-1.3, 1.3].forEach((xSide) => {
          // Track side structural plate
          const sidePlate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 3.4), chassisMat);
          sidePlate.position.set(xSide, -0.2, 0);
          pivot.add(sidePlate);

          // Wheels (Front sprocket, Rear sprocket, 3 idler bogies)
          const wheelZOffsets = [-1.4, -0.7, 0, 0.7, 1.4];
          wheelZOffsets.forEach((zPos, wIdx) => {
            const isSprocket = (wIdx === 0 || wIdx === 4);
            const r = isSprocket ? 0.48 : 0.42;
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 20), goldMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(xSide, -0.2, zPos);
            pivot.add(wheel);
            bogieWheels.push(wheel);
          });

          // Track tread perimeter segments
          const treadCount = 18;
          for (let i = 0; i < treadCount; i++) {
            const tread = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.24), trackMat);
            pivot.add(tread);
            trackTreadMeshes.push({ mesh: tread, xSide, index: i, total: treadCount });
          }
        });

        // Pan-Tilt Camera / LiDAR Sensor Turret
        const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.25, 20), goldMat);
        turretBase.position.set(0, 0.55, 0.6);
        pivot.add(turretBase);

        const turretHead = new THREE.Group();
        turretHead.position.set(0, 0.75, 0.6);
        pivot.add(turretHead);

        const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), chassisMat);
        turretHead.add(camBox);

        // Glowing Optical Lens / LiDAR sensor
        const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.2, 16), lensMat);
        camLens.rotation.x = Math.PI / 2;
        camLens.position.set(0, 0, 0.3);
        turretHead.add(camLens);

        // Antenna with amber tip
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.4, 8), goldMat);
        antenna.position.set(0.65, 1.15, -0.9);
        antenna.rotation.x = -0.15;
        pivot.add(antenna);

        return (time) => {
          // Track bogie rotation
          bogieWheels.forEach(w => {
            w.rotation.x -= 0.06;
          });

          // Continuous Track Tread Belt kinematics along stadium oval
          trackTreadMeshes.forEach(item => {
            const t = (item.index / item.total + time * 0.25) % 1.0;
            // Oval perimeter path around wheels
            let y, z;
            if (t < 0.35) {
              const p = t / 0.35;
              z = 1.4 - p * 2.8;
              y = 0.28;
            } else if (t < 0.5) {
              const p = (t - 0.35) / 0.15;
              const angle = Math.PI * 0.5 + p * Math.PI;
              z = -1.4 + Math.cos(angle) * 0.48;
              y = -0.2 + Math.sin(angle) * 0.48;
            } else if (t < 0.85) {
              const p = (t - 0.5) / 0.35;
              z = -1.4 + p * 2.8;
              y = -0.68;
            } else {
              const p = (t - 0.85) / 0.15;
              const angle = -Math.PI * 0.5 + p * Math.PI;
              z = 1.4 + Math.cos(angle) * 0.48;
              y = -0.2 + Math.sin(angle) * 0.48;
            }
            item.mesh.position.set(item.xSide, y, z);
          });

          // Turret radar sweeping
          turretHead.rotation.y = Math.sin(time * 1.5) * 0.65;
          turretHead.rotation.x = Math.sin(time * 2.0) * 0.15;
        };
      });
    }

    // ── SCENE 3: BORDER SURVEILLANCE MESH NETWORK ──
    const meshCanvas = document.getElementById('canvas-3d-mesh');
    if (meshCanvas) {
      setup3DViewer(meshCanvas, (scene, pivot, camera) => {
        camera.position.set(0, 1.2, 7.5);
        camera.lookAt(0, 0, 0);

        // Lights
        const amb = new THREE.AmbientLight(0x475569, 1.2);
        scene.add(amb);
        const amberPoint = new THREE.PointLight(0xf59e0b, 3.5, 20);
        amberPoint.position.set(0, 1, 0);
        scene.add(amberPoint);

        // Materials
        const darkTitanium = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.9,
          roughness: 0.3
        });
        const goldNode = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.85,
          roughness: 0.25,
          emissive: 0xb45309,
          emissiveIntensity: 0.5
        });
        const pulseWaveMat1 = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          wireframe: true,
          transparent: true,
          opacity: 0.4
        });
        const pulseWaveMat2 = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.3
        });

        // Central Edge Gateway Unit (Raspberry Pi Hub)
        const gatewayGroup = new THREE.Group();
        pivot.add(gatewayGroup);

        const hub = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 1.2), darkTitanium);
        gatewayGroup.add(hub);

        const hubPlate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), goldNode);
        hubPlate.position.y = 0.4;
        gatewayGroup.add(hubPlate);

        // Central High-Gain LoRa Omni Antenna
        const antennaMast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.8, 16), goldNode);
        antennaMast.position.y = 1.3;
        gatewayGroup.add(antennaMast);

        // 5 Distributed Satellite Sensor Nodes (ESP32-S3)
        const satelliteNodes = [];
        const nodePositions = [
          { r: 2.8, angle: 0.2, y: 0.6, speed: 0.8 },
          { r: 3.3, angle: 1.4, y: -0.8, speed: 1.1 },
          { r: 3.0, angle: 2.6, y: 0.9, speed: 0.9 },
          { r: 3.5, angle: 3.9, y: -0.5, speed: 1.2 },
          { r: 2.7, angle: 5.2, y: 0.4, speed: 0.7 }
        ];

        nodePositions.forEach(cfg => {
          const nodeGroup = new THREE.Group();
          const nodeBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.45), darkTitanium);
          nodeGroup.add(nodeBox);

          const led = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), goldNode);
          led.position.set(0, 0.2, 0);
          nodeGroup.add(led);

          const whip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8), goldNode);
          whip.position.set(0.2, 0.45, 0);
          nodeGroup.add(whip);

          pivot.add(nodeGroup);
          satelliteNodes.push({ group: nodeGroup, cfg });
        });

        // Telemetry Laser Link Lines
        const lineGeo = new THREE.BufferGeometry();
        const linePositions = new Float32Array(5 * 2 * 3);
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const lineMat = new THREE.LineBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.6
        });
        const telemetryLines = new THREE.LineSegments(lineGeo, lineMat);
        pivot.add(telemetryLines);

        // Data Packets traveling along links
        const packetGeo = new THREE.SphereGeometry(0.07, 12, 12);
        const packetMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
        const packets = satelliteNodes.map(() => {
          const p = new THREE.Mesh(packetGeo, packetMat);
          pivot.add(p);
          return p;
        });

        // Expanding Geodesic Spherical LoRa Wave Pulses
        const wave1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), pulseWaveMat1);
        pivot.add(wave1);
        const wave2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), pulseWaveMat2);
        pivot.add(wave2);

        return (time) => {
          // Animate satellite nodes positions and update telemetry line coords
          const posAttr = lineGeo.attributes.position;
          const posArray = posAttr.array;

          satelliteNodes.forEach((node, i) => {
            const currentAngle = node.cfg.angle + time * 0.12;
            const x = Math.cos(currentAngle) * node.cfg.r;
            const z = Math.sin(currentAngle) * node.cfg.r;
            const y = node.cfg.y + Math.sin(time * node.cfg.speed + i) * 0.25;

            node.group.position.set(x, y, z);
            node.group.lookAt(0, 0, 0);

            // Line from central gateway (0, 0.4, 0) to node
            const baseIdx = i * 6;
            posArray[baseIdx] = 0;
            posArray[baseIdx + 1] = 0.4;
            posArray[baseIdx + 2] = 0;

            posArray[baseIdx + 3] = x;
            posArray[baseIdx + 4] = y;
            posArray[baseIdx + 5] = z;

            // Packet travels from node into hub
            const packetProg = (time * 0.6 + i * 0.2) % 1.0;
            packets[i].position.set(
              x * (1 - packetProg),
              y * (1 - packetProg) + 0.4 * packetProg,
              z * (1 - packetProg)
            );
          });

          posAttr.needsUpdate = true;

          // Expanding LoRa RF radio waves
          const s1 = (time * 0.5) % 1.0;
          wave1.scale.set(0.5 + s1 * 3.6, 0.5 + s1 * 3.6, 0.5 + s1 * 3.6);
          pulseWaveMat1.opacity = Math.max(0, (1 - s1) * 0.55);

          const s2 = (time * 0.5 + 0.5) % 1.0;
          wave2.scale.set(0.5 + s2 * 3.6, 0.5 + s2 * 3.6, 0.5 + s2 * 3.6);
          pulseWaveMat2.opacity = Math.max(0, (1 - s2) * 0.45);
        };
      });
    }

    // ── SCENE 4: PROJECT PBSM (CONFIDENTIAL CLASSIFIED CORE) ──
    const pbsmCanvas = document.getElementById('canvas-3d-pbsm');
    if (pbsmCanvas) {
      setup3DViewer(pbsmCanvas, (scene, pivot, camera) => {
        camera.position.set(0, 0, 7.8);
        camera.lookAt(0, 0, 0);

        // Ambient & Accent Lights
        const amb = new THREE.AmbientLight(0x475569, 1.2);
        scene.add(amb);
        const redBeacon = new THREE.PointLight(0xef4444, 2.5, 15);
        redBeacon.position.set(2, 2, 2);
        scene.add(redBeacon);
        const amberLight = new THREE.PointLight(0xf59e0b, 3.8, 18);
        amberLight.position.set(-2, -1, 3);
        scene.add(amberLight);

        // Materials
        const darkMetal = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          metalness: 0.95,
          roughness: 0.2
        });
        const goldAccent = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.85,
          roughness: 0.25,
          emissive: 0xb45309,
          emissiveIntensity: 0.6
        });
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0x111827,
          metalness: 0.9,
          roughness: 0.15,
          emissive: 0xd97706,
          emissiveIntensity: 0.35
        });
        const wireRingMat1 = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          wireframe: true,
          transparent: true,
          opacity: 0.5
        });
        const cageMat = new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          wireframe: true,
          transparent: true,
          opacity: 0.3
        });

        // Classified Inner Polyhedral Core
        const coreGeo = new THREE.DodecahedronGeometry(1.2, 0);
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        pivot.add(coreMesh);

        // Concentric Gimbal Containment Rings
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.05, 12, 48), darkMetal);
        pivot.add(ring1);
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.04, 12, 48), goldAccent);
        pivot.add(ring2);
        const ring3 = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.03, 12, 48), wireRingMat1);
        pivot.add(ring3);

        // Encrypted Shielding Polyhedron Shell
        const cageGeo = new THREE.IcosahedronGeometry(3.3, 1);
        const cageMesh = new THREE.Mesh(cageGeo, cageMat);
        pivot.add(cageMesh);

        // Orbital Encrypted Data Beacons
        const beaconCount = 6;
        const beaconGroup = new THREE.Group();
        pivot.add(beaconGroup);
        const beaconMeshes = [];
        const beaconGeo = new THREE.OctahedronGeometry(0.14, 0);
        for (let i = 0; i < beaconCount; i++) {
          const bMat = new THREE.MeshBasicMaterial({ color: (i % 2 === 0) ? 0xf59e0b : 0xef4444 });
          const b = new THREE.Mesh(beaconGeo, bMat);
          beaconGroup.add(b);
          beaconMeshes.push(b);
        }

        return (time) => {
          // Complex gimbal rotations
          ring1.rotation.x = time * 0.4;
          ring1.rotation.y = time * 0.25;

          ring2.rotation.y = time * 0.35;
          ring2.rotation.z = time * 0.45;

          ring3.rotation.x = -time * 0.3;
          ring3.rotation.z = time * 0.2;

          // Inner core breathing & slow tumbling
          coreMesh.rotation.x = time * 0.2;
          coreMesh.rotation.y = time * 0.28;
          const pulse = 1.0 + Math.sin(time * 2.0) * 0.06;
          coreMesh.scale.set(pulse, pulse, pulse);

          // Outer security cage counter-rotation
          cageMesh.rotation.x = -time * 0.12;
          cageMesh.rotation.y = -time * 0.15;

          // Orbiting security data beacons
          beaconMeshes.forEach((bm, i) => {
            const angle = time * 0.5 + (i * (Math.PI * 2 / beaconCount));
            const radius = 2.4 + Math.sin(time + i) * 0.2;
            bm.position.set(
              Math.cos(angle) * radius,
              Math.sin(angle * 1.5) * 0.7,
              Math.sin(angle) * radius
            );
            bm.rotation.x = time * 2;
            bm.rotation.y = time * 2;
          });
        };
      });
    }
  }

  // ── 8. SMOOTH ANCHOR NAVIGATION (NATIVE, RESPONSIVE, ZERO LAG) ──
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      const targetEl = document.querySelector(hash);
      if (targetEl) {
        e.preventDefault();
        const navOffset = 80;
        const targetPos = targetEl.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    });
  });

  // ── 8.5. CYBERNETIC MAGNETIC BUTTON ATTRACTION ──
  if (isFinePointer && !prefersReducedMotion) {
    const magneticButtons = document.querySelectorAll('.btn-primary, .btn-secondary, .nav-cta, .contact-btn, .project-action-btn');
    magneticButtons.forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const offsetX = e.clientX - (rect.left + rect.width / 2);
        const offsetY = e.clientY - (rect.top + rect.height / 2);
        // Magnetic pull toward cursor
        btn.style.transform = `translate3d(${(offsetX * 0.22).toFixed(1)}px, ${(offsetY * 0.22).toFixed(1)}px, 0)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0, 0, 0)';
        btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      });

      btn.addEventListener('mouseenter', () => {
        btn.style.transition = 'transform 0.1s ease-out';
      });
    });
  }

  // ── 9. REACT BITS DYNAMIC CARD SPOTLIGHT TRACKER ──
  document.querySelectorAll('.project-visual-inner, .project-block').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--spotlight-x', `${x.toFixed(1)}%`);
      card.style.setProperty('--spotlight-y', `${y.toFixed(1)}%`);
    });
  });

  // ── 10. ONE-CLICK EMAIL CLIPBOARD COPY HANDLER ──
  const copyBtn = document.getElementById('copy-email-btn');
  if (copyBtn) {
    const copyLabel = document.getElementById('copy-label');
    const copyIcon = document.getElementById('copy-icon');
    const targetEmail = 'priyansh.robotics@gmail.com';

    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(targetEmail);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = targetEmail;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }

        copyBtn.classList.add('copied');
        if (copyLabel) copyLabel.textContent = 'Copied to Clipboard!';
        if (copyIcon) copyIcon.textContent = '✓';

        setTimeout(() => {
          copyBtn.classList.remove('copied');
          if (copyLabel) copyLabel.textContent = 'Copy Email';
          if (copyIcon) copyIcon.textContent = '📋';
        }, 2500);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    });
  }

})();

