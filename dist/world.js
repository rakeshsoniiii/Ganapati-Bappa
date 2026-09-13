import { storyBeats } from './timeline.js?v=story16';
import * as T from './vendor/three.module.js';
import { Water } from './vendor/Water.js';
import { STLLoader } from './vendor/STLLoader.js';
import { mergeVertices } from './vendor/BufferGeometryUtils.js';

export function createWorld(canvas) {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  const dpr = Math.min(devicePixelRatio, innerWidth < 700 ? 1.35 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new T.Scene();
  scene.background = new T.Color(0x040607);
  scene.fog = new T.FogExp2(0x040607, 0.018);

  const camera = new T.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 180);

  // 12 Chapter Roots spaced along Z axis (0 to 11)
  const roots = Array.from({ length: 12 }, (_, i) => {
    const g = new T.Group();
    g.position.z = -i * 42;
    scene.add(g);
    return g;
  });

  // ─── PROCEDURAL MICRO-SURFACE BUMP MAP GENERATOR ───
  function createProceduralTexture(type, size = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        let val = 128;
        if (type === 'hammered') {
          const n1 = Math.sin(x * 0.15) * Math.cos(y * 0.15);
          const n2 = Math.sin(x * 0.35 + y * 0.2) * 0.5;
          const n3 = Math.cos((x - y) * 0.1) * 0.35;
          val = Math.floor(128 + (n1 + n2 + n3) * 55);
        } else if (type === 'stone') {
          const n1 = (Math.random() - 0.5) * 42;
          const n2 = Math.sin(x * 0.08 + y * 0.04) * 22;
          val = Math.floor(128 + n1 + n2);
        } else if (type === 'cloth') {
          const weave = Math.sin(x * 0.5) * 0.5 + Math.sin(y * 0.5) * 0.5;
          val = Math.floor(128 + weave * 38);
        }
        val = Math.max(0, Math.min(255, val));
        d[idx] = val; d[idx + 1] = val; d[idx + 2] = val; d[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new T.CanvasTexture(c);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.repeat.set(type === 'cloth' ? 6 : 4, type === 'cloth' ? 6 : 4);
    return tex;
  }

  // ─── PBR LUXURY MATERIALS (MUSEUM SCULPTURE GRADE) ───
  const gold = new T.MeshStandardMaterial({
    color: 0xb58434, metalness: 0.92, roughness: 0.24
  });
  const paleGold = new T.MeshStandardMaterial({
    color: 0xa18b69, metalness: 0.48, roughness: 0.58
  });
  const darkGold = new T.MeshStandardMaterial({
    color: 0x6e4e1a, metalness: 0.82, roughness: 0.32
  });
  const antiqueBronze = new T.MeshStandardMaterial({
    color: 0x7a5632, metalness: 0.85, roughness: 0.36
  });
  const ivory = new T.MeshStandardMaterial({
    color: 0xf3e8d6, metalness: 0.08, roughness: 0.38
  });
  const modakCream = new T.MeshStandardMaterial({
    color: 0xfcf5e8, metalness: 0.08, roughness: 0.28
  });
  const obsidian = new T.MeshStandardMaterial({
    color: 0x252b2c, metalness: 0.02, roughness: 0.87
  });
  const stoneGray = new T.MeshStandardMaterial({
    color: 0x1d2729, metalness: 0.28, roughness: 0.65
  });
  const crimson = new T.MeshStandardMaterial({
    color: 0x90160a, metalness: 0.25, roughness: 0.45
  });
  const rubyGem = new T.MeshStandardMaterial({
    color: 0xd91624, metalness: 0.4, roughness: 0.15
  });
  const glow = new T.MeshBasicMaterial({ color: 0xf2c875 });
  const fireGlow = new T.MeshBasicMaterial({ color: 0xff4010 });
  const warmGlow = new T.MeshBasicMaterial({ color: 0xffab3d });

  // Sacred Deity PBR Materials (Museum Bronze & Rock-Cut Stone Patina)
  const shivaSkin = new T.MeshStandardMaterial({
    color: 0x6c808a, metalness: 0.0, roughness: 0.76, side: T.DoubleSide
  });
  const parvatiSkin = new T.MeshStandardMaterial({
    color: 0x9b7155, metalness: 0.0, roughness: 0.78, side: T.DoubleSide
  });
  const sareeCrimson = new T.MeshStandardMaterial({
    color: 0x520a10, metalness: 0.0, roughness: 0.92, side: T.DoubleSide
  });
  const sareeGoldBorder = new T.MeshStandardMaterial({
    color: 0xd4a538, metalness: 0.94, roughness: 0.20, side: T.DoubleSide
  });
  const shaktiArmor = new T.MeshStandardMaterial({
    color: 0x643e35, metalness: 0.0, roughness: 0.8, side: T.DoubleSide
  });
  const tigerSkin = new T.MeshStandardMaterial({
    color: 0x8a6842, metalness: 0.0, roughness: 0.93, side: T.DoubleSide
  });
  const trinetraGlow = new T.MeshBasicMaterial({ color: 0x5ce6ff });
  const chandraSilver = new T.MeshStandardMaterial({
    color: 0xf4f8fc, metalness: 0.96, roughness: 0.10
  });
  const vasukiGreen = new T.MeshStandardMaterial({
    color: 0x14281c, metalness: 0.70, roughness: 0.32
  });

  // Sacred Elephant PBR materials
  const elephantSkin = new T.MeshStandardMaterial({
    color: 0x5a6366, metalness: 0.12, roughness: 0.78
  });
  const elephantIvory = new T.MeshStandardMaterial({
    color: 0xede4ce, metalness: 0.18, roughness: 0.35
  });

  // Himalayan Kailash terrain materials
  const snowCap = new T.MeshStandardMaterial({
    color: 0xdde9f0, metalness: 0.05, roughness: 0.75
  });
  const rockFace = new T.MeshStandardMaterial({
    color: 0x2e383b, metalness: 0.2, roughness: 0.85
  });
  const treeBark = new T.MeshStandardMaterial({
    color: 0x16120e, metalness: 0.08, roughness: 0.92
  });

  const hqSphere = new T.SphereGeometry(1, 48, 36);
  const sphere = new T.SphereGeometry(1, 32, 24);
  const box = new T.BoxGeometry(1, 1, 1);

  function mesh(geo, mat, parent, pos = [0, 0, 0], scale = [1, 1, 1]) {
    const m = new T.Mesh(geo, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    parent.add(m);
    return m;
  }
  function ell(parent, pos, scale, mat = gold) {
    return mesh(sphere, mat, parent, pos, scale);
  }
  function ring(parent, r, t, pos = [0, 0, 0], mat = gold) {
    return mesh(new T.TorusGeometry(r, t, 14, 96), mat, parent, pos);
  }
  function path(parent, points, r1, r2 = r1, mat = gold) {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
    const segments = 48, radial = 14;
    const frames = curve.computeFrenetFrames(segments, false);
    const vertices = [], normals = [], uvs = [], indices = [];
    for (let i = 0; i <= segments; i++) {
      const p = curve.getPointAt(i / segments);
      const r = T.MathUtils.lerp(r1, r2, i / segments);
      for (let j = 0; j <= radial; j++) {
        const a = j / radial * Math.PI * 2;
        const n = frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a));
        vertices.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
        normals.push(n.x, n.y, n.z);
        uvs.push(j / radial, i / segments);
        if (i < segments && j < radial) {
          const k = i * (radial + 1) + j;
          indices.push(k, k + radial + 1, k + 1, k + 1, k + radial + 1, k + radial + 2);
        }
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return mesh(geo, mat, parent);
  }
  function beads(parent, positions, r = 0.045, mat = gold) {
    const inst = new T.InstancedMesh(sphere, mat, positions.length);
    const dummy = new T.Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(...p);
      dummy.scale.setScalar(r);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    parent.add(inst);
    return inst;
  }
  function lathe(parent, pts, mat, pos = [0, 0, 0], scale = [1, 1, 1], segments = 32) {
    const sortedPts = pts[0][1] > pts[pts.length - 1][1] ? [...pts].reverse() : pts;
    const v2s = sortedPts.map(([r, y]) => new T.Vector2(Math.max(0.001, r), y));
    const geo = new T.LatheGeometry(v2s, segments);
    geo.computeVertexNormals();
    return mesh(geo, mat, parent, pos, scale);
  }

  // ─── HALO ───
  function halo(parent, r = 3) {
    const g = new T.Group(); parent.add(g);
    for (let i = 0; i < 5; i++) {
      ring(g, r + i * 0.14, 0.012 + (i === 0 ? 0.005 : 0), [0, 0, -0.12], i % 2 ? glow : gold);
    }
    const pts = [];
    for (let i = 0; i < 72; i++) {
      const a = i / 72 * Math.PI * 2;
      pts.push([Math.cos(a) * (r + 0.55), Math.sin(a) * (r + 0.55), -0.12]);
      const petal = ring(g, 0.18, 0.01, [Math.cos(a) * (r + 0.25), Math.sin(a) * (r + 0.25), -0.12], darkGold);
      petal.scale.set(0.45, 1.5, 1);
      petal.rotation.z = a - Math.PI / 2;
    }
    beads(g, pts, 0.024, glow);
    return g;
  }

  // ─── PEDESTAL ───
  function pedestal(parent) {
    for (let i = 0; i < 5; i++) {
      const topR = 2.15 - i * 0.12, botR = 2.3 - i * 0.12;
      mesh(new T.CylinderGeometry(topR, botR, 0.15, 96), i % 2 ? gold : obsidian, parent, [0, -2.32 + i * 0.15, 0]);
    }
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      const petal = ell(parent, [Math.cos(a) * 1.48, -1.58, Math.sin(a) * 1.48], [0.32, 0.14, 0.6], paleGold);
      petal.rotation.y = -a + Math.PI / 2;
    }
    ring(parent, 1.65, 0.02, [0, -1.72, 0], darkGold).rotation.x = Math.PI / 2;
  }

  // ─── TEMPLE ARCHITECTURE ───
  function temple(parent, depth = -26) {
    for (let z = 4; z >= depth; z -= 7) {
      for (const x of [-5.5, 5.5]) {
        mesh(new T.CylinderGeometry(0.35, 0.50, 10, 24), stoneGray, parent, [x, 2.2, z]);
        for (const [y, topR, botR] of [[-2.8, 0.72, 0.56], [7.0, 0.56, 0.72]]) {
          mesh(new T.CylinderGeometry(topR, botR, 0.32, 24), gold, parent, [x, y, z]);
        }
        for (let y = -1.5; y < 6.5; y += 1.2) {
          ring(parent, 0.40, 0.018, [x, y, z]).rotation.x = Math.PI / 2;
        }
      }
      mesh(box, obsidian, parent, [0, 7.2, z], [12.5, 0.6, 0.8]);
      mesh(box, darkGold, parent, [0, 7.55, z], [12.8, 0.12, 0.85]);
    }
    mesh(box, stoneGray, parent, [0, -2.8, -8], [110, 0.3, 110]);
    for (let z = 4; z > depth + 2; z -= 3.5) {
      mesh(box, darkGold, parent, [0, -2.63, z], [10, 0.008, 0.015]);
    }
  }

  // ─── GANESHA SCULPTURE ───
  const sculptureHolders = [];
  let rebirthDust, farewellDust;
  function ganesha(parent) {
    const g = new T.Group(); parent.add(g);
    pedestal(g);
    const holder = new T.Group();
    g.add(holder);
    sculptureHolders.push(holder);
    return g;
  }

  new STLLoader().load('./assets/ganesha.stl', geometry => {
    geometry.deleteAttribute('normal');
    geometry = mergeVertices(geometry, 0.00001);
    geometry.computeVertexNormals();
    geometry.rotateX(-Math.PI / 2);
    geometry.center();
    geometry.computeBoundingBox();
    const size = new T.Vector3();
    geometry.boundingBox.getSize(size);
    geometry.scale(5.2 / size.y, 5.2 / size.y, 5.2 / size.y);
    geometry.translate(0, 0.88, 0);

    for (const holder of sculptureHolders) {
      mesh(geometry, paleGold, holder);
    }

    const particleMaterial = (isDissolve = false) => new T.ShaderMaterial({
      transparent: true, depthWrite: false,
      blending: T.AdditiveBlending,
      uniforms: { scatter: { value: 0 }, opacity: { value: 1 }, time: { value: 0 } },
      vertexShader: `
        uniform float scatter, time;
        varying float vAlpha;
        void main() {
          float seed = sin(dot(position, vec3(12.9898, 78.233, 45.164))) * 43758.5453;
          vec3 p = position;
          ${isDissolve
            ? `p += vec3(sin(seed*2.0)*1.8, cos(seed*3.0)*2.5 + scatter*7.0, scatter*32.0);`
            : `p += vec3(sin(seed), cos(seed*1.3), sin(seed*0.7)) * scatter * 8.5;`
          }
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp((19.0 + sin(seed + time * 3.0) * 8.0) / -mv.z, 1.0, 4.8);
          vAlpha = 1.0 - smoothstep(0.0, 1.0, scatter * 0.82);
        }`,
      fragmentShader: `
        uniform float opacity;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = (1.0 - smoothstep(0.04, 0.48, d)) * vAlpha * opacity;
          vec3 c = mix(vec3(1.0, 0.85, 0.40), vec3(1.0, 0.52, 0.15), d * 2.0);
          gl_FragColor = vec4(c, a);
        }`
    });

    rebirthDust = new T.Points(geometry, particleMaterial(false));
    reborn.add(rebirthDust);
    farewellDust = new T.Points(geometry, particleMaterial(true));
    farewell.add(farewellDust);

    document.body.classList.add('model-ready');
    document.querySelector('#loading')?.remove();
  }, undefined, error => {
    console.error('Sculpture could not load', error);
    document.body.classList.remove('webgl-ready');
    document.body.classList.add('no-webgl');
    const l = document.querySelector('#loading');
    if (l) l.textContent = '3D unavailable. Showing illustrated edition.';
  });

  // ─────────────────────────────────────────�  // ─── MAA PARVATI (DIVINE MOTHER — CHOLA BRONZE & TEMPLE SCULPTURE) ───
  function createParvati(parent, options = {}) {
    const { mode = 'standing', pos = [0, 0, 0], scale = 1, rotY = 0 } = options;
    const g = new T.Group();
    g.position.set(...pos);
    g.scale.setScalar(scale);
    g.rotation.y = rotY;
    parent.add(g);

    // Double-tier Lotus Altar Pedestal (Padmapitha)
    if (mode !== 'rebirth_side') {
      lathe(g, [[0, -2.25], [0.95, -2.25], [1.02, -2.18], [0.90, -2.05], [0.82, -1.95], [0, -1.95]], darkGold);
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2;
        const pet = ell(g, [Math.cos(a) * 0.82, -2.0, Math.sin(a) * 0.82], [0.18, 0.05, 0.26], paleGold);
        pet.rotation.y = -a + Math.PI / 2;
        pet.rotation.x = -0.15;
      }
      ring(g, 0.84, 0.02, [0, -1.94, 0], sareeGoldBorder).rotation.x = Math.PI / 2;
    }

    // Sacred Tribhanga Posture Group
    const body = new T.Group();
    g.add(body);
    body.rotation.z = -0.035;

    // Pleated Saree Drapery with Fluted Silhouette
    const skirtPts = [
      [0.32, 0.0],
      [0.35, -0.3],
      [0.42, -0.7],
      [0.52, -1.2],
      [0.64, -1.7],
      [0.72, -1.92],
      [0, -1.92]
    ];
    lathe(body, skirtPts, sareeCrimson, [0, 0, 0], [1, 1, 1], 40);

    // Saree gold zari embroidery & central pleat cascade
    ring(body, 0.73, 0.025, [0, -1.90, 0], sareeGoldBorder).rotation.x = Math.PI / 2;
    ring(body, 0.34, 0.022, [0, 0.02, 0], sareeGoldBorder).rotation.x = Math.PI / 2;
    for (let p = -2; p <= 2; p++) {
      path(body, [
        [p * 0.035, 0.02, 0.33],
        [p * 0.055, -0.6, 0.42],
        [p * 0.075, -1.3, 0.52],
        [p * 0.095, -1.9, 0.65]
      ], 0.018, 0.012, sareeGoldBorder);
    }

    // Feminine Sculpted Torso
    const torsoPts = [
      [0, -0.05],
      [0.32, -0.05],
      [0.28, 0.25],
      [0.24, 0.45],
      [0.31, 0.70],
      [0.36, 0.90],
      [0.32, 1.05],
      [0.17, 1.18],
      [0, 1.18]
    ];
    lathe(body, torsoPts, parvatiSkin, [0, 0, 0], [1, 1, 1], 36);

    // Choli gold filigree borders (integrated into torso)
    ring(body, 0.32, 0.016, [0, 0.75, 0], sareeGoldBorder).rotation.x = Math.PI / 2;
    ring(body, 0.34, 0.016, [0, 0.96, 0], sareeGoldBorder).rotation.x = Math.PI / 2;

    // Layered gold necklaces (Haara) draped over collarbone
    for (let i = 0; i < 3; i++) {
      path(body, [
        [-0.18, 1.12 - i * 0.08, 0.12],
        [0, 0.98 - i * 0.10, 0.28 + i * 0.03],
        [0.18, 1.12 - i * 0.08, 0.12]
      ], 0.014 - i * 0.002, 0.014 - i * 0.002, sareeGoldBorder);
    }
    ell(body, [0, 0.74, 0.32], [0.045, 0.07, 0.03], rubyGem);

    // Saree Pallu (flowing diagonal drape over left shoulder)
    path(body, [
      [0.30, 0.02, 0.30], [0.15, 0.50, 0.35], [-0.05, 0.88, 0.30],
      [-0.28, 1.12, 0.15], [-0.38, 0.95, -0.10], [-0.42, 0.30, -0.22],
      [-0.38, -0.60, -0.28], [-0.34, -1.40, -0.32]
    ], 0.14, 0.22, sareeCrimson);
    path(body, [
      [0.32, 0.02, 0.31], [0.16, 0.51, 0.36], [-0.04, 0.89, 0.32],
      [-0.30, 1.14, 0.16], [-0.40, 0.96, -0.09], [-0.44, 0.30, -0.21]
    ], 0.018, 0.018, sareeGoldBorder);

    // Slender Neck with Tri-rekha lines
    lathe(body, [[0, 1.16], [0.15, 1.16], [0.13, 1.34], [0.16, 1.48], [0, 1.48]], parvatiSkin);
    ring(body, 0.15, 0.008, [0, 1.30, 0], sareeGoldBorder).rotation.x = Math.PI / 2;

    // Sculpted Head & Serene Countenance
    const head = new T.Group();
    head.position.set(0, 1.72, 0.02);
    body.add(head);

    lathe(head, [
      [0, -0.26], [0.12, -0.26], [0.22, -0.08], [0.25, 0.10], [0.23, 0.28], [0.16, 0.40], [0, 0.42]
    ], parvatiSkin, [0, 0, 0], [1, 1, 1], 32);

    // Sculpted straight nose bridge
    path(head, [
      [0, 0.10, 0.22], [0, 0.02, 0.28], [0, -0.07, 0.30], [0, -0.11, 0.26]
    ], 0.026, 0.034, parvatiSkin);

    // Meditative almond eye contours (carved into facial plane)
    for (const s of [-1, 1]) {
      path(head, [
        [s * 0.04, 0.03, 0.24], [s * 0.11, 0.05, 0.23], [s * 0.17, 0.02, 0.19]
      ], 0.014, 0.008, darkGold);
      path(head, [
        [s * 0.04, 0.08, 0.23], [s * 0.11, 0.11, 0.22], [s * 0.18, 0.07, 0.18]
      ], 0.012, 0.008, antiqueBronze);
      // Delicate Makara Kundala earrings
      ell(head, [s * 0.24, -0.10, 0.02], [0.035, 0.09, 0.05], sareeGoldBorder);
      ell(head, [s * 0.24, -0.22, 0.02], [0.025, 0.05, 0.025], rubyGem);
    }

    // Sacred Vermilion Kumkum Bindi
    ell(head, [0, 0.10, 0.25], [0.022, 0.034, 0.012], rubyGem);

    // Serene sculpted lips
    ell(head, [0, -0.16, 0.24], [0.055, 0.020, 0.020], rubyGem);

    // Ornate Kiritamukuta (Jeweled Conical Temple Crown)
    const crown = new T.Group();
    crown.position.set(0, 0.30, 0.0);
    head.add(crown);
    const crownPts = [
      [0, 0], [0.24, 0.0], [0.22, 0.18], [0.20, 0.36], [0.15, 0.60], [0.08, 0.85], [0.03, 1.02], [0, 1.06]
    ];
    lathe(crown, crownPts, sareeGoldBorder, [0, 0, 0], [1, 1, 1], 32);
    for (let r = 0; r < 3; r++) {
      ring(crown, 0.22 - r * 0.05, 0.014, [0, 0.15 + r * 0.26, 0], paleGold).rotation.x = Math.PI / 2;
    }
    ell(crown, [0, 1.12, 0], [0.045, 0.075, 0.045], rubyGem);

    // Radiating Floral Prabhavali
    const prabhavali = halo(g, 1.45);
    prabhavali.position.set(0, 1.70, -0.35);

    // Continuous Sculpted Arms (No floating ball joints!)
    const leftArm = new T.Group();
    leftArm.position.set(-0.35, 1.05, 0.02);
    body.add(leftArm);
    const rightArm = new T.Group();
    rightArm.position.set(0.35, 1.05, 0.02);
    body.add(rightArm);

    if (mode === 'creation') {
      // Arms extending gracefully forward weaving golden stardust
      path(rightArm, [[0, 0, 0], [0.12, -0.32, 0.22], [0.22, -0.42, 0.58]], 0.075, 0.052, parvatiSkin);
      path(leftArm, [[0, 0, 0], [-0.12, -0.32, 0.22], [-0.22, -0.42, 0.58]], 0.075, 0.052, parvatiSkin);
      ell(rightArm, [0.22, -0.42, 0.64], [0.055, 0.038, 0.09], parvatiSkin);
      ell(leftArm, [-0.22, -0.42, 0.64], [0.055, 0.038, 0.09], parvatiSkin);
      ring(rightArm, 0.058, 0.012, [0.20, -0.40, 0.55], sareeGoldBorder);
      ring(leftArm, 0.058, 0.012, [-0.20, -0.40, 0.55], sareeGoldBorder);
    } else {
      // Right hand in Abhaya mudra / Left hand holding golden lotus
      path(rightArm, [[0, 0, 0], [0.14, -0.26, 0.12], [0.18, 0.0, 0.26]], 0.075, 0.052, parvatiSkin);
      ell(rightArm, [0.18, 0.08, 0.30], [0.05, 0.09, 0.032], parvatiSkin);
      path(leftArm, [[0, 0, 0], [-0.14, -0.28, 0.10], [-0.18, -0.40, 0.24]], 0.075, 0.052, parvatiSkin);

      const lotus = new T.Group();
      lotus.position.set(-0.18, -0.34, 0.32);
      leftArm.add(lotus);
      mesh(new T.CylinderGeometry(0.014, 0.014, 0.42, 8), darkGold, lotus, [0, -0.15, 0]);
      for (let p = 0; p < 8; p++) {
        const pa = p / 8 * Math.PI * 2;
        const pet = ell(lotus, [Math.cos(pa) * 0.11, 0.04, Math.sin(pa) * 0.11], [0.065, 0.028, 0.13], paleGold);
        pet.rotation.y = -pa;
      }
      ell(lotus, [0, 0.06, 0], [0.06, 0.05, 0.06], rubyGem);
    }

    return {
      group: g,
      prabhavali,
      rightArm,
      leftArm,
      update(t, local) {
        prabhavali.rotation.z = t * 0.012;
        rightArm.rotation.z = -0.12 + Math.sin(t * 0.8) * 0.15;
        leftArm.rotation.z = 0.12 - Math.sin(t * 0.8 + 0.6) * 0.15;
        if (mode === 'creation') {
          g.position.y = pos[1] + Math.sin(t * 1.4) * 0.035;
          rightArm.position.y = 1.05 + Math.sin(t * 1.8) * 0.02;
          leftArm.position.y = 1.05 + Math.sin(t * 1.8 + 0.5) * 0.02;
        }
      }
    };
  }

  // ─── LORD SHIVA (MAHADEVA — CHOLA BRONZE & KAILASH ASCETIC SCULPTURE) ───
  function createShiva(parent, options = {}) {
    const { mode = 'arrival', pos = [0, 0, 0], scale = 1, rotY = 0 } = options;
    const g = new T.Group();
    g.position.set(...pos);
    g.scale.setScalar(scale);
    g.rotation.y = rotY;
    parent.add(g);

    // Himalayan Kailash Crag Pedestal with Altar Base
    const crag = createMountain(14, 1.8, 1.8);
    mesh(crag, rockFace, g, [0, -2.5, 0]);
    lathe(g, [[0, -2.1], [1.1, -2.1], [1.18, -2.0], [1.02, -1.9], [0, -1.9]], darkGold);

    // Continuous Muscular Yogic Legs (No floating ball joints!)
    for (const [lx, s] of [[-0.34, -1], [0.34, 1]]) {
      path(g, [
        [lx, -0.4, 0],
        [lx * 1.04, -0.9, 0.04],
        [lx, -1.35, 0.02],
        [lx, -1.95, 0]
      ], 0.17, 0.11, shivaSkin);
      ring(g, 0.13, 0.016, [lx, -1.98, 0], darkGold).rotation.x = Math.PI / 2;
      ell(g, [lx, -2.06, 0.14], [0.11, 0.06, 0.24], shivaSkin);
    }

    // Tiger Skin Dhoti (Vyaghrambara)
    const dhotiPts = [
      [0.42, 0.2],
      [0.46, -0.1],
      [0.54, -0.45],
      [0.62, -0.85],
      [0.68, -1.1],
      [0, -1.1]
    ];
    lathe(g, dhotiPts, tigerSkin, [0, 0, 0], [1, 1, 1], 32);
    ring(g, 0.47, 0.026, [0, 0.24, 0], darkGold).rotation.x = Math.PI / 2;
    ell(g, [0, 0.24, 0.48], [0.09, 0.07, 0.05], gold);

    // Athletic Yogic Torso (Simha-Kati: Lion-Waist Profile)
    const torsoPts = [
      [0, 0.15],
      [0.42, 0.15],
      [0.36, 0.55],
      [0.44, 0.95],
      [0.55, 1.40],
      [0.51, 1.70],
      [0.24, 1.90],
      [0, 1.90]
    ];
    lathe(g, torsoPts, shivaSkin, [0, 0, 0], [1, 1, 1], 36);

    // Sacred Yajnopavita (Tri-strand Rudraksha thread)
    const yajnaPts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      yajnaPts.push([
        T.MathUtils.lerp(-0.45, 0.46, u),
        T.MathUtils.lerp(1.70, 0.32, u),
        Math.sin(u * Math.PI) * 0.42 + 0.16
      ]);
    }
    beads(g, yajnaPts, 0.032, darkGold);

    // Neelakantha: Sacred Blue Throat
    lathe(g, [[0, 1.88], [0.22, 1.88], [0.20, 2.06], [0.24, 2.22], [0, 2.22]], shivaSkin);
    ell(g, [0, 2.04, 0.20], [0.09, 0.07, 0.05], new T.MeshBasicMaterial({ color: 0x00a2ff }));

    // Sacred Naga Vasuki: Realistic undulating serpent coiled 3 times around neck
    const vasukiPts = [
      [0.26, 1.94, 0.16], [-0.20, 1.98, 0.18], [-0.24, 2.08, -0.15],
      [0.20, 2.12, -0.15], [0.28, 2.18, 0.18], [0.44, 2.32, 0.28],
      [0.50, 2.46, 0.34]
    ];
    path(g, vasukiPts, 0.048, 0.032, vasukiGreen);
    const vHood = ell(g, [0.52, 2.50, 0.36], [0.12, 0.06, 0.14], vasukiGreen);
    vHood.rotation.x = -0.25; vHood.rotation.y = -0.4;
    ell(vHood, [-0.04, 0.02, 0.06], [0.018, 0.018, 0.018], rubyGem);
    ell(vHood, [0.04, 0.02, 0.06], [0.018, 0.018, 0.018], rubyGem);
    ell(vHood, [0, 0.035, 0.02], [0.022, 0.030, 0.022], gold);

    // Rudraksha Garland around Neck
    const neckRudra = [];
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      neckRudra.push([Math.cos(a) * 0.27, 1.96, Math.sin(a) * 0.27]);
    }
    beads(g, neckRudra, 0.034, darkGold);

    // Noble Ascetic Head & Sculpted Visage
    const head = new T.Group();
    head.position.set(0, 2.38, 0.04);
    g.add(head);

    lathe(head, [
      [0, -0.28], [0.14, -0.28], [0.25, -0.08], [0.28, 0.12], [0.26, 0.32], [0.18, 0.44], [0, 0.46]
    ], shivaSkin, [0, 0, 0], [1, 1, 1], 32);

    // Sculpted straight nose bridge
    path(head, [
      [0, 0.12, 0.24], [0, 0.02, 0.31], [0, -0.08, 0.33], [0, -0.13, 0.28]
    ], 0.032, 0.040, shivaSkin);

    // Sacred Tripundra (3 horizontal Vibhuti ash lines across brow)
    for (let r = -1; r <= 1; r++) {
      mesh(box, ivory, head, [0, 0.16 + r * 0.034, 0.29], [0.24 - Math.abs(r) * 0.03, 0.014, 0.02]);
    }

    // Trinetra (Third Eye): vertical luminous aperture
    ell(head, [0, 0.16, 0.30], [0.024, 0.054, 0.018], trinetraGlow);
    ell(head, [0, 0.16, 0.31], [0.014, 0.018, 0.010], rubyGem);

    // Meditative almond eye contours (carved flush into the bronze face)
    for (const s of [-1, 1]) {
      path(head, [
        [s * 0.05, 0.04, 0.26], [s * 0.12, 0.06, 0.25], [s * 0.18, 0.03, 0.21]
      ], 0.015, 0.009, darkGold);
      path(head, [
        [s * 0.05, 0.09, 0.25], [s * 0.13, 0.12, 0.24], [s * 0.20, 0.08, 0.20]
      ], 0.014, 0.009, antiqueBronze);
      // Sacred gold Kundala earrings
      ell(head, [s * 0.28, -0.10, 0.02], [0.035, 0.10, 0.06], shivaSkin);
      ell(head, [s * 0.28, -0.22, 0.02], [0.030, 0.06, 0.035], sareeGoldBorder);
    }

    // Majestic Jatamukuta (Matted Locks Crown) with Cascading Braids
    const jata = new T.Group();
    jata.position.set(0, 0.36, -0.02);
    head.add(jata);

    const jataPts = [
      [0, 0], [0.30, 0.0], [0.28, 0.24], [0.25, 0.48], [0.20, 0.72], [0.14, 0.94], [0.05, 1.10], [0, 1.15]
    ];
    lathe(jata, jataPts, obsidian, [0, 0, 0], [1, 1, 1], 32);

    // Cascading hair braids falling over shoulders
    for (const s of [-1, 1]) {
      path(head, [
        [s * 0.26, 0.15, 0.05], [s * 0.35, -0.20, 0.02],
        [s * 0.38, -0.65, 0.0], [s * 0.35, -1.15, 0.05]
      ], 0.048, 0.030, obsidian);
    }

    // Chandra (Silver Crescent Moon)
    const chandra = mesh(new T.TorusGeometry(0.24, 0.030, 14, 40, Math.PI * 0.95), chandraSilver, jata, [-0.30, 0.60, 0.12]);
    chandra.rotation.z = Math.PI * 0.75;

    // Celestial Ganga: Dynamic glowing fountain
    const gangaGeo = new T.BufferGeometry();
    const gCount = 42;
    const gPos = new Float32Array(gCount * 3);
    for (let i = 0; i < gCount; i++) {
      const u = i / gCount;
      gPos[i * 3] = Math.sin(u * 9.0) * 0.14 + 0.20 * u;
      gPos[i * 3 + 1] = 1.20 - u * 2.1;
      gPos[i * 3 + 2] = -Math.cos(u * 7.0) * 0.16 - 0.24;
    }
    gangaGeo.setAttribute('position', new T.BufferAttribute(gPos, 3));
    jata.add(new T.Line(gangaGeo, new T.LineBasicMaterial({ color: 0x7be4ff, transparent: true, opacity: 0.85 })));

    // Cosmic Prabhavali Halo
    const shivaHalo = halo(g, 1.85);
    shivaHalo.position.set(0, 2.38, -0.40);

    // Grand Ornate Trishul with Damru & Silk Ribbon
    const shivaTrishul = new T.Group();
    g.add(shivaTrishul);
    shivaTrishul.position.set(1.05, 0.6, 0.45);

    mesh(new T.CylinderGeometry(0.050, 0.070, 8.6, 24), antiqueBronze, shivaTrishul, [0, -0.4, 0]);
    for (let y = -4.0; y < 1.4; y += 0.95) {
      ring(shivaTrishul, 0.082, 0.015, [0, y, 0], gold).rotation.x = Math.PI / 2;
    }
    lathe(shivaTrishul, [[0, 1.2], [0.16, 1.2], [0.22, 1.35], [0.13, 1.5], [0, 1.5]], gold);

    path(shivaTrishul, [
      [-1.10, 3.5, 0], [-1.02, 2.4, 0], [-0.58, 1.65, 0], [0, 1.45, 0],
      [0.58, 1.65, 0], [1.02, 2.4, 0], [1.10, 3.5, 0]
    ], 0.070, 0.050, gold);
    mesh(new T.ConeGeometry(0.13, 1.10, 16), gold, shivaTrishul, [0, 4.05, 0]);
    mesh(new T.ConeGeometry(0.11, 0.90, 16), gold, shivaTrishul, [-1.10, 3.75, 0]);
    mesh(new T.ConeGeometry(0.11, 0.90, 16), gold, shivaTrishul, [1.10, 3.75, 0]);

    // Damru (Hourglass drum) with sacred cords
    const damru = new T.Group();
    damru.position.set(0, 0.85, 0);
    shivaTrishul.add(damru);
    for (const s of [-1, 1]) {
      mesh(new T.CylinderGeometry(0.30, 0.10, 0.40, 28), darkGold, damru, [0, s * 0.20, 0]);
      ring(damru, 0.31, 0.018, [0, s * 0.39, 0], paleGold).rotation.x = Math.PI / 2;
    }
    ring(damru, 0.12, 0.025, [0, 0, 0], crimson).rotation.x = Math.PI / 2;
    path(damru, [[0, 0, 0], [-0.32, -0.4, 0.15], [-0.50, -1.0, 0.25], [-0.38, -1.5, 0.35]], 0.055, 0.035, crimson);

    // Continuous Sculpted Arms
    const rightArm = new T.Group();
    rightArm.position.set(0.51, 1.65, 0.04);
    g.add(rightArm);
    const leftArm = new T.Group();
    leftArm.position.set(-0.51, 1.65, 0.04);
    g.add(leftArm);

    if (mode === 'battle') {
      path(rightArm, [[0, 0, 0], [0.24, -0.32, 0.32], [0.30, -0.56, 0.36]], 0.11, 0.078, shivaSkin);
      path(leftArm, [[0, 0, 0], [-0.35, -0.22, 0.32], [-0.44, 0.08, 0.55]], 0.11, 0.078, shivaSkin);
    } else if (mode === 'blessing') {
      path(rightArm, [[0, 0, 0], [0.28, -0.15, 0.22], [0.38, 0.35, 0.45]], 0.11, 0.078, shivaSkin);
      ell(rightArm, [0.38, 0.45, 0.48], [0.075, 0.12, 0.040], shivaSkin);
      path(leftArm, [[0, 0, 0], [-0.22, -0.42, 0.12], [-0.30, -0.75, 0.22]], 0.11, 0.078, shivaSkin);
    } else {
      path(rightArm, [[0, 0, 0], [0.22, -0.42, 0.20], [0.28, -0.85, 0.32]], 0.11, 0.078, shivaSkin);
      path(leftArm, [[0, 0, 0], [-0.22, -0.42, 0.10], [-0.26, -0.85, 0.16]], 0.11, 0.078, shivaSkin);
    }

    return {
      group: g,
      rightArm, leftArm,
      trishul: shivaTrishul,
      damru,
      shivaHalo,
      update(t, local) {
        rightArm.rotation.z = Math.sin(t * 0.7) * 0.12;
        leftArm.rotation.x = Math.sin(t * 0.8 + 1) * 0.1;
        if (mode === 'blessing') rightArm.rotation.x = -0.35 - Math.sin(t * 0.7) * 0.12;
        damru.rotation.y = t * 0.8;
        shivaHalo.rotation.z = -t * 0.06;
      }
    };
  }

  // ─── MAA SHAKTI (ADI PARASHAKTI — COSMIC FIERCE MOTHER IN FULL GLORY) ───
  function createShakti(parent) {
    const g = new T.Group();
    g.position.set(0, 0.8, 0);
    parent.add(g);

    // Floating Cosmic Pedestal
    lathe(g, [[0, -2.2], [1.15, -2.2], [1.25, -2.05], [1.05, -1.95], [0, -1.95]], obsidian);
    ring(g, 1.28, 0.035, [0, -2.0, 0], fireGlow).rotation.x = Math.PI / 2;

    // Billowing Fierce Cosmic Saree with Dynamic Wave
    const skirtPts = [
      [0.36, 0.1], [0.44, -0.3], [0.58, -0.8], [0.75, -1.4], [0.92, -1.95], [0, -1.95]
    ];
    lathe(g, skirtPts, shaktiArmor, [0, 0, 0], [1, 1, 1], 36);

    // Gold Armored Bodice & Breastplate
    lathe(g, [[0, 0.1], [0.36, 0.1], [0.30, 0.45], [0.40, 0.85], [0.34, 1.05], [0.18, 1.20], [0, 1.20]], shaktiArmor);
    ring(g, 0.36, 0.02, [0, 0.85, 0.05], sareeGoldBorder).rotation.x = Math.PI / 2;

    // Sacred Gem Garland (Mundamala)
    const mundaPts = [];
    for (let i = 0; i <= 22; i++) {
      const u = i / 22;
      mundaPts.push([
        Math.sin(u * Math.PI * 2) * 0.40,
        0.65 - Math.sin(u * Math.PI) * 0.95,
        Math.cos(u * Math.PI * 2) * 0.26 + 0.18
      ]);
    }
    beads(g, mundaPts, 0.042, rubyGem);

    // Fierce Sculpted Head & Visage
    const head = new T.Group();
    head.position.set(0, 1.68, 0.04);
    g.add(head);

    lathe(head, [
      [0, -0.26], [0.13, -0.26], [0.24, -0.08], [0.27, 0.10], [0.24, 0.30], [0.17, 0.42], [0, 0.44]
    ], parvatiSkin, [0, 0, 0], [1, 1, 1], 32);

    path(head, [[0, 0.10, 0.24], [0, 0.0, 0.30], [0, -0.10, 0.32], [0, -0.14, 0.28]], 0.030, 0.038, parvatiSkin);

    // Blazing Cosmic Third Eye
    ell(head, [0, 0.16, 0.30], [0.034, 0.070, 0.018], fireGlow);
    ell(head, [0, 0.16, 0.31], [0.018, 0.022, 0.012], warmGlow);

    // Fierce Eye Contours
    for (const s of [-1, 1]) {
      path(head, [
        [s * 0.05, 0.04, 0.25], [s * 0.12, 0.06, 0.24], [s * 0.18, 0.03, 0.20]
      ], 0.016, 0.010, fireGlow);
      path(head, [
        [s * 0.05, 0.09, 0.24], [s * 0.13, 0.13, 0.23], [s * 0.20, 0.08, 0.19]
      ], 0.015, 0.010, rubyGem);
    }

    // Sacred Fierce Mukuta (Rising Cosmic Crown)
    const crown = new T.Group();
    crown.position.set(0, 0.28, 0.01);
    head.add(crown);
    lathe(crown, [[0, 0], [0.30, 0], [0.26, 0.35], [0.18, 0.70], [0.09, 1.05], [0, 1.15]], sareeGoldBorder);
    ell(crown, [0, 1.22, 0], [0.075, 0.15, 0.075], fireGlow);

    // Blazing Double Prabhavali with 24 Solar Rays
    const shaktiHalo = new T.Group();
    shaktiHalo.position.set(0, 1.68, -0.40);
    g.add(shaktiHalo);
    ring(shaktiHalo, 1.95, 0.028, [0, 0, 0], fireGlow);
    ring(shaktiHalo, 2.35, 0.020, [0, 0, 0], warmGlow);
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      const ray = mesh(new T.ConeGeometry(0.11, 0.75, 8), fireGlow, shaktiHalo, [Math.cos(a) * 2.45, Math.sin(a) * 2.45, 0]);
      ray.rotation.z = a - Math.PI / 2;
    }

    // ── 8 RADIATING DIVINE ARMS WITH CELESTIAL WEAPONS ──
    const armDefs = [
      [Math.PI * 0.38, 'trishul'],
      [Math.PI * 0.22, 'khadga'],
      [Math.PI * 0.06, 'chakra'],
      [-Math.PI * 0.10, 'abhaya'],
      [Math.PI * 0.62, 'agni'],
      [Math.PI * 0.78, 'bow'],
      [Math.PI * 0.94, 'arrow'],
      [Math.PI * 1.10, 'gada']
    ];

    armDefs.forEach(([a, wType]) => {
      const armGroup = new T.Group();
      armGroup.position.set(Math.cos(a) * 0.44, 1.05 + Math.sin(a) * 0.34, -0.06);
      g.add(armGroup);

      const armEnd = [Math.cos(a) * 1.22, Math.sin(a) * 1.22, 0.28];
      path(armGroup, [[0, 0, 0], [armEnd[0] * 0.5, armEnd[1] * 0.5, 0.16], armEnd], 0.082, 0.058, parvatiSkin);
      ring(armGroup, 0.088, 0.016, [armEnd[0] * 0.75, armEnd[1] * 0.75, 0.20], sareeGoldBorder);

      const wGroup = new T.Group();
      wGroup.position.set(...armEnd);
      armGroup.add(wGroup);

      if (wType === 'trishul') {
        mesh(new T.CylinderGeometry(0.032, 0.032, 2.5, 12), sareeGoldBorder, wGroup);
        path(wGroup, [[-0.42, 1.25, 0], [-0.28, 0.85, 0], [0, 0.75, 0], [0.28, 0.85, 0], [0.42, 1.25, 0]], 0.042, 0.042, fireGlow);
        mesh(new T.ConeGeometry(0.085, 0.50, 12), fireGlow, wGroup, [0, 1.5, 0]);
      } else if (wType === 'khadga') {
        path(wGroup, [[0, -0.4, 0], [0, 0.8, 0], [0.16, 1.4, 0]], 0.044, 0.015, paleGold);
        mesh(box, darkGold, wGroup, [0, -0.4, 0], [0.28, 0.06, 0.08]);
      } else if (wType === 'chakra') {
        ring(wGroup, 0.42, 0.030, [0, 0, 0], glow);
        for (let s = 0; s < 8; s++) {
          const sa = s / 8 * Math.PI * 2;
          const blade = mesh(new T.ConeGeometry(0.060, 0.22, 6), fireGlow, wGroup, [Math.cos(sa) * 0.44, Math.sin(sa) * 0.44, 0]);
          blade.rotation.z = sa - Math.PI / 2;
        }
      } else if (wType === 'agni') {
        lathe(wGroup, [[0, 0], [0.16, 0], [0.20, 0.12], [0.15, 0.22], [0, 0.22]], sareeGoldBorder);
        ell(wGroup, [0, 0.26, 0], [0.12, 0.28, 0.12], fireGlow);
      } else if (wType === 'bow') {
        path(wGroup, [[-0.20, -0.80, 0], [0.30, 0, 0], [-0.20, 0.80, 0]], 0.035, 0.020, sareeGoldBorder);
      } else if (wType === 'arrow') {
        mesh(new T.CylinderGeometry(0.018, 0.018, 1.6, 8), paleGold, wGroup);
        mesh(new T.ConeGeometry(0.070, 0.26, 8), fireGlow, wGroup, [0, 0.90, 0]);
      } else if (wType === 'gada') {
        mesh(new T.CylinderGeometry(0.030, 0.045, 1.4, 12), darkGold, wGroup);
        lathe(wGroup, [[0, 0.6], [0.24, 0.6], [0.26, 0.85], [0.16, 1.1], [0, 1.15]], sareeGoldBorder);
      } else {
        ell(wGroup, [0, 0, 0.05], [0.07, 0.14, 0.04], parvatiSkin);
      }
    });

    return {
      group: g,
      halo: shaktiHalo,
      update(t, local) {
        shaktiHalo.rotation.z = t * 0.35;
        g.position.y = 0.8 + Math.sin(t * 2.2) * 0.12;
      }
    };
  }

  // ─── CHILD GANESHA (YOUNG PRINCE & GUARDIAN SENTINEL) ───
  function createChildGanesha(parent, options = {}) {
    const { mode = 'creation', pos = [0, 0, 0], scale = 1, rotY = 0 } = options;
    const g = new T.Group();
    g.position.set(...pos);
    g.scale.setScalar(scale);
    g.rotation.y = rotY;
    parent.add(g);

    const childSkin = new T.MeshStandardMaterial({
      color: 0xb18767, metalness: 0.0, roughness: 0.78, side: T.DoubleSide
    });

    if (mode === 'creation') {
      // Blooming Golden Lotus Pedestal (Padmapitha)
      lathe(g, [[0, -0.2], [0.68, -0.2], [0.74, -0.1], [0.62, 0.0], [0, 0.0]], darkGold);
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2;
        const pet = ell(g, [Math.cos(a) * 0.62, 0.02, Math.sin(a) * 0.62], [0.18, 0.04, 0.26], paleGold);
        pet.rotation.y = -a + Math.PI / 2;
        pet.rotation.x = -0.25;
      }

      // Seated Lotus Posture with contoured legs
      path(g, [[-0.34, 0.12, 0.05], [-0.26, 0.16, 0.24], [0, 0.10, 0.32]], 0.11, 0.08, childSkin);
      path(g, [[0.34, 0.12, 0.05], [0.26, 0.16, 0.24], [0, 0.10, 0.32]], 0.11, 0.08, childSkin);
      lathe(g, [[0, 0.1], [0.32, 0.1], [0.36, 0.35], [0.30, 0.55], [0, 0.55]], sareeGoldBorder);

      // Torso & heart center
      lathe(g, [[0, 0.50], [0.26, 0.50], [0.28, 0.72], [0.22, 0.90], [0.12, 0.98], [0, 0.98]], childSkin);
      const heartGlow = ell(g, [0, 0.72, 0.24], [0.06, 0.06, 0.04], warmGlow);

      // Head & serene features
      lathe(g, [[0, 0.98], [0.14, 0.98], [0.22, 1.15], [0.24, 1.30], [0.16, 1.45], [0, 1.48]], childSkin);
      ell(g, [0, 1.28, 0.24], [0.022, 0.038, 0.012], rubyGem);
      for (const s of [-1, 1]) {
        path(g, [
          [s * 0.04, 1.22, 0.23], [s * 0.09, 1.24, 0.22], [s * 0.14, 1.21, 0.18]
        ], 0.012, 0.007, darkGold);
      }
      lathe(g, [[0, 1.46], [0.16, 1.46], [0.13, 1.68], [0.05, 1.82], [0, 1.88]], sareeGoldBorder);

      // Hands resting gently in lap
      path(g, [[-0.24, 0.80, 0.05], [-0.30, 0.50, 0.18], [-0.18, 0.30, 0.30]], 0.065, 0.048, childSkin);
      path(g, [[0.24, 0.80, 0.05], [0.30, 0.50, 0.18], [0.18, 0.30, 0.30]], 0.065, 0.048, childSkin);

      return {
        group: g,
        heartGlow,
        update(t, local) {
          const pulse = Math.sin(t * 3.5) * 0.03;
          g.scale.set(scale * (1 + pulse), scale * (1 + pulse * 1.5), scale * (1 + pulse));
          heartGlow.scale.setScalar(0.8 + Math.sin(t * 4.0) * 0.3);
        }
      };
    } else {
      // Guardian Boy Sentinel (Standing firm at Kailash portal, staff gripped with two hands)
      for (const lx of [-0.18, 0.18]) {
        path(g, [
          [lx, 0.0, 0], [lx * 1.05, -0.45, 0.04], [lx, -0.85, 0.02], [lx, -1.25, 0]
        ], 0.11, 0.08, childSkin);
        ell(g, [lx, -1.30, 0.08], [0.08, 0.05, 0.15], childSkin);
      }
      lathe(g, [[0, -0.4], [0.28, -0.4], [0.34, -0.1], [0.30, 0.2], [0, 0.2]], sareeGoldBorder);
      ring(g, 0.30, 0.022, [0, 0.20, 0], sareeGoldBorder).rotation.x = Math.PI / 2;

      lathe(g, [[0, 0.2], [0.26, 0.2], [0.24, 0.45], [0.28, 0.70], [0.24, 0.86], [0.13, 0.96], [0, 0.96]], childSkin);
      ring(g, 0.16, 0.014, [0, 0.76, 0.12], sareeGoldBorder).rotation.x = Math.PI / 3;

      const head = new T.Group(); g.add(head);
      lathe(head, [[0, 0.96], [0.14, 0.96], [0.22, 1.12], [0.24, 1.28], [0.16, 1.42], [0, 1.45]], childSkin);
      ell(head, [0, 1.28, 0.24], [0.022, 0.042, 0.012], rubyGem);
      for (const s of [-1, 1]) {
        path(head, [
          [s * 0.04, 1.22, 0.24], [s * 0.09, 1.25, 0.23], [s * 0.14, 1.22, 0.19]
        ], 0.012, 0.007, darkGold);
      }
      lathe(head, [[0, 1.44], [0.16, 1.44], [0.13, 1.68], [0.05, 1.82], [0, 1.88]], sareeGoldBorder);

      // Sacred Carved Wooden Guardian Staff
      const staff = new T.Group();
      staff.position.set(0.15, 0.35, 0.36);
      g.add(staff);
      mesh(new T.CylinderGeometry(0.042, 0.052, 3.4, 16), treeBark, staff, [0, 0, 0]);
      mesh(new T.ConeGeometry(0.12, 0.36, 14), sareeGoldBorder, staff, [0, 1.8, 0]);
      ring(staff, 0.080, 0.018, [0, 1.6, 0], sareeGoldBorder).rotation.x = Math.PI / 2;
      ring(staff, 0.075, 0.016, [0, -1.6, 0], antiqueBronze).rotation.x = Math.PI / 2;

      path(g, [[-0.24, 0.70, 0.05], [-0.10, 0.48, 0.26], [0.14, 0.54, 0.36]], 0.068, 0.048, childSkin);
      path(g, [[0.24, 0.70, 0.05], [0.26, 0.40, 0.26], [0.16, 0.24, 0.36]], 0.068, 0.048, childSkin);
      ring(g, 0.060, 0.012, [0.14, 0.54, 0.36], sareeGoldBorder);
      ring(g, 0.060, 0.012, [0.16, 0.24, 0.36], sareeGoldBorder);

      return {
        group: g,
        staff, head,
        update(t, local) { head.rotation.y = Math.sin(t * 0.6) * 0.06; }
      };
    }
  }

  // ─── CH 0: PROLOGUE ───
  const hero = ganesha(roots[0]);
  hero.position.set(2.5, 0, 0);
  const heroHalo = halo(roots[0], 2.8);
  heroHalo.position.set(2.5, 0.8, -1);
  temple(roots[0]);

  // Incense smoke wisps
  const incenseCount = 120;
  const incenseGeo = new T.BufferGeometry();
  const iPos = new Float32Array(incenseCount * 3), iSeed = new Float32Array(incenseCount);
  for (let i = 0; i < incenseCount; i++) {
    iPos[i*3] = (Math.random() - 0.5) * 3 + 2.5;
    iPos[i*3+1] = Math.random() * 8 - 2;
    iPos[i*3+2] = (Math.random() - 0.5) * 2;
    iSeed[i] = Math.random();
  }
  incenseGeo.setAttribute('position', new T.BufferAttribute(iPos, 3));
  incenseGeo.setAttribute('seed', new T.BufferAttribute(iSeed, 1));
  const incenseMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `uniform float time; attribute float seed; varying float a;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + time * 0.14 + seed * 5.0, 10.0) - 2.0;
        p.x += sin(time * 0.3 + seed * 20.0) * 0.15;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((15.0 + seed * 12.0) / -mv.z, 1.0, 4.0);
        a = 0.12 + 0.08 * sin(seed * 30.0 + time);
      }`,
    fragmentShader: `varying float a; void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(0.85, 0.72, 0.48, (1.0 - d * 2.0) * a);
      }`
  });
  const incense = new T.Points(incenseGeo, incenseMat);
  roots[0].add(incense);

  // ─── CH 1: CREATION — GAURI KUND & MAA PARVATI SCULPTING GANESHA ───
  // Sacred Gauri Kund Waters (reflecting pristine Himalayan peaks without temple pillars blocking view)
  const waterNormals = new T.TextureLoader().load('./assets/waternormals.jpg');
  waterNormals.wrapS = waterNormals.wrapT = T.RepeatWrapping;
  const gauriKundWater = new Water(new T.CircleGeometry(9.5, 64), {
    textureWidth: 256, textureHeight: 256, waterNormals,
    sunDirection: new T.Vector3(0.4, 0.8, -0.2).normalize(),
    sunColor: 0xd2e2e8, waterColor: 0x164047,
    distortionScale: 0.65, fog: true
  });
  gauriKundWater.position.set(0, -2.25, 0);
  roots[1].add(gauriKundWater);
  gauriKundWater.rotation.x = -Math.PI / 2;

  // Maa Parvati in her divine mother form sculpting child Ganesha
  const parvatiCh1 = createParvati(roots[1], { mode: 'creation', pos: [-1.4, -0.5, 0], scale: 1.15, rotY: 0.45 });
  // Child Ganesha seated on golden lotus pedestal
  const childCh1 = createChildGanesha(roots[1], { mode: 'creation', pos: [1.2, -1.0, 0], scale: 1.15, rotY: -0.35 });

  // Swirling Golden Prana Particles (flowing from Parvati's hands to Child Ganesha's heart)
  const pranaCount = 180;
  const pranaGeo = new T.BufferGeometry();
  const pranaPos = new Float32Array(pranaCount * 3), pranaSeed = new Float32Array(pranaCount);
  for (let i = 0; i < pranaCount; i++) {
    pranaPos[i * 3] = -1.0 + Math.random() * 2.2;
    pranaPos[i * 3 + 1] = Math.random() * 1.5;
    pranaPos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    pranaSeed[i] = Math.random();
  }
  pranaGeo.setAttribute('position', new T.BufferAttribute(pranaPos, 3));
  pranaGeo.setAttribute('seed', new T.BufferAttribute(pranaSeed, 1));
  const pranaMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `uniform float time; attribute float seed; varying float a;
      void main(){
        float t = mod(seed + time * 0.35, 1.0);
        vec3 p0 = vec3(-1.0, 0.4, 0.5);
        vec3 p1 = vec3(0.0, 0.9, 0.6);
        vec3 p2 = vec3(1.2, -0.2, 0.3);
        vec3 p = mix(mix(p0, p1, t), mix(p1, p2, t), t);
        p.y += sin(time * 3.0 + seed * 20.0) * 0.12;
        p.z += cos(time * 2.5 + seed * 15.0) * 0.15;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((24.0 + seed * 20.0) / -mv.z, 1.5, 6.0);
        a = sin(t * 3.14159) * (0.6 + seed * 0.4);
      }`,
    fragmentShader: `varying float a; void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 col = mix(vec3(1.0, 0.88, 0.45), vec3(1.0, 0.55, 0.15), d * 2.0);
        gl_FragColor = vec4(col, (1.0 - d * 2.0) * a);
      }`
  });
  const pranaParticles = new T.Points(pranaGeo, pranaMat);
  roots[1].add(pranaParticles);

  // Procedural jagged Himalayan mountains with snow caps
  function createMountain(segments = 16, height = 18, baseR = 7.0) {
    const geo = new T.PlaneGeometry(baseR * 3.8, baseR * 3.8, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const radius = Math.hypot(x / baseR, z / baseR);
      const ridge = Math.abs(Math.sin(x * 0.54 + z * 0.37)) * 0.25
        + Math.abs(Math.sin(x * 1.37 - z * 0.83)) * 0.12
        + Math.sin(x * 3.7 + z * 2.1) * 0.035;
      const peak = Math.exp(-radius * radius * 1.1);
      pos.setY(i, peak * height * (0.72 + ridge) - height * 0.5);
    }
    geo.computeVertexNormals();
    return geo;
  }
  for (let i = 0; i < 9; i++) {
    const mg = createMountain(16 + (i % 3) * 2, 15 + (i % 4) * 3, 6.0 + (i % 3) * 1.5);
    const xOff = (i - 4) * 8.0, zOff = -26 - Math.abs(i - 4) * 3.8;
    mesh(mg, i % 3 === 0 ? snowCap : rockFace, roots[1], [xOff, 1.5, zOff], [1, 1 + (i % 3) * 0.18, 1]);
  }

  // Atmospheric cloud fog at mountain base
  const fogPlane = mesh(
    new T.PlaneGeometry(120, 60, 1, 1),
    new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      uniforms: { time: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float time; varying vec2 vUv;
        void main(){
          float fog = smoothstep(0.25, 0.65, vUv.y) * (1.0 - smoothstep(0.65, 0.95, vUv.y));
          fog *= 0.5 + 0.5 * sin(vUv.x * 3.5 + time * 0.18);
          gl_FragColor = vec4(0.20, 0.25, 0.32, fog * 0.22);
        }`
    }),
    roots[1], [0, 0, -28]
  );
  fogPlane.rotation.x = -0.1;

  // ─── CH 2: THE GUARDIAN — BRAVE YOUNG GANESHA AT THE SACRED GATE ───
  temple(roots[2]);
  const door = mesh(box, darkGold, roots[2], [0, 1, -7], [4.2, 7.8, 0.3]);
  mesh(box, gold, roots[2], [-2.15, 1, -6.8], [0.12, 8.0, 0.12]);
  mesh(box, gold, roots[2], [2.15, 1, -6.8], [0.12, 8.0, 0.12]);
  mesh(box, gold, roots[2], [0, 5.05, -6.8], [4.5, 0.12, 0.12]);
  for (let x = -1.7; x <= 1.7; x += 0.48) {
    mesh(box, antiqueBronze, roots[2], [x, 1, -6.82], [0.025, 7.2, 0.025]);
  }
  for (let y = -1.5; y <= 3.5; y += 1.8) {
    for (let x = -1.4; x <= 1.4; x += 1.4) {
      ell(roots[2], [x, y, -6.7], [0.08, 0.08, 0.08], gold);
    }
  }

  // Brave Young Ganesha standing sentinel with wooden guardian staff
  const guardianCh2 = createChildGanesha(roots[2], { mode: 'guardian', pos: [0, -0.8, -3.8], scale: 1.25 });

  // ─── CH 3: SHIVA RETURNS — LORD SHIVA'S MAJESTIC ARRIVAL ───
  // Lord Shiva in ascetic grandeur with Jata, crescent Chandra, glowing Third Eye, Vasuki, Trishul & Damru
  const shivaCh3 = createShiva(roots[3], { mode: 'arrival', pos: [1.8, -0.4, 0], scale: 1.25, rotY: -0.35 });

  // Cold Himalayan blizzard snow flurries
  const snowFlurryCount = 140;
  const snowGeo = new T.BufferGeometry();
  const snPos = new Float32Array(snowFlurryCount * 3), snSeed = new Float32Array(snowFlurryCount);
  for (let i = 0; i < snowFlurryCount; i++) {
    snPos[i * 3] = (Math.random() - 0.5) * 18;
    snPos[i * 3 + 1] = Math.random() * 12 - 2;
    snPos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    snSeed[i] = Math.random();
  }
  snowGeo.setAttribute('position', new T.BufferAttribute(snPos, 3));
  snowGeo.setAttribute('seed', new T.BufferAttribute(snSeed, 1));
  const snowMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `uniform float time; attribute float seed; varying float a;
      void main(){
        vec3 p = position;
        p.x = mod(p.x - time * 2.4 * (0.6 + seed) + 9.0, 18.0) - 9.0;
        p.y = mod(p.y - time * 1.2 * (0.5 + seed) + 2.0, 12.0) - 2.0;
        p.z += sin(time * 0.8 + seed * 10.0) * 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((12.0 + seed * 16.0) / -mv.z, 1.0, 4.0);
        a = 0.35 + 0.35 * sin(seed * 20.0 + time);
      }`,
    fragmentShader: `varying float a; void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(0.85, 0.92, 1.0, (1.0 - d * 2.0) * a);
      }`
  });
  const snowParticles = new T.Points(snowGeo, snowMat);
  roots[3].add(snowParticles);

  for (let i = 0; i < 6; i++) {
    const mg = createMountain(14, 13 + i * 2, 5.5 + i * 0.8);
    mesh(mg, rockFace, roots[3], [(i - 2.5) * 8.5, 1, -22 - i * 2]);
  }

  // ─── CH 4: THE CONFRONTATION & COSMIC BATTLE ───
  const battle = new T.Group();
  roots[4].add(battle);

  // Young guardian Ganesha on left, facing Lord Shiva on right
  const guardianCh4 = createChildGanesha(battle, { mode: 'guardian', pos: [-2.2, -0.8, 0], scale: 1.15, rotY: 0.5 });
  const shivaCh4 = createShiva(battle, { mode: 'battle', pos: [2.2, -0.4, -0.8], scale: 1.25, rotY: -0.5 });

  const flyingTrishul = shivaCh4.trishul.clone();
  flyingTrishul.scale.setScalar(0.6);
  flyingTrishul.rotation.z = Math.PI / 2;
  battle.add(flyingTrishul);
  const impactLight = new T.PointLight(0xffe5bd, 0, 15);
  impactLight.position.set(-2.2, 0.5, 0);
  battle.add(impactLight);

  // Floating shattered boulders in zero gravity
  const rockGeos = [
    new T.IcosahedronGeometry(0.26, 1),
    new T.DodecahedronGeometry(0.24, 0),
    new T.OctahedronGeometry(0.32, 0)
  ];
  rockGeos.forEach(geo => {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = 1 + (Math.sin(x * 5 + y * 7) * 0.16 + Math.cos(z * 4 + x * 3) * 0.13);
      pos.setXYZ(i, x * n, y * n, z * n);
    }
    geo.computeVertexNormals();
  });

  for (let i = 0; i < 90; i++) {
    const a = i * 2.399, r = 2.1 + (i % 13) * 0.38;
    const rGeo = rockGeos[i % 3];
    const rMat = i % 5 === 0 ? gold : i % 3 === 0 ? stoneGray : obsidian;
    const m = mesh(rGeo, rMat, battle, [Math.cos(a) * r, Math.sin(a) * r, (i % 10) - 5]);
    m.rotation.set(i * 0.7, i * 0.4, i * 0.9);
    m.scale.setScalar(0.6 + Math.random() * 0.8);
  }

  const fallenWeapon = new T.Group();
  fallenWeapon.position.set(0, -2, -2);
  roots[4].add(fallenWeapon);
  mesh(new T.CylinderGeometry(0.04, 0.06, 3.5, 14), gold, fallenWeapon).rotation.z = Math.PI / 2.3;

  // ─── CH 5: SHAKTI'S COSMIC RAGE — MAA SHAKTI'S FIERCE COSMIC AVATAR ───
  const shaktiCh5 = createShakti(roots[5]);

  const orbitals = [];
  for (let i = 0; i < 7; i++) {
    const mat = i % 2 === 0 ? fireGlow : new T.MeshBasicMaterial({ color: 0xff7a18 });
    const r = ring(roots[5], 2.4 + i * 0.52, 0.018, [0, 0.8, 0], mat);
    r.rotation.set(i * 0.6, i * 0.45, 0);
    orbitals.push(r);
  }

  // Rising embers (inverted gravity)
  const emberCount = 340;
  const emberGeo = new T.BufferGeometry();
  const ePos = new Float32Array(emberCount * 3), eSeed = new Float32Array(emberCount);
  for (let i = 0; i < emberCount; i++) {
    ePos[i*3] = (Math.random() - 0.5) * 16;
    ePos[i*3+1] = Math.random() * 18 - 4;
    ePos[i*3+2] = (Math.random() - 0.5) * 16;
    eSeed[i] = Math.random();
  }
  emberGeo.setAttribute('position', new T.BufferAttribute(ePos, 3));
  emberGeo.setAttribute('seed', new T.BufferAttribute(eSeed, 1));
  const emberMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `uniform float time; attribute float seed; varying float a;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + time * 1.8 * (0.5 + seed), 18.0) - 4.0;
        p.x += sin(time * 0.8 + seed * 30.0) * 0.6;
        p.z += cos(time * 0.6 + seed * 20.0) * 0.4;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((13.0 + seed * 16.0) / -mv.z, 1.0, 5.0);
        a = 0.4 + 0.3 * sin(seed * 50.0 + time * 3.0);
      }`,
    fragmentShader: `varying float a; void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 c = mix(vec3(1.0, 0.42, 0.05), vec3(1.0, 0.12, 0.02), d * 2.0);
        gl_FragColor = vec4(c, (1.0 - d * 2.0) * a);
      }`
  });
  const embers = new T.Points(emberGeo, emberMat);
  roots[5].add(embers);

  // ─── CH 6: THE SEARCH — Primeval Forest & Sacred Elephant in Majestic Focus ───
  const forest = roots[6];

  function createCanopy(baseR = 2.2, segments = 18) {
    const geo = new T.IcosahedronGeometry(baseR, 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const noise = Math.sin(x * 2.5 + z * 1.8) * 0.22 + Math.cos(y * 3.2 + x * 1.5) * 0.18
        + Math.sin(z * 4.1 + y * 0.9) * 0.12;
      const squash = y < 0 ? 0.55 : 1.0;
      pos.setXYZ(i, x * (1 + noise * 0.35), y * squash * (1 + noise * 0.2), z * (1 + noise * 0.35));
    }
    geo.computeVertexNormals();
    return geo;
  }

  const foliageDark = new T.MeshStandardMaterial({ color: 0x0a1e12, metalness: 0.05, roughness: 0.92 });
  const foliageMid = new T.MeshStandardMaterial({ color: 0x122a18, metalness: 0.06, roughness: 0.88 });

  for (let i = 0; i < 26; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const xDist = side * (4.8 + (i % 5) * 1.5);
    const zDist = -2 - (i * 1.65);
    const treeH = 10 + (i % 4) * 2.5;
    const trunk = mesh(new T.CylinderGeometry(0.18 + (i % 3) * 0.06, 0.45 + (i % 3) * 0.08, treeH, 10), treeBark, forest, [xDist, treeH * 0.35, zDist]);
    trunk.rotation.z = side * (0.03 + (i % 5) * 0.015);
    const canopyR = 1.5 + (i % 4) * 0.5;
    const canopyGeo = createCanopy(canopyR, 14);
    const foliageMat = i % 3 === 0 ? foliageMid : foliageDark;
    mesh(canopyGeo, foliageMat, forest, [xDist, treeH * 0.72 + canopyR * 0.3, zDist]);
    if (i % 3 === 0) {
      const subR = canopyR * 0.7;
      mesh(createCanopy(subR), foliageMid, forest, [xDist + side * 0.6, treeH * 0.58, zDist - 0.5]);
    }
    for (let b = 0; b < 2; b++) {
      const bough = mesh(new T.CylinderGeometry(0.08, 0.16, 4.0, 8), treeBark, forest,
        [xDist - side * 1.4, treeH * 0.45 + b * 1.5, zDist]);
      bough.rotation.z = side * (Math.PI / 4.5 + b * 0.12);
    }
  }

  mesh(new T.PlaneGeometry(55, 80, 1, 1),
    new T.MeshStandardMaterial({ color: 0x071210, roughness: 0.96 }),
    forest, [0, -2.6, -18]).rotation.x = -Math.PI / 2;

  const forestMist = mesh(
    new T.PlaneGeometry(65, 50),
    new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      uniforms: { time: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float time; varying vec2 vUv;
        void main(){
          float f = smoothstep(0.1, 0.6, vUv.y) * (1.0 - smoothstep(0.55, 0.92, vUv.y));
          f *= 0.55 + 0.45 * sin(vUv.x * 4.0 + time * 0.12) * cos(vUv.y * 3.2 + time * 0.1);
          vec3 mistCol = mix(vec3(0.18, 0.32, 0.42), vec3(0.55, 0.48, 0.32), vUv.x * 0.7 + 0.15);
          gl_FragColor = vec4(mistCol, f * 0.28);
        }`
    }),
    forest, [0, 0.2, -10]
  );
  forestMist.rotation.x = -0.1;

  mesh(new T.PlaneGeometry(8, 12),
    new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv;
        void main(){
          float d = length(vUv - 0.5) * 2.0;
          float glow = exp(-d * d * 3.0) * 0.18;
          gl_FragColor = vec4(0.55, 0.65, 0.75, glow);
        }`
    }),
    forest, [0, -2.55, -4]).rotation.x = -Math.PI / 2;

  const fireflyCount = innerWidth < 700 ? 60 : 140;
  const fireflyGeo = new T.BufferGeometry();
  const ffPos = new Float32Array(fireflyCount * 3), ffSeed = new Float32Array(fireflyCount);
  for (let i = 0; i < fireflyCount; i++) {
    ffPos[i*3] = (Math.random() - 0.5) * 20;
    ffPos[i*3+1] = Math.random() * 10 - 2;
    ffPos[i*3+2] = Math.random() * -35;
    ffSeed[i] = Math.random();
  }
  fireflyGeo.setAttribute('position', new T.BufferAttribute(ffPos, 3));
  fireflyGeo.setAttribute('seed', new T.BufferAttribute(ffSeed, 1));
  const fireflyMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `uniform float time; attribute float seed; varying float a;
      void main(){
        vec3 p = position;
        p.x += sin(time * 0.5 + seed * 40.0) * 0.8;
        p.y += cos(time * 0.35 + seed * 25.0) * 0.5;
        p.z += sin(time * 0.25 + seed * 18.0) * 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float pulse = 0.4 + 0.6 * pow(abs(sin(time * 1.8 + seed * 30.0)), 3.0);
        gl_PointSize = clamp((10.0 + seed * 8.0) * pulse / -mv.z, 1.0, 4.5);
        a = pulse * (0.35 + seed * 0.5);
      }`,
    fragmentShader: `varying float a; void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 c = mix(vec3(0.75, 0.92, 0.55), vec3(0.95, 0.88, 0.45), d);
        gl_FragColor = vec4(c, (1.0 - smoothstep(0.0, 0.48, d)) * a);
      }`
  });
  const fireflies = new T.Points(fireflyGeo, fireflyMat);
  forest.add(fireflies);

  // Sacred Elephant
  const elephant = new T.Group();
  elephant.position.set(0.6, 0.2, -3.5);
  elephant.scale.setScalar(1.15);
  forest.add(elephant);

  ell(elephant, [0, 1.25, 0], [1.75, 1.85, 1.95], elephantSkin);
  ell(elephant, [-0.65, 2.1, 0.2], [0.85, 0.85, 0.9], elephantSkin);
  ell(elephant, [0.65, 2.1, 0.2], [0.85, 0.85, 0.9], elephantSkin);
  ell(elephant, [0, 1.6, 1.0], [1.25, 0.65, 0.7], elephantSkin);
  ell(elephant, [0, 0.4, -2.8], [2.3, 2.4, 3.4], elephantSkin);
  for (let w = 0; w < 4; w++) {
    ring(elephant, 0.9 + w * 0.15, 0.012, [0, 1.8 + w * 0.15, 0.6], elephantSkin).rotation.x = Math.PI / 2.5;
  }

  for (const s of [-1, 1]) {
    const earGroup = new T.Group();
    earGroup.position.set(s * 1.7, 1.2, -0.2);
    elephant.add(earGroup);
    const ear = ell(earGroup, [0, 0, 0], [0.15, 1.8, 1.35], elephantSkin);
    ear.rotation.y = s * 0.42;
    ear.rotation.z = s * -0.22;
    ell(earGroup, [s * -0.04, -0.1, 0.04], [0.08, 1.2, 0.85],
      new T.MeshStandardMaterial({ color: 0x8a6868, roughness: 0.7, metalness: 0.05 }));
  }

  for (const s of [-1, 1]) {
    ell(elephant, [s * 0.72, 1.35, 0.85], [0.1, 0.08, 0.08],
      new T.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.2, metalness: 0.4 }));
    ell(elephant, [s * 0.72, 1.37, 0.91], [0.035, 0.03, 0.03], warmGlow);
  }

  for (const s of [-1, 1]) {
    path(elephant, [
      [s * 0.60, 0.1, 1.1], [s * 0.78, -0.65, 1.8], [s * 0.92, -0.92, 2.5], [s * 0.82, -0.52, 3.1]
    ], 0.11, 0.028, elephantIvory);
    ring(elephant, 0.12, 0.02, [s * 0.75, -0.5, 1.6], gold).rotation.x = Math.PI / 3;
  }

  path(elephant, [
    [0, 0.7, 1.6], [0, -0.1, 2.1], [0, -1.1, 2.5], [0.1, -1.9, 2.9],
    [0, -2.5, 3.4], [-0.12, -2.7, 3.9], [0, -2.3, 4.3]
  ], 0.42, 0.14, elephantSkin);

  for (const [lx, lz] of [[-1.1, -0.9], [1.1, -0.9], [-1.0, -3.4], [1.0, -3.4]]) {
    mesh(new T.CylinderGeometry(0.38, 0.46, 3.4, 16), elephantSkin, elephant, [lx, -1.5, lz]);
  }

  const neti = new T.Group();
  neti.position.set(0, 1.8, 1.1);
  elephant.add(neti);
  for (let row = 0; row < 5; row++) {
    const yOff = -row * 0.26;
    const count = 5 - row;
    for (let c = 0; c < count; c++) {
      const xOff = (c - (count - 1) / 2) * 0.28;
      ell(neti, [xOff, yOff, 0.05], [0.09, 0.09, 0.04], gold);
    }
  }
  ell(neti, [0, -1.45, 0.08], [0.12, 0.16, 0.06], rubyGem);
  halo(elephant, 3.2).position.set(0, 1.3, -0.6);

  // ─── CH 7: REBIRTH — LORD GANESHA REBORN WITH SHIVA & PARVATI BESIDE HIM ───
  const reborn = ganesha(roots[7]);
  reborn.position.x = 1.6;
  const rebornHalo = halo(roots[7], 3);
  rebornHalo.position.set(1.6, 0.65, -1.1);
  temple(roots[7]);

  // Lord Shiva on left bestowing cosmic breath, Maa Parvati on right rejoicing
  const shivaCh7 = createShiva(roots[7], { mode: 'blessing', pos: [-1.4, -0.4, 0.4], scale: 1.12, rotY: 0.45 });
  const parvatiCh7 = createParvati(roots[7], { mode: 'rebirth_side', pos: [4.6, -0.4, 0.4], scale: 1.08, rotY: -0.45 });

  const restoredChild = createChildGanesha(roots[7], {mode: 'guardian', pos: [1.6,-1.1,0], scale: 1.5});
  restoredChild.head.visible = false;
  restoredChild.staff.visible = false;
  const elephantHead = new T.Group();
  roots[7].add(elephantHead);
  ell(elephantHead, [0,0,0], [.46,.52,.4], elephantSkin);
  for (const side of [-1,1]) {
    ell(elephantHead, [side*.48,0,-.06], [.3,.48,.1], elephantSkin);
    ell(elephantHead, [side*.19,.1,.36], [.035,.028,.024], obsidian);
    path(elephantHead, [[side*.2,-.18,.3],[side*.3,-.42,.5],[side*.26,-.32,.68]], .05,.008,ivory);
  }
  path(elephantHead, [[0,-.08,.35],[0,-.45,.5],[0,-.78,.56],[.2,-.9,.6]], .16,.045,elephantSkin);

  // Sacred Lotus Flowers at Base
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2, r = 3.3;
    const lotus = new T.Group();
    lotus.position.set(Math.cos(a) * r + 1.6, -2.4, Math.sin(a) * r);
    roots[7].add(lotus);
    for (let p = 0; p < 8; p++) {
      const pa = p / 8 * Math.PI * 2;
      const petal = ell(lotus, [Math.cos(pa) * 0.26, 0.06, Math.sin(pa) * 0.26], [0.15, 0.045, 0.28], paleGold);
      petal.rotation.y = -pa;
      petal.rotation.x = -0.38;
    }
    ell(lotus, [0, 0.09, 0], [0.11, 0.07, 0.11], glow);
  }

  // ─── CH 8: WISDOM — Realistic Luxury Modak, Ornate Lotus Thali & Diyas ───
  const modakGroup = new T.Group();
  modakGroup.position.set(2.8, 0.3, 0);
  roots[8].add(modakGroup);

  const modakGeo = new T.SphereGeometry(1, 96, 64);
  const mp = modakGeo.attributes.position;
  for (let i = 0; i < mp.count; i++) {
    const y = mp.getY(i);
    const a = Math.atan2(mp.getZ(i), mp.getX(i));
    const rib = 1.0 + Math.cos(a * 21.0) * 0.065;
    const taper = y > 0 ? 1.0 - y * 0.68 : 1.0;
    const twist = y > 0.4 ? (y - 0.4) * 0.35 : 0.0;
    const rotX = Math.cos(twist) * mp.getX(i) - Math.sin(twist) * mp.getZ(i);
    const rotZ = Math.sin(twist) * mp.getX(i) + Math.cos(twist) * mp.getZ(i);
    const pinchY = (y + 1.0) * 0.92 + (y > 0.65 ? (y - 0.65) * 1.8 : 0.0) - 0.85;
    mp.setXYZ(i, rotX * rib * taper, pinchY, rotZ * rib * taper);
  }
  modakGeo.computeVertexNormals();
  mesh(modakGeo, modakCream, modakGroup);
  mesh(new T.ConeGeometry(0.18, 0.45, 24), paleGold, modakGroup, [0, 1.15, 0]);

  // Royal Golden Lotus Thali
  const thali = new T.Group();
  thali.position.set(0, -0.92, 0);
  modakGroup.add(thali);

  mesh(new T.CylinderGeometry(1.65, 1.45, 0.12, 80), gold, thali);
  mesh(new T.CylinderGeometry(1.75, 1.72, 0.04, 80), paleGold, thali, [0, 0.06, 0]);
  ring(thali, 1.76, 0.024, [0, 0.07, 0], gold).rotation.x = Math.PI / 2;

  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    const p = ell(thali, [Math.cos(a) * 1.55, 0.04, Math.sin(a) * 1.55], [0.26, 0.03, 0.38], darkGold);
    p.rotation.y = -a + Math.PI / 2;
  }

  // Golden Mushaka Figurine
  const mushaka = new T.Group();
  mushaka.position.set(-1.45, 0.15, 0.6);
  mushaka.rotation.y = Math.PI / 3;
  mushaka.scale.setScalar(0.38);
  thali.add(mushaka);
  ell(mushaka, [0, 0.25, 0], [0.35, 0.32, 0.55], paleGold);
  ell(mushaka, [0, 0.45, 0.45], [0.22, 0.22, 0.32], paleGold);
  ell(mushaka, [0, 0.40, 0.72], [0.08, 0.07, 0.14], gold);
  for (const s of [-1, 1]) {
    ell(mushaka, [s * 0.22, 0.65, 0.42], [0.12, 0.14, 0.03], gold);
  }
  path(mushaka, [[0, 0.15, -0.45], [0.1, 0.25, -0.85], [0, 0.45, -1.2]], 0.035, 0.015, gold);

  // 8 Floating Golden Diya Lamps
  const diyaOrbit = new T.Group();
  roots[8].add(diyaOrbit);
  diyaOrbit.position.set(2.8, 0.2, 0);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const r = 2.45;
    const dGroup = new T.Group();
    dGroup.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    diyaOrbit.add(dGroup);
    mesh(new T.CylinderGeometry(0.14, 0.18, 0.07, 20), antiqueBronze, dGroup);
    ell(dGroup, [0, 0.12, 0], [0.035, 0.11, 0.035], warmGlow);
  }

  // Sri Yantra Geometry
  const yantra = new T.Group();
  yantra.position.set(2.8, 0.3, -0.8);
  roots[8].add(yantra);
  ring(yantra, 2.0, 0.014, [0, 0, 0], glow);
  ring(yantra, 2.5, 0.012, [0, 0, 0], darkGold);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2;
    const tri = new T.Group();
    tri.rotation.z = a;
    yantra.add(tri);
    path(tri, [[0, 1.8, 0], [-1.3, -0.9, 0], [1.3, -0.9, 0], [0, 1.8, 0]], 0.012, 0.012, glow);
  }
  halo(roots[8], 2.4).position.set(2.8, 0.3, -1.6);

  // ─── CH 9: GANESH CHATURTHI 2026 — Festive Scene & Marigold Shower ───
  const festive = ganesha(roots[9]);
  festive.position.set(1.7, 0, 0);
  halo(roots[9], 3).position.set(1.7, 0.7, -1);
  temple(roots[9]);

  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2, r = 4.6;
    const diya = new T.Group();
    diya.position.set(Math.cos(a) * r + 1.7, -2.4, Math.sin(a) * r);
    roots[9].add(diya);
    mesh(new T.CylinderGeometry(0.16, 0.22, 0.09, 18), antiqueBronze, diya);
    ell(diya, [0, 0.16, 0], [0.04, 0.13, 0.04], warmGlow);
  }

  const petalCount = innerWidth < 700 ? 200 : 420;
  const petalGeo = new T.SphereGeometry(0.075, 8, 6);
  const petalMatOrange = new T.MeshStandardMaterial({ color: 0xeb5f00, roughness: 0.55, metalness: 0.04 });
  const petals = new T.InstancedMesh(petalGeo, petalMatOrange, petalCount);
  roots[9].add(petals);
  const petalDummy = new T.Object3D();

  // ─── CH 10: VISARJAN — Oceanic Waves, Sunset Corona, Floating Offerings ───
  const farewell = ganesha(roots[10]);
  farewell.position.set(0, -0.4, 0);
  farewell.rotation.y = Math.PI;

  const water = new Water(new T.PlaneGeometry(200, 200), {
    textureWidth: innerWidth < 700 ? 256 : 512,
    textureHeight: innerWidth < 700 ? 256 : 512,
    waterNormals,
    sunDirection: new T.Vector3(0, 0.12, -1).normalize(),
    sunColor: 0xffd0a1,
    waterColor: 0x12373b,
    distortionScale: 2.8,
    fog: true,
    side: T.DoubleSide
  });
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -1.8, -16);
  roots[10].add(water);
  const waterMat = water.material;

  const underwater = new T.Group(); roots[10].add(underwater);
  const seabed = mesh(new T.PlaneGeometry(100,100,1,1),
    new T.MeshStandardMaterial({color:0x52615a, roughness:1}), underwater, [0,-9,-12]);
  seabed.rotation.x = -Math.PI/2;
  const bubbles = new T.InstancedMesh(new T.SphereGeometry(.045,8,6),
    new T.MeshPhysicalMaterial({color:0xa2dde0, transparent:true, opacity:.32, roughness:.1, metalness:.15}), 100);
  underwater.add(bubbles);
  const bubbleDummy = new T.Object3D();
  const caustic = new T.PointLight(0x73ccda, 70, 30); caustic.position.set(0,-3,2); underwater.add(caustic);

  // A soft solar disc avoids visible sphere shells in the reflection.
  const sunCanvas = document.createElement('canvas');
  sunCanvas.width = sunCanvas.height = 128;
  const sunContext = sunCanvas.getContext('2d');
  const sunlight = sunContext.createRadialGradient(64, 64, 0, 64, 64, 64);
  sunlight.addColorStop(0, '#fff4da');
  sunlight.addColorStop(0.18, '#ffe5b0');
  sunlight.addColorStop(0.22, '#ffb967bb');
  sunlight.addColorStop(0.5, '#e87b2522');
  sunlight.addColorStop(1, '#e87b2500');
  sunContext.fillStyle = sunlight;
  sunContext.fillRect(0, 0, 128, 128);
  const sun = new T.Sprite(new T.SpriteMaterial({map: new T.CanvasTexture(sunCanvas), depthWrite: false}));
  sun.position.set(0, 2.8, -46);
  sun.scale.set(16, 16, 1);
  roots[10].add(sun);

  mesh(new T.PlaneGeometry(120, 14),
    new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv; void main(){
        float band = smoothstep(0.0, 0.45, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
        float center = exp(-pow((vUv.x - 0.5) * 2.2, 2.0));
        vec3 col = mix(vec3(0.95, 0.35, 0.08), vec3(1.0, 0.75, 0.3), vUv.y);
        gl_FragColor = vec4(col, band * center * 0.35);
      }`
    }),
    roots[10], [0, -0.2, -42]);

  const floatingDiyas = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, r = 3.5 + (i % 3) * 1.2;
    const fd = new T.Group();
    fd.position.set(Math.cos(a) * r, -1.78, Math.sin(a) * r - 1.0);
    roots[10].add(fd);
    mesh(new T.CylinderGeometry(0.12, 0.16, 0.06, 16), antiqueBronze, fd);
    ell(fd, [0, 0.12, 0], [0.03, 0.09, 0.03], warmGlow);
    floatingDiyas.push({ obj: fd, seed: i, basePos: fd.position.clone() });
  }

  for (let i=0; i<4; i++) {
    const idol = ganesha(roots[9]);
    idol.position.set((i<2?-1:1)*(4+(i%2)*3), -1.4, -3-(i%2)*3);
    idol.scale.setScalar(.45+(i%2)*.12);
    idol.rotation.y = (i<2?1:-1)*.22;
  }

  // ─── AMBIENT SACRED STARDUST SYSTEM ───
  const count = innerWidth < 700 ? 1600 : 3600;
  const positions = new Float32Array(count * 3), seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i*3] = (Math.random() - 0.5) * 38;
    positions[i*3+1] = (Math.random() - 0.5) * 26;
    positions[i*3+2] = (Math.random() - 0.5) * 65;
    seeds[i] = Math.random();
  }
  const dustGeo = new T.BufferGeometry();
  dustGeo.setAttribute('position', new T.BufferAttribute(positions, 3));
  dustGeo.setAttribute('seed', new T.BufferAttribute(seeds, 1));
  const dustMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 }, tint: { value: new T.Color(0xe6bc70) }, speed: { value: 1 }, burst: { value: 0 } },
    vertexShader: `uniform float time, speed, burst; attribute float seed; varying float a;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + 13.0 + time * 0.3 * speed, 26.0) - 13.0;
        p.x += sin(time * 0.15 + seed * 40.0) * 0.3;
        p += normalize(p) * burst * 5.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((22.0 + seed * 28.0) / -mv.z, 1.0, 5.0);
        a = 0.15 + 0.45 * abs(sin(seed * 20.0 + time * 0.35));
      }`,
    fragmentShader: `uniform vec3 tint; varying float a;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(tint, (1.0 - smoothstep(0.02, 0.5, d)) * a);
      }`
  });
  const dust = new T.Points(dustGeo, dustMat);
  scene.add(dust);

  // ─── CINEMATIC THREE-POINT LIGHTING ───
  const hemi = new T.HemisphereLight(0xffecd0, 0x080908, 1.25);
  scene.add(hemi);
  const key = new T.PointLight(0xffe3b3, 115, 48, 1.4);
  const rim = new T.PointLight(0x76a3b8, 85, 42, 1.4);
  const fill = new T.PointLight(0x402b12, 45, 32, 2);
  const topRim = new T.DirectionalLight(0xfff0d0, 2.2);
  scene.add(key, rim, fill, topRim);

  // ─── CAMERA POSES (ALL 12 CHAPTERS) ───
  const poses = [
    [[0, 1.5, 15], [-3, 2.3, 11], [-1, 0.6, 0]],       // 00: Prologue
    [[4.2, 1.8, 10], [-2.4, 1.2, 8], [0, 0.1, 0]],    // 01: Creation (Maa Parvati & Child Ganesha)
    [[0, 1.5, 13], [0, 0.8, 4], [0, 0.2, -3.8]],      // 02: Guardian (Young Ganesha)
    [[-2.4, 1.4, 10], [3.2, 1.6, 8], [1.5, 0.8, 0]],   // 03: Shiva Arrival
    [[5.5, 2.8, 12], [-4.5, 1.5, 8], [0, 0.6, 0]],    // 04: The Battle (Confrontation)
    [[0, 1.4, 11], [1.8, 2.4, 8], [0, 1.0, 0]],        // 05: Shakti's Cosmic Rage
    [[0, 1.8, 8], [0.8, 1.4, 0], [0.6, 0.8, -3.5]],     // 06: The Search (Elephant in majesty)
    [[5.2, 2.0, 12], [-1.8, 1.8, 10], [1.6, 0.6, 0]],  // 07: Rebirth (Shiva, Parvati & Ganesha)
    [[-1, 2, 11], [4, 2, 8], [0, 0.5, 0]],             // 08: Wisdom / Modak
    [[-5, 3, 14], [5, 2, 12], [0, 1, 0]],              // 09: Ganesh Chaturthi
    [[4, 3, 13], [0, -0.6, 6], [0, -1.0, 0]],          // 10: Visarjan
    [[0, 1, 15], [0, 1, 15], [0, 1, 0]],               // 11: Credits
  ];

  const from = new T.Vector3(), to = new T.Vector3(), target = new T.Vector3();
  const next = new T.Vector3(), nextTarget = new T.Vector3();
  let px = 0, py = 0, burst = 0, modakHover = false;

  addEventListener('pointermove', e => {
    px = e.clientX / innerWidth - 0.5;
    py = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  function pose(i, local) {
    const row = poses[i], u = T.MathUtils.smoothstep(local, 0, 0.72);
    from.set(...row[0]); to.set(...row[1]);
    from.lerp(to, u);
    from.z -= i * 42;
    target.set(...row[2]); target.z -= i * 42;
  }

  return {
    burst() { burst = 1; },
    setModakHover(val) { modakHover = val; },
    resize() {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    },
    suspend() { renderer.clear(); },
    render(time, index, local, delta) {
      window.__renderCalls = (window.__renderCalls || 0) + 1;
      const t = time / 1000;
      const beats = storyBeats(local);
      pose(index, local);

      if (index < 11 && local > 0.74) {
        const mix = T.MathUtils.smoothstep(local, 0.74, 1);
        next.set(...poses[index + 1][0]); next.z -= (index + 1) * 42;
        nextTarget.set(...poses[index + 1][2]); nextTarget.z -= (index + 1) * 42;
        from.lerp(next, mix); target.lerp(nextTarget, mix);
      }

      if (innerWidth < 700) {
        from.z += 8;
        target.y += 0.8;
      }

      if (index === 10) {
        from.y = T.MathUtils.lerp(from.y, -5.5, beats.dive);
        target.y = T.MathUtils.lerp(target.y, -5.8, beats.dive);
      }
      camera.position.copy(from);
      camera.position.x += px * 0.32; camera.position.y -= py * 0.16;
      camera.lookAt(target);

      // Chapter-specific camera micro-movement
      if (index === 4) {
        camera.rotation.z = Math.sin(t * 18) * 0.018 + Math.sin(local * Math.PI) * 0.04;
        camera.position.y += Math.sin(t * 24) * 0.06;
      } else if (index === 5) {
        camera.rotation.z = Math.sin(t * 14) * 0.02;
        camera.position.x += Math.cos(t * 16) * 0.05;
      } else {
        camera.rotation.z = 0;
      }

      roots.forEach((root, i) => root.visible = Math.abs(i - index) <= 1);

      // Dynamic cinematic lighting
      key.position.set(4, 6, camera.position.z - 4);
      rim.position.set(-6, 3, camera.position.z - 10);
      fill.position.set(0, 0, camera.position.z + 2);
      topRim.position.set(camera.position.x + 3, camera.position.y + 7, camera.position.z + 5);
      topRim.target.position.set(target.x, target.y, target.z);
      topRim.target.updateMatrixWorld();

      if (index === 5) {
        key.color.setHex(0xff2800); key.intensity = 190;
        rim.color.setHex(0xa01200); rim.intensity = 130;
        topRim.color.setHex(0xff9930); topRim.intensity = 2.8;
        scene.fog.color.setHex(0x120404);
      } else if (index === 2 || index === 3) {
        key.color.setHex(0xc0d8f0); key.intensity = 110;
        rim.color.setHex(0x2a5578); rim.intensity = 75;
        topRim.color.setHex(0xbcd8f5); topRim.intensity = 2.2;
        scene.fog.color.setHex(0x040810);
      } else if (index === 6) {
        key.color.setHex(0x8ab0c8); key.intensity = 75;
        rim.color.setHex(0x284f68); rim.intensity = 55;
        topRim.color.setHex(0x9cc8e0); topRim.intensity = 1.8;
        scene.fog.color.setHex(0x040809); scene.fog.density = 0.028;
      } else if (index === 10) {
        key.color.setHex(0xff9050); key.intensity = 115;
        rim.color.setHex(0x2a4a6a); rim.intensity = 55;
        topRim.color.setHex(0xffb050); topRim.intensity = 2.4;
        scene.fog.color.setHex(0x040910);
      } else {
        key.color.setHex(0xffd092); key.intensity = 130;
        rim.color.setHex(0x4a7ea5); rim.intensity = 90;
        topRim.color.setHex(0xfff0d0); topRim.intensity = 2.2;
        scene.fog.color.setHex(0x040607); scene.fog.density = 0.018;
      }

      // ─── CHOREOGRAPHY & ANIMATIONS ───
      heroHalo.rotation.z = t * 0.012;
      incenseMat.uniforms.time.value = t;

      // Chapter 1: Maa Parvati sculpting Child Ganesha
      parvatiCh1.update(t, local);
      childCh1.update(t, local);
      pranaMat.uniforms.time.value = t;
      fogPlane.material.uniforms.time.value = t;

      // Chapter 2: Young Ganesha guarding the gate
      door.scale.x = Math.max(0.02, 1.0 - local * 0.9);
      guardianCh2.update(t, local);

      // Chapter 3: Lord Shiva arrives
      shivaCh3.update(t, local);
      snowMat.uniforms.time.value = t;

      // Chapter 4: The Battle
      battle.rotation.set(0,0,0);
      shivaCh4.update(t,local);
      shivaCh4.rightArm.rotation.z = -beats.windup*1.2 + beats.flight*1.65;
      shivaCh4.trishul.visible = local < .26;
      flyingTrishul.visible = local >= .26 && local < .52;
      flyingTrishul.position.set(3.4 - beats.flight*3.2, .75 + Math.sin(beats.flight*Math.PI)*.45, .25);
      impactLight.intensity = local >= .48 && local < .54 ? 90 : 0;
      guardianCh4.head.visible = local < .5;
      guardianCh4.group.rotation.z = beats.fall*1.45;
      guardianCh4.group.position.y = -.8 - beats.fall*1.25;
      guardianCh4.staff.rotation.z = beats.fall*1.2;
      fallenWeapon.visible = local > .53;

      // Chapter 5: Maa Shakti's Cosmic Rage
      shaktiCh5.update(t, local);
      orbitals.forEach((r, i) => {
        r.rotation.y = t * 0.18 + i + local * 2.5;
        r.rotation.x = Math.sin(t * 0.45 + i) * 0.45;
      });
      emberMat.uniforms.time.value = t;
      embers.visible = index === 5;

      // Chapter 6: The Forest & Elephant
      fireflies.visible = index === 6;
      fireflyMat.uniforms.time.value = t;
      elephant.position.y = 0.2 + Math.sin(t * 1.1) * 0.05;
      forestMist.material.uniforms.time.value = t;

      // Chapter 7: Rebirth
      restoredChild.group.visible = local < .6;
      restoredChild.group.rotation.z = (1-beats.restore)*1.15;
      restoredChild.group.position.y = -1.1 - (1-beats.restore)*.8;
      elephantHead.visible = local < .6;
      elephantHead.position.set(1.6, 4.5 - beats.restore*3.75, .1);
      elephantHead.scale.setScalar(1.5);
      reborn.visible = local >= .55;
      reborn.scale.setScalar(.85 + beats.awaken*.15);
      rebornHalo.rotation.z = local * 0.3;
      shivaCh7.update(t, local);
      parvatiCh7.update(t, local);
      if (rebirthDust) {
        const assemble = T.MathUtils.clamp(local / 0.3, 0, 1);
        rebirthDust.visible = index === 7 && local < 0.4;
        rebirthDust.material.uniforms.scatter.value = 1.0 - assemble;
        rebirthDust.material.uniforms.opacity.value = 1.0 - T.MathUtils.smoothstep(local, 0.25, 0.4);
        sculptureHolders[1].visible = index !== 7 || local > 0.25;
      }

      // Chapter 8: Modak Scene
      const hs = modakHover ? 2.5 : 1.0;
      modakGroup.rotation.y = t * 0.2 * hs + local * 2.0;
      modakGroup.position.y = 0.3 + Math.sin(t * 1.5) * 0.1;
      modakGroup.scale.setScalar(1.0 - burst * 0.12 + (modakHover ? 0.06 : 0));
      diyaOrbit.rotation.y = t * 0.15;
      yantra.rotation.z = t * 0.12;

      // Chapter 9: Ganesh Chaturthi 2026 Marigold shower
      if (index === 9) {
        for (let i = 0; i < petalCount; i++) {
          const pt = t * 0.5 + i * 0.1;
          petalDummy.position.set(
            Math.sin(i * 12.4 + pt * 0.45) * 7.5,
            ((i * 0.26 - pt * 1.0) % 14 + 14) % 14 - 4,
            Math.cos(i * 8.2 + pt * 0.28) * 6.5
          );
          petalDummy.rotation.set(pt + i, i * 0.7, pt * 0.7);
          petalDummy.scale.set(1, 0.3, 1.3);
          petalDummy.updateMatrix();
          petals.setMatrixAt(i, petalDummy.matrix);
        }
        petals.instanceMatrix.needsUpdate = true;
      }

      // Chapter 10: Visarjan ocean immersion
      farewell.position.y = -0.4 - beats.dive * 4.8;
      underwater.visible = index === 10 && beats.dive > .2;
      if (index === 10) {
        const submerged = camera.position.y < -1.8;
        scene.fog.color.setHex(submerged ? 0x07343e : 0x040910);
        scene.fog.density = submerged ? .075 : .018;
        scene.background.setHex(submerged ? 0x07343e : 0x040607);
        key.color.setHex(submerged ? 0x86c9cf : 0xff9050);
        for (let i=0;i<100;i++) {
          bubbleDummy.position.set(Math.sin(i*12.98)*6, -8+((t*.4+i*.67)%6), -5+Math.cos(i*7.1)*5);
          bubbleDummy.scale.setScalar(.5+(i%5)*.3);
          bubbleDummy.updateMatrix(); bubbles.setMatrixAt(i,bubbleDummy.matrix);
        }
        bubbles.instanceMatrix.needsUpdate = true;
      } else scene.background.setHex(0x040607);
      waterMat.uniforms.time.value = t * 0.35;
      gauriKundWater.material.uniforms.time.value = t * 0.16;
      floatingDiyas.forEach(fd => {
        fd.obj.position.y = fd.basePos.y + Math.sin(t * 1.5 + fd.seed) * 0.08;
      });

      if (farewellDust) {
        const dissolve = T.MathUtils.smoothstep(local, 0.65, 0.95);
        farewellDust.visible = index === 10 && local > 0.65;
        farewellDust.material.uniforms.time.value = t;
        farewellDust.material.uniforms.scatter.value = dissolve;
        farewellDust.material.uniforms.opacity.value = 1.0 - dissolve * 0.6;
        sculptureHolders[3].visible = index !== 10 || local < 0.82;
      }

      dust.position.z = camera.position.z - 18;
      dust.rotation.y = t * 0.004;
      dustMat.uniforms.time.value = t;
      dustMat.uniforms.tint.value.setHex(
        index === 5 ? 0xff5518 : index === 6 ? 0x8aaab8 : index === 10 ? 0xffb040 : 0xe6bc70
      );
      dustMat.uniforms.speed.value = index === 5 ? 4 : index === 10 ? -0.5 : 1;
      burst = Math.max(0, burst - delta * 0.5);
      dustMat.uniforms.burst.value = burst;

      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }
  };
}
