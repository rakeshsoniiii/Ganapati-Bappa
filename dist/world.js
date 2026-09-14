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
    color: 0xffc94a, metalness: 0.95, roughness: 0.18,
    emissive: 0x8a5a00, emissiveIntensity: 0.12
  });
  const paleGold = new T.MeshStandardMaterial({
    color: 0xe8c87a, metalness: 0.62, roughness: 0.42,
    emissive: 0x5a3a00, emissiveIntensity: 0.08
  });
  const darkGold = new T.MeshStandardMaterial({
    color: 0xb87a1a, metalness: 0.88, roughness: 0.28,
    emissive: 0x3a1a00, emissiveIntensity: 0.06
  });
  const antiqueBronze = new T.MeshStandardMaterial({
    color: 0xcd8d4a, metalness: 0.88, roughness: 0.30,
    emissive: 0x3a1800, emissiveIntensity: 0.05
  });
  const ivory = new T.MeshStandardMaterial({
    color: 0xfff4e0, metalness: 0.06, roughness: 0.30,
    emissive: 0x3a2a00, emissiveIntensity: 0.04
  });
  const modakCream = new T.MeshStandardMaterial({
    color: 0xfffbe8, metalness: 0.06, roughness: 0.22,
    emissive: 0x1a1000, emissiveIntensity: 0.04
  });
  // Deep lapis lazuli for temple/pedestal dark tiers (replaces near-black obsidian)
  const obsidian = new T.MeshStandardMaterial({
    color: 0x1a1f5c, metalness: 0.30, roughness: 0.72,
    emissive: 0x0a0a2a, emissiveIntensity: 0.18
  });
  // Warm sandstone for temple columns (replaces cold dark grey)
  const stoneGray = new T.MeshStandardMaterial({
    color: 0xc4906a, metalness: 0.18, roughness: 0.72,
    emissive: 0x1a0800, emissiveIntensity: 0.04
  });
  const crimson = new T.MeshStandardMaterial({
    color: 0xd42020, metalness: 0.30, roughness: 0.38,
    emissive: 0x5a0000, emissiveIntensity: 0.15
  });
  const rubyGem = new T.MeshStandardMaterial({
    color: 0xff1e30, metalness: 0.55, roughness: 0.08,
    emissive: 0x8a0010, emissiveIntensity: 0.25
  });
  const glow = new T.MeshBasicMaterial({ color: 0xffe566 });
  const fireGlow = new T.MeshBasicMaterial({ color: 0xff5500 });
  const warmGlow = new T.MeshBasicMaterial({ color: 0xffcc44 });

  // Sacred Deity PBR Materials (Museum Bronze & Rock-Cut Stone Patina)
  const shivaSkin = new T.MeshStandardMaterial({
    color: 0x3a78c4, metalness: 0.0, roughness: 0.62,   // cobalt Neelkantha (procedural parts)
    emissive: 0x001840, emissiveIntensity: 0.18, side: T.DoubleSide
  });
  const parvatiSkin = new T.MeshStandardMaterial({
    color: 0xe8724a, metalness: 0.0, roughness: 0.60,   // saffron-rose Chola bronze
    emissive: 0x5a1400, emissiveIntensity: 0.14, side: T.DoubleSide
  });
  const sareeCrimson = new T.MeshStandardMaterial({
    color: 0xcc1a1a, metalness: 0.0, roughness: 0.72,   // vivid vermillion saree
    emissive: 0x5a0000, emissiveIntensity: 0.12, side: T.DoubleSide
  });
  const sareeGoldBorder = new T.MeshStandardMaterial({
    color: 0xffd040, metalness: 0.96, roughness: 0.14,  // bright temple gold border
    emissive: 0x6a3000, emissiveIntensity: 0.10, side: T.DoubleSide
  });
  const shaktiArmor = new T.MeshStandardMaterial({
    color: 0xc42020, metalness: 0.22, roughness: 0.55,  // vivid crimson-scarlet Shakti armor
    emissive: 0x6a0000, emissiveIntensity: 0.20, side: T.DoubleSide
  });
  const tigerSkin = new T.MeshStandardMaterial({
    color: 0xd4823a, metalness: 0.0, roughness: 0.85,   // vivid tawny tiger
    emissive: 0x2a0800, emissiveIntensity: 0.06, side: T.DoubleSide
  });
  const trinetraGlow = new T.MeshBasicMaterial({ color: 0x00e8ff });  // vivid cyan third eye
  const chandraSilver = new T.MeshStandardMaterial({
    color: 0xe8f4ff, metalness: 0.98, roughness: 0.06,  // bright silver-white crescent moon
    emissive: 0x0a1a2a, emissiveIntensity: 0.08
  });
  const vasukiGreen = new T.MeshStandardMaterial({
    color: 0x1a5c28, metalness: 0.72, roughness: 0.28,  // vivid emerald serpent
    emissive: 0x002a08, emissiveIntensity: 0.12
  });

  // Sacred Elephant PBR materials
  const elephantSkin = new T.MeshStandardMaterial({
    color: 0x7a8fa0,            // warm divine grey — sacred elephant with celestial blue tint
    metalness: 0.18,
    roughness: 0.68,
    emissive: 0x0a1020,
    emissiveIntensity: 0.10
  });
  const elephantIvory = new T.MeshStandardMaterial({
    color: 0xfff0c8,            // warm ivory-cream tusks
    metalness: 0.22,
    roughness: 0.28,
    emissive: 0x1a1000,
    emissiveIntensity: 0.05
  });

  // Himalayan Kailash terrain materials
  const snowCap = new T.MeshStandardMaterial({
    color: 0xeef6ff, metalness: 0.08, roughness: 0.65,  // bright glacial white-blue
    emissive: 0x0a1828, emissiveIntensity: 0.06
  });
  const rockFace = new T.MeshStandardMaterial({
    color: 0x4a3a2e, metalness: 0.24, roughness: 0.88,  // warm brown-slate rock
    emissive: 0x0a0500, emissiveIntensity: 0.03
  });
  const treeBark = new T.MeshStandardMaterial({
    color: 0x2a1a0e, metalness: 0.06, roughness: 0.94   // deep warm bark brown
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

  // STL carries shape only. Spatial paint masks supply a restrained devotional palette.
  // ponytail: these masks approximate garment boundaries; authored UV textures replace them for close-up film work.
  function paintDeity(geo, kind, axis = 'y') {
    geo.computeBoundingBox();
    const bb = geo.boundingBox, attr = geo.attributes.position;
    const height = bb.max[axis]-bb.min[axis], width = bb.max.x-bb.min.x;
    const centerX = (bb.max.x+bb.min.x)/2;
    // Palette: [skin/body, garment/cloth, dark accent]
    const palette = {
      shiva:        [0x3a72b8, 0xd4882a, 0x1a1e28],  // deeper cobalt | saffron dhoti | dark
      parvati:      [0xe8c4a0, 0xc8182e, 0x1a0c10],  // warm wheat skin | vermillion saree | blouse
      shakti:       [0xe8c4a0, 0xaa0e1c, 0x280810],
      child:        [0xf0d4a8, 0xc88a10, 0x28180c],  // warm ivory skin | golden dhoti
      headless:     [0xf0d4a8, 0xc88a10, 0x28180c],
      ganesha:      [0xd4906a, 0xc01c2c, 0x3a1820],
      elephantHead: [0xb0bcc8, 0xe0a080, 0x1c1418],  // warmer blue-grey | vivid rose ear | shadow
      elephant:     [0x9aaab8, 0xd09070, 0x1c1a18],
      mushaka:      [0x9a6840, 0xf5e5c8, 0x1e100a],
    }[kind];
    const colors = palette.map(c=>new T.Color(c));
    const goldColor    = new T.Color(0xe0a830);   // warm temple gold
    const silverColor  = new T.Color(0xd8eaf8);   // cool crescent silver
    const out = new Float32Array(attr.count*3);
    for (let i=0;i<attr.count;i++) {
      const h = ((axis==='z'?attr.getZ(i):attr.getY(i))-bb.min[axis])/height*(kind==='headless'?.72:1);
      const signedX = (attr.getX(i)-centerX)/width, x = Math.abs(signedX);
      const depthValue = axis==='z'?-attr.getY(i):attr.getZ(i);
      const front = axis==='z' ? depthValue > -(bb.min.y+bb.max.y)/2 : depthValue > (bb.min.z+bb.max.z)/2;
      let c=colors[0].clone();
      if (kind==='parvati'||kind==='shakti') {
        // Saree covers hips-to-shoulder, blouse at chest, gold crown zone
        const hem      = 0.10 + 0.02*Math.cos(signedX*12);
        const neckline = 0.68 + signedX*0.20;
        const halfW    = (kind==='parvati') ? 0.24+Math.max(0,0.55-h)*0.48 : 0.14+Math.max(0,0.60-h)*0.32;
        if (h>hem && h<neckline && x<halfW)          c=colors[1].clone();
        if (h>0.62 && h<0.82 && x>0.14 && x<0.28)  c=colors[2].clone(); // blouse band
        if (h>0.88 && x<0.26)                        c=goldColor.clone(); // crown
      } else if(kind==='elephantHead') {
        // Ear flush: warm rose on wide outer ear, shadow under eye ridge
        const earZone = T.MathUtils.smoothstep(x,0.30,0.46)*(1-T.MathUtils.smoothstep(h,0.60,0.78))*T.MathUtils.smoothstep(h,0.35,0.52);
        const eyeRidge= T.MathUtils.smoothstep(h,0.70,0.80)*(1-T.MathUtils.smoothstep(x,0.0,0.18));
        c=colors[0].clone().lerp(colors[1],front?earZone*0.5:0).lerp(colors[2],eyeRidge*0.6);
        if (h>0.90) c=goldColor.clone(); // gold crown/matha
      } else if(kind==='elephant') {
        const earTint = T.MathUtils.smoothstep(x,0.28,0.44)*(1-T.MathUtils.smoothstep(h,0.62,0.80))*T.MathUtils.smoothstep(h,0.36,0.52);
        c=colors[0].clone().lerp(colors[1],front?earTint*0.42:0);
      } else if(kind==='mushaka') {
        // Belly lighter towards front, dark shadow on back/top
        const belly = front ? T.MathUtils.smoothstep(h,0.0,0.35)*(1-T.MathUtils.smoothstep(x,0.0,0.22)) : 0;
        const shadow = (1-front) ? 0.3 : 0;
        c=colors[0].clone().lerp(colors[1],belly*0.55).lerp(colors[2],shadow);
      } else if(kind==='shiva') {
        // Dhoti from hips down, dark waistband, gold jata-crown above shoulders
        const hem = 0.20+0.08*(1-Math.min(1,x/0.22));
        if (h>hem && h<0.44 && x<0.30)               c=colors[1].clone(); // saffron dhoti
        if (h>0.88 || (h>0.66&&h<0.88&&x>0.11&&x<0.25)) c=colors[2].clone(); // dark marks
        if (signedX<-0.38) c=goldColor.clone(); // trishul/weapon side
        if (h>0.91) c=silverColor.clone(); // top of Jata = silver-white ash
      } else {
        // child / headless / ganesha
        const hem = 0.11+0.03*Math.cos(signedX*14);
        if (h>hem && h<0.44-0.04*x && x<(h<0.32?0.44:0.28)) c=colors[1].clone();
        if ((kind==='child'||kind==='headless') && h>0.88) c=colors[2].clone();
        if (kind==='ganesha' && h>0.84 && x<0.26) c=goldColor.clone();
      }
      c.toArray(out,i*3);
    }
    geo.setAttribute('color',new T.BufferAttribute(out,3));
    return new T.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.68,
      metalness: 0.06,
      side: T.DoubleSide,
      envMapIntensity: 0.8
    });
  }

  const detailLoads = new Map();
  function addDetail(file, height, parent, kind, material) {
    if(!detailLoads.has(file)) detailLoads.set(file,new STLLoader().loadAsync('./assets/'+file).then(geo=>{
      geo.deleteAttribute('normal'); geo=mergeVertices(geo,.00001); geo.computeVertexNormals();
      geo.rotateX(-Math.PI/2); geo.center(); geo.computeBoundingBox();
      return geo;
    }));
    detailLoads.get(file).then(source=>{
      const geo=source.clone(), size=new T.Vector3(); source.boundingBox.getSize(size);
      geo.scale(height/size.y,height/size.y,height/size.y); geo.translate(0,height/2,0);
      parent.add(new T.Mesh(geo,kind?paintDeity(geo,kind):material));
    }).catch(error=>console.error('Could not load '+file,error));
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

  new STLLoader().load('./assets/Ganesh Ji.stl', geometry => {
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

    const ganeshaMat = paintDeity(geometry, 'ganesha');
    for (const holder of sculptureHolders) {
      mesh(geometry, ganeshaMat, holder);
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

  // ────────────────────────────────────────────────────────────────────────────
  // ─── MAA PARVATI (DIVINE MOTHER — CHOLA BRONZE & TEMPLE SCULPTURE) ───
  function createParvati(parent, options = {}) {
    const { mode = 'standing', pos = [0, 0, 0], scale = 1, rotY = 0 } = options;
    const g = new T.Group();
    g.position.set(...pos);
    g.scale.setScalar(scale);
    g.rotation.y = rotY;
    parent.add(g);

    // Radiating Floral Prabhavali (divine halo — procedural accent)
    const prabhavali = halo(g, 1.45);
    prabhavali.position.set(0, 1.70, -0.35);

    // Arm anchor groups so existing animation code still works
    const leftArm = new T.Group();
    leftArm.position.set(-0.35, 1.05, 0.02);
    g.add(leftArm);
    const rightArm = new T.Group();
    rightArm.position.set(0.35, 1.05, 0.02);
    g.add(rightArm);

    // Load the high-quality STL body
    const stlLoader = new STLLoader();
    stlLoader.load('./assets/Parvati.stl', (geo) => {
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      // After -90° X rotation: Y_world = Z_model, height = Z extent
      const modelHeight = bb.max.z - bb.min.z;
      const fitScale = 4.0 / modelHeight;
      const centreX = (bb.max.x + bb.min.x) / 2;
      const centreY = (bb.max.y + bb.min.y) / 2;
      geo.translate(-centreX, -centreY, -bb.min.z);

      const bodyMesh = new T.Mesh(geo, paintDeity(geo, 'parvati', 'z'));
      bodyMesh.scale.setScalar(fitScale);
      // STL exported Z-up: rotate -90° on X to stand upright, then face camera (+Z)
      bodyMesh.rotation.x = -Math.PI / 2;
      bodyMesh.position.y = -2.0;
      g.add(bodyMesh);

      // Reposition accessories to match the loaded model proportions
      const totalH = modelHeight * fitScale;
      leftArm.position.y  = totalH * 0.68 - 2.0;
      rightArm.position.y = totalH * 0.68 - 2.0;
      prabhavali.position.y = totalH * 0.82 - 2.0;
    });

    return {
      group: g,
      prabhavali,
      rightArm,
      leftArm,
      update(t, local) {
        prabhavali.rotation.z = t * 0.012;
        rightArm.rotation.z = -0.12 + Math.sin(t * 0.8) * 0.15;
        leftArm.rotation.z  =  0.12 - Math.sin(t * 0.8 + 0.6) * 0.15;
        if (mode === 'creation') {
          g.position.y = pos[1] + Math.sin(t * 1.4) * 0.035;
        }
      }
    };
  }
  function createShiva(parent, options = {}) {
    const { mode = 'arrival', pos = [0, 0, 0], scale = 1, rotY = 0 } = options;
    const g = new T.Group();
    g.position.set(...pos);
    g.scale.setScalar(scale);
    g.rotation.y = rotY;
    parent.add(g);

    // Cosmic Prabhavali Halo (retained as a divine accent)
    const shivaHalo = halo(g, 1.85);
    shivaHalo.position.set(0, 2.38, -0.40);

    // Arm anchor groups (used by battle / blessing animations)
    const rightArm = new T.Group();
    rightArm.position.set(0.51, 1.65, 0.04);
    g.add(rightArm);
    const leftArm = new T.Group();
    leftArm.position.set(-0.51, 1.65, 0.04);
    g.add(leftArm);

    const shivaTrishul = new T.Group(); g.add(shivaTrishul);
    shivaTrishul.position.set(1.3,-1.3,.4);
    const damru = new T.Group(); shivaTrishul.add(damru);
    // The actor scan already includes a trident; the separate mesh is reserved for flight.
    shivaTrishul.visible=false;

    // Load the high-quality STL body
    const stlLoader = new STLLoader();
    stlLoader.load('./assets/Shiva.stl', (geo) => {
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      // After -90° X rotation: Y_world = Z_model, height = Z extent
      const modelHeight = bb.max.z - bb.min.z;
      const fitScale = 4.8 / modelHeight;
      const centreX = (bb.max.x + bb.min.x) / 2;
      const centreY = (bb.max.y + bb.min.y) / 2;
      geo.translate(-centreX, -centreY, -bb.min.z);

      const bodyMesh = new T.Mesh(geo, paintDeity(geo, 'shiva', 'z'));
      bodyMesh.scale.setScalar(fitScale);
      // STL exported Z-up: rotate -90° on X to stand upright, then face camera (+Z)
      bodyMesh.rotation.x = -Math.PI / 2;
      bodyMesh.position.y = -2.0;
      g.add(bodyMesh);

      // Reposition accessories to match the loaded model proportions
      const totalH = modelHeight * fitScale;
      rightArm.position.y  = totalH * 0.70 - 2.0;
      leftArm.position.y   = totalH * 0.70 - 2.0;
      shivaHalo.position.y = totalH * 0.88 - 2.0;
      shivaTrishul.position.set(totalH * 0.28, totalH * 0.10 - 2.0, 0.45);
    });

    return {
      group: g,
      rightArm,
      leftArm,
      trishul: shivaTrishul,
      damru,
      shivaHalo,
      update(t, local) {
        rightArm.rotation.z = Math.sin(t * 0.7) * 0.12;
        leftArm.rotation.x  = Math.sin(t * 0.8 + 1) * 0.1;
        if (mode === 'blessing') rightArm.rotation.x = -0.35 - Math.sin(t * 0.7) * 0.12;
        damru.rotation.y    = t * 0.8;
        shivaHalo.rotation.z = -t * 0.06;
      }
    };
  }
// ─── MAA SHAKTI (ADI PARASHAKTI — ANGRY MAA PARVATI STL MODEL) ───
  function createShakti(parent) {
    const g = new T.Group();
    g.position.set(0, 0.8, 0);
    parent.add(g);

    // Floating Cosmic Pedestal — kept for dramatic staging
    lathe(g, [[0, -2.2], [1.15, -2.2], [1.25, -2.05], [1.05, -1.95], [0, -1.95]], obsidian);
    ring(g, 1.28, 0.035, [0, -2.0, 0], fireGlow).rotation.x = Math.PI / 2;

    // Blazing Double Prabhavali with 24 Solar Rays — retained as cosmic accent
    const shaktiHalo = new T.Group();
    shaktiHalo.position.set(0, 2.0, -0.40);
    g.add(shaktiHalo);
    ring(shaktiHalo, 1.95, 0.028, [0, 0, 0], fireGlow);
    ring(shaktiHalo, 2.35, 0.020, [0, 0, 0], warmGlow);
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      const ray = mesh(new T.ConeGeometry(0.11, 0.75, 8), fireGlow, shaktiHalo, [Math.cos(a) * 2.45, Math.sin(a) * 2.45, 0]);
      ray.rotation.z = a - Math.PI / 2;
    }

    // Load the Angry Maa Parvati (2) STL model
    const stlLoader = new STLLoader();
    stlLoader.load('./assets/Angry Maa Parvati (2).stl', (geo) => {
      geo.deleteAttribute('normal');
      geo = mergeVertices(geo, 0.00001);
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      // Fit to ~5 world-units tall; STL may be Z-up so rotate -90° on X
      const modelHeight = bb.max.z - bb.min.z;
      const modelHeightY = bb.max.y - bb.min.y;
      const useZUp = modelHeight > modelHeightY;
      const fitH = 5.0;
      const fitDim = useZUp ? modelHeight : modelHeightY;
      const fitScale = fitH / fitDim;
      const centreX = (bb.max.x + bb.min.x) / 2;
      const centreY = (bb.max.y + bb.min.y) / 2;
      const centreZ = (bb.max.z + bb.min.z) / 2;
      if (useZUp) {
        geo.translate(-centreX, -centreY, -bb.min.z);
      } else {
        geo.translate(-centreX, -bb.min.y, -centreZ);
      }

      const bodyMesh = new T.Mesh(geo, paintDeity(geo, 'shakti', useZUp ? 'z' : 'y'));
      bodyMesh.scale.setScalar(fitScale);
      if (useZUp) bodyMesh.rotation.x = -Math.PI / 2;
      bodyMesh.position.y = -2.0;
      g.add(bodyMesh);

      // Reposition halo to top of loaded model
      const totalH = fitH;
      shaktiHalo.position.y = totalH * 0.88 - 2.0;
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

  // ─── CHILD GANESHA — Story-accurate model selection ───
  //
  // ACT I  (Ch01 Creation) — Human Head Ganesha.stl  : Parvati sculpts a human child
  // ACT II (Ch02 Promise)  — Human Head Ganesha.stl  : young human Ganesha stands guard
  // ACT III(Ch04 Battle)   — Human Head Ganesha.stl  : head group hidden on decapitation
  // ACT VI (Ch07 Rebirth)  — headless body + elephant head separately (handled in Ch07 section)
  //
  // The STL is split at a Y cut-plane so 'head' and 'body' remain animatable independently.
  const childGaneshaHolders = []; // { head, body, mode }

  new STLLoader().load('./assets/Human Head Ganesha.stl', (geo) => {
    geo.deleteAttribute('normal');
    geo = mergeVertices(geo, 0.00001);
    geo.computeVertexNormals();
    geo.rotateX(-Math.PI / 2);
    geo.center();
    geo.computeBoundingBox();
    const size = new T.Vector3();
    geo.boundingBox.getSize(size);

    for (const { head, body, mode } of childGaneshaHolders) {
      const cloned = geo.clone();
      const fitH = mode === 'creation' ? 3.2 : 3.8;
      const s = fitH / size.y;
      cloned.scale(s, s, s);
      cloned.translate(0, fitH * 0.5, 0);   // floor geometry at y=0

      // Split into head (above cut) and body (below cut) for independent animation
      const mat = paintDeity(cloned, 'child');
      const posAttr = cloned.attributes.position;
      const idxArr  = cloned.index ? cloned.index.array : null;

      if (idxArr) {
        const cutY = fitH * 0.70;  // neck cut at 70% height
        const headIdx = [], bodyIdx = [];
        for (let i = 0; i < idxArr.length; i += 3) {
          const ay = posAttr.getY(idxArr[i]);
          const by = posAttr.getY(idxArr[i+1]);
          const cy = posAttr.getY(idxArr[i+2]);
          const midY = (ay + by + cy) / 3;
          (midY > cutY ? headIdx : bodyIdx).push(idxArr[i], idxArr[i+1], idxArr[i+2]);
        }
        const headGeo = cloned.clone(); headGeo.setIndex(headIdx);
        const bodyGeo = cloned.clone(); bodyGeo.setIndex(bodyIdx);
        headGeo.computeBoundingBox();
        bodyGeo.computeBoundingBox();
        head.add(new T.Mesh(headGeo, mat));
        body.add(new T.Mesh(bodyGeo, mat));
      } else {
        // Non-indexed: add whole mesh to body, head stays empty (safe fallback)
        body.add(new T.Mesh(cloned, mat));
      }
    }
  }, undefined, err => console.warn('Human Head Ganesha STL failed to load', err));

  function createChildGanesha(parent, options = {}) {
    const { mode = 'creation', pos = [0, 0, 0], scale = 1, rotY = 0 } = options;
    const g = new T.Group();
    g.position.set(...pos);
    g.scale.setScalar(scale);
    g.rotation.y = rotY;
    parent.add(g);

    // Stone base disc sits flat on the temple floor — group y=-2.65, floor top=-2.65
    // disc centre at y=0 inside group = world y=-2.65 = exactly flush with floor
    mesh(new T.CylinderGeometry(0.72, 0.80, 0.10, 32), stoneGray, g, [0, 0.05, 0]);
    mesh(new T.CylinderGeometry(0.78, 0.72, 0.04, 32), gold, g, [0, 0.11, 0]);

    // No sphere heartGlow — divine light comes from prana particles instead
    const heartGlow = { visible: false, scale: { setScalar: () => {} } }; // stub so update() refs don't break

    // Body group — lower half of Human Head Ganesha STL
    const body = new T.Group();
    g.add(body);

    // Head group — upper half of Human Head Ganesha STL; animated independently in Ch04
    const head = new T.Group();
    g.add(head);

    childGaneshaHolders.push({ head, body, mode });

    // Guardian staff — positioned to the RIGHT side of the body, not through it
    const staff = new T.Group();
    staff.position.set(0.85, 0.0, 0.0);   // clearly to the right, same floor level
    g.add(staff);
    mesh(new T.CylinderGeometry(0.042, 0.052, 3.4, 16), treeBark, staff, [0, 1.7, 0]);
    mesh(new T.ConeGeometry(0.12, 0.36, 14), sareeGoldBorder, staff, [0, 3.55, 0]);
    ring(staff, 0.080, 0.018, [0, 3.35, 0], sareeGoldBorder).rotation.x = Math.PI / 2;
    ring(staff, 0.075, 0.016, [0, 0.1, 0], antiqueBronze).rotation.x = Math.PI / 2;
    staff.visible = mode !== 'creation';

    if (mode === 'creation') {
      return {
        group: g, heartGlow, head, body,
        update(t, local) {
          const pulse = Math.sin(t * 3.5) * 0.025;
          g.scale.set(scale * (1 + pulse), scale * (1 + pulse * 1.4), scale * (1 + pulse));
          heartGlow.scale.setScalar(0.8 + Math.sin(t * 4.0) * 0.3);
          heartGlow.visible = local < 0.75;
          // Gentle head sway — child looks curiously at mother
          head.rotation.y = Math.sin(t * 0.5) * 0.08;
        }
      };
    } else {
      return {
        group: g, staff, head, body,
        update(t, local) {
          head.rotation.y = Math.sin(t * 0.6) * 0.06;
        }
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

  // ══════════════════════════════════════════════════════
  // ── DIVINE PRANA LIGHT — massive golden flow from Maa's hands to Ganesha ──
  // Parvati at pos[-1.4, -0.5] scale=1.15 → left palm  ≈ (-2.0,  0.90, 0.5)
  //                                          right palm ≈ (-0.90, 0.75, 0.6)
  // Ganesha at pos[ 1.2, -1.0] scale=1.15 → chest/heart≈ ( 1.40, 1.70, 0.3)
  // ══════════════════════════════════════════════════════

  // ── STREAM A: main golden river — 2400 large soft orbs ──
  const pranaCount  = 2400;
  const pranaGeo    = new T.BufferGeometry();
  const pranaSeed   = new Float32Array(pranaCount);
  const pranaStream = new Float32Array(pranaCount); // 0=left hand  1=right hand
  for (let i = 0; i < pranaCount; i++) { pranaSeed[i] = i / pranaCount; pranaStream[i] = i % 2; }
  pranaGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(pranaCount*3), 3));
  pranaGeo.setAttribute('seed',     new T.BufferAttribute(pranaSeed,   1));
  pranaGeo.setAttribute('stream',   new T.BufferAttribute(pranaStream, 1));

  const pranaMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `
      uniform float time; attribute float seed; attribute float stream;
      varying float vLife; varying float vS;
      vec3 bez(vec3 a,vec3 b,vec3 c,float t){return mix(mix(a,b,t),mix(b,c,t),t);}
      void main(){
        vS=stream;
        float spd=stream<.5?.20:.25, ph=stream<.5?.0:.4;
        float t=fract(seed+time*spd+ph);
        vec3 p=stream<.5
          ? bez(vec3(-2.0,.90,.50),vec3(-.15,3.40,.90),vec3(1.40,1.70,.30),t)
          : bez(vec3(-.90,.75,.60),vec3( .25,2.80,.75),vec3(1.40,1.70,.30),t);
        // spiral swirl tightens toward destination
        float sw=t*18.85; float r=.12+.18*(1.-t);
        p.x+=cos(sw+seed*6.28)*r; p.y+=sin(sw*.7+seed*5.)*r*.55; p.z+=sin(sw+seed*7.3)*r*.75;
        // turbulence
        p.x+=sin(seed*43.1+time*1.9)*.07; p.y+=cos(seed*29.7+time*2.3)*.06;
        vLife=sin(t*3.14159);
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp((22.+seed*60.+vLife*50.)/-mv.z,2.,130.);
      }`,
    fragmentShader: `
      varying float vLife; varying float vS;
      void main(){
        float d=length(gl_PointCoord-.5); if(d>.5)discard;
        vec3 col=vS<.5
          ? mix(vec3(1.,.98,.88),vec3(1.,.82,.22),d*2.)
          : mix(vec3(1.,.92,.60),vec3(1.,.50,.06),d*2.);
        float a=(1.-smoothstep(.0,.50,d))*vLife*.95;
        gl_FragColor=vec4(col,a);
      }`
  });
  const pranaParticles = new T.Points(pranaGeo, pranaMat);
  roots[1].add(pranaParticles);

  // ── STREAM B: 1200 fast escaping sparks ──
  const glitterCount = 1200;
  const glitterGeo   = new T.BufferGeometry();
  const glitterSeed  = new Float32Array(glitterCount);
  for (let i=0;i<glitterCount;i++) glitterSeed[i]=Math.random();
  glitterGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(glitterCount*3), 3));
  glitterGeo.setAttribute('seed',     new T.BufferAttribute(glitterSeed, 1));

  const glitterMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `
      uniform float time; attribute float seed; varying float vA;
      vec3 bez(vec3 a,vec3 b,vec3 c,float t){return mix(mix(a,b,t),mix(b,c,t),t);}
      void main(){
        float t=fract(seed+time*.48);
        vec3 origin=mix(vec3(-2.0,.90,.50),vec3(-.90,.75,.60),fract(seed*7.3));
        vec3 p=bez(origin,vec3(-.10,3.0,.80),vec3(1.40,1.70,.30),t);
        p.x+=sin(seed*83.1+time*6.2)*.28; p.y+=cos(seed*61.7+time*5.4)*.22;
        p.z+=sin(seed*47.9+time*7.1)*.22;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        vA=sin(t*3.14159)*(.6+seed*.4);
        gl_PointSize=clamp((6.+seed*14.)/-mv.z,1.,22.);
      }`,
    fragmentShader: `
      varying float vA;
      void main(){
        float d=length(gl_PointCoord-.5); if(d>.5)discard;
        vec3 col=mix(vec3(1.,1.,.88),vec3(1.,.62,.08),d*2.2);
        gl_FragColor=vec4(col,(1.-smoothstep(.0,.50,d))*vA*.88);
      }`
  });
  const glitterParticles = new T.Points(glitterGeo, glitterMat);
  roots[1].add(glitterParticles);

  // ── BLOOM C: heart glow + both palm glows (3 large radiant discs) ──
  const heartBloomMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `
      uniform float time; attribute float seed; varying float vS;
      void main(){
        vS=seed;
        vec3 p=seed<.5  ? vec3(1.40,1.70,.30)
              :seed<1.5 ? vec3(-2.0,.90,.50)
              :            vec3(-.90,.75,.60);
        float pulse=seed<.5 ? .8+.2*sin(time*3.8) : .65+.35*abs(sin(time*4.2+seed));
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mv;
        float base=seed<.5?130.:70.;
        gl_PointSize=clamp(base*pulse/-mv.z,10.,180.);
      }`,
    fragmentShader: `
      varying float vS;
      void main(){
        float d=length(gl_PointCoord-.5); if(d>.5)discard;
        float a=(1.-smoothstep(.0,.50,d))*.70;
        vec3 col=vS<.5  ? mix(vec3(1.,.98,.80),vec3(1.,.70,.10),d*2.)
                :vS<1.5 ? mix(vec3(1.,.94,.68),vec3(1.,.48,.04),d*2.2)
                :          mix(vec3(1.,.90,.58),vec3(.95,.42,.03),d*2.2);
        gl_FragColor=vec4(col,a);
      }`
  });
  const heartBloomGeo = new T.BufferGeometry();
  heartBloomGeo.setAttribute('position', new T.BufferAttribute(new Float32Array([0,0,0,0,0,0,0,0,0]),3));
  heartBloomGeo.setAttribute('seed',     new T.BufferAttribute(new Float32Array([0,1,2]),1));
  const heartBloom = new T.Points(heartBloomGeo, heartBloomMat);
  roots[1].add(heartBloom);

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

  // Brave Young Ganesha standing sentinel at the gate
  // Temple floor top = y(-2.8) + half-height(0.15) = -2.65
  // addDetail floors the STL at y=0 inside the group → set group y = -2.65 so feet land on floor
  const guardianCh2 = createChildGanesha(roots[2], { mode: 'guardian', pos: [0, -2.65, -3.8], scale: 1.25 });

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

  const flyingTrishul = new T.Group();
  // Polished divine silver-gold — blindingly hot, like a divine weapon should look
  const trishulMat = new T.MeshStandardMaterial({
    color: 0xf0e0b0, metalness: 0.98, roughness: 0.06,
    emissive: 0xffaa00, emissiveIntensity: 0.80
  });
  addDetail('Trishul.stl', 4, flyingTrishul, null, trishulMat);
  battle.add(flyingTrishul);

  // ── TRISHUL FIRE TRAIL — elongated streaks behind the prongs ──
  // Two layers: large glowing blobs (motion blur feel) + fine electric sparks
  const trailCount = 280;
  const trailGeo = new T.BufferGeometry();
  const trailPos   = new Float32Array(trailCount * 3);
  const trailAge   = new Float32Array(trailCount);
  const trailLayer = new Float32Array(trailCount); // 0=blob, 1=spark
  for (let i = 0; i < trailCount; i++) {
    trailAge[i]   = 1.0;   // start dead/invisible
    trailLayer[i] = i < 140 ? 0 : 1;
  }
  trailGeo.setAttribute('position', new T.BufferAttribute(trailPos,   3));
  trailGeo.setAttribute('age',      new T.BufferAttribute(trailAge,   1));
  trailGeo.setAttribute('layer',    new T.BufferAttribute(trailLayer, 1));

  const trailMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { speed: { value: 0.0 } },   // 0=slow  1=fast — drives streak length
    vertexShader: `
      attribute float age;
      attribute float layer;
      uniform   float speed;
      varying   float vAge;
      varying   float vLayer;
      void main(){
        vAge   = age;
        vLayer = layer;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float alive = 1.0 - age;
        // Blobs large, sparks small
        float baseSize = (layer < 0.5) ? (28.0 + speed * 55.0) : (6.0 + speed * 12.0);
        gl_PointSize = clamp(baseSize * alive * alive / -mv.z, 1.0, 60.0);
      }`,
    fragmentShader: `
      varying float vAge;
      varying float vLayer;
      void main(){
        vec2  uv = gl_PointCoord - 0.5;
        float d  = length(uv);
        if (d > 0.5) discard;

        float alive = 1.0 - vAge;
        float a;
        vec3  col;

        if (vLayer < 0.5) {
          // Blob: soft radial glow, white-hot core fading to orange
          a   = (1.0 - smoothstep(0.0, 0.50, d)) * alive * alive * 0.85;
          col = mix(vec3(1.0, 0.97, 0.88), vec3(1.0, 0.45, 0.02), d * 2.2);
        } else {
          // Spark: sharp bright streak dot
          a   = (1.0 - smoothstep(0.0, 0.28, d)) * alive * 0.95;
          col = mix(vec3(1.0, 1.0, 0.9), vec3(0.8, 0.3, 0.0), vAge * 1.5);
        }
        gl_FragColor = vec4(col, a);
      }`
  });
  const trishulTrail = new T.Points(trailGeo, trailMat);
  battle.add(trishulTrail);
  let trailHead = 0;

  // ── DIVINE CORONA — crackling energy rings around the Trishul in flight ──
  const coronaMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    side: T.DoubleSide,
    uniforms: { time: { value: 0 }, flight: { value: 0 } },
    vertexShader: `
      uniform float time, flight;
      varying float vT;
      void main(){
        // Expand ring outward with time, pulsate
        float r = 0.55 + 0.18 * sin(time * 12.0) + flight * 0.35;
        float a = position.x * 3.14159 * 2.0;
        vec3 p = vec3(cos(a) * r, sin(a) * r, position.y * 0.12);
        vT = position.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform float time, flight;
      varying float vT;
      void main(){
        float pulse = 0.5 + 0.5 * sin(vT * 28.0 + time * 18.0);
        float a = pulse * flight * 0.75;
        vec3 col = mix(vec3(0.4, 0.8, 1.0), vec3(1.0, 0.6, 0.0), pulse);
        gl_FragColor = vec4(col, a);
      }`
  });
  // Simple ring geometry (line strip via thin tube of points)
  const coronaRingCount = 80;
  const cPos = new Float32Array(coronaRingCount * 3);
  for (let i = 0; i < coronaRingCount; i++) {
    cPos[i*3]   = i / coronaRingCount;  // x=t 0..1 (used as angle in shader)
    cPos[i*3+1] = (i % 3) * 0.33 - 0.33;  // y offset for 3 stacked rings
    cPos[i*3+2] = 0;
  }
  const coronaGeo = new T.BufferGeometry();
  coronaGeo.setAttribute('position', new T.BufferAttribute(cPos, 3));
  const coronaMesh = new T.Points(coronaGeo, coronaMat);
  flyingTrishul.add(coronaMesh);  // attached to Trishul so it follows automatically

  // ── IMPACT SHOCKWAVE — screen-space fullscreen quad ──
  const shockwaveMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    uniforms: { impact: { value: 0.0 } },
    vertexShader: `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform float impact;
      void main(){
        // Radial vignette that punches white then recedes
        float ring = smoothstep(0.0, 0.35, impact) * (1.0 - smoothstep(0.35, 1.0, impact));
        vec3 col = mix(vec3(1.0, 0.7, 0.3), vec3(1.0, 1.0, 0.95), impact);
        gl_FragColor = vec4(col, ring * 0.82);
      }`
  });
  // Positions span NDC [-1,1] — drawn as two triangles filling the screen
  const shockwaveGeo = new T.BufferGeometry();
  shockwaveGeo.setAttribute('position', new T.Float32BufferAttribute([
    -1,-1,0,  1,-1,0,  1,1,0,  -1,-1,0,  1,1,0,  -1,1,0
  ], 3));
  const shockwaveMesh = new T.Mesh(shockwaveGeo, shockwaveMat);
  shockwaveMesh.frustumCulled = false;
  shockwaveMesh.renderOrder = 999;   // draw on top of everything
  scene.add(shockwaveMesh);

  const fallenBody = new T.Group(); battle.add(fallenBody);
  addDetail('Ganesha headless Body.stl', 2.8, fallenBody, 'headless');
  fallenBody.position.set(-2.2, -2.2, 0);

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

  for (let i = 0; i < 18; i++) {
    const a = i * 2.399, r = 6.5 + (i % 5) * 0.4;
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

  // Supplied Z-up sculpture, grounded at the forest floor.
  const elephant = new T.Group();
  elephant.position.set(.6,-2.6,-3.5);
  forest.add(elephant);
  addDetail('baby elephant.stl', 4.8, elephant, 'elephant', null);

  // ─── CH 7: REBIRTH — LORD GANESHA REBORN WITH SHIVA & PARVATI BESIDE HIM ───
  const reborn = ganesha(roots[7]);
  reborn.position.x = 1.6;
  const rebornHalo = halo(roots[7], 3);
  rebornHalo.position.set(1.6, 0.65, -1.1);
  temple(roots[7]);

  // Lord Shiva on left bestowing cosmic breath, Maa Parvati on right rejoicing
  const shivaCh7 = createShiva(roots[7], { mode: 'blessing', pos: [-1.4, -0.4, 0.4], scale: 1.12, rotY: 0.45 });
  const parvatiCh7 = createParvati(roots[7], { mode: 'rebirth_side', pos: [4.6, -0.4, 0.4], scale: 1.08, rotY: -0.45 });

  const restoredChild = {group:new T.Group()}; roots[7].add(restoredChild.group);
  addDetail('Ganesha headless Body.stl', 3.2, restoredChild.group, 'headless');

  const elephantHead = new T.Group(); roots[7].add(elephantHead);
  addDetail('Ganesha Head ( elephent head ).stl', 1.2, elephantHead, 'elephantHead', null);

  // ── REBIRTH MAGIC PARTICLE SYSTEM (luxury cinematic, not cartoonish) ──
  // Three layers rendered in roots[7] local space, Ganesha centre ≈ (1.6, 0.8, 0)

  // Layer 1: FUSION VORTEX — spirals inward to neck joint as head meets body (local 0.45→0.60)
  const fusionCount = 800;
  const fusGeo = new T.BufferGeometry();
  const fusSeed = new Float32Array(fusionCount);
  for (let i = 0; i < fusionCount; i++) fusSeed[i] = i / fusionCount;
  fusGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(fusionCount*3), 3));
  fusGeo.setAttribute('seed',     new T.BufferAttribute(fusSeed, 1));

  const fusMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 }, phase: { value: 0 } }, // phase 0→1 = fusion progress
    vertexShader: `
      uniform float time, phase;
      attribute float seed;
      varying float vLife;
      void main(){
        // Particles start on a wide radius and spiral inward to neck joint (1.6, 1.2, 0)
        float angle = seed * 6.2832 * 6.0 + time * 2.8;  // 6 full spiral rotations
        float radius = mix(3.5, 0.06, phase) * (0.7 + seed * 0.3);
        float height = mix(seed * 4.0 - 0.5, 1.2, phase); // converge on neck y=1.2
        vec3 p = vec3(
          1.6 + cos(angle) * radius,
          height,
          sin(angle) * radius * 0.6
        );
        // Altitude wobble for organic feel
        p.y += sin(seed * 23.1 + time * 4.5) * (1.0 - phase) * 0.18;
        vLife = sin(phase * 3.14159) * (0.4 + seed * 0.6);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((12.0 + seed * 28.0 + vLife * 20.0) / -mv.z, 1.0, 55.0);
      }`,
    fragmentShader: `
      varying float vLife;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        // White-gold core bleeding to amber-orange edge
        vec3 col = mix(vec3(1.0,0.97,0.82), vec3(1.0,0.62,0.08), d * 2.2);
        float a = (1.0 - smoothstep(0.0, 0.50, d)) * vLife * 0.92;
        gl_FragColor = vec4(col, a);
      }`
  });
  const fusionParticles = new T.Points(fusGeo, fusMat);
  roots[7].add(fusionParticles);

  // Layer 2: DIVINE EXPLOSION — radial burst outward when Ganesha fully appears (local 0.58→0.75)
  const burstCount = 1200;
  const burstGeo = new T.BufferGeometry();
  const burstSeed = new Float32Array(burstCount);
  const burstDir  = new Float32Array(burstCount * 3); // pre-computed random directions
  for (let i = 0; i < burstCount; i++) {
    burstSeed[i] = Math.random();
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    burstDir[i*3]   = Math.sin(phi) * Math.cos(theta);
    burstDir[i*3+1] = Math.abs(Math.cos(phi)) * 1.4; // bias upward
    burstDir[i*3+2] = Math.sin(phi) * Math.sin(theta) * 0.6;
  }
  burstGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(burstCount*3), 3));
  burstGeo.setAttribute('seed',     new T.BufferAttribute(burstSeed, 1));
  burstGeo.setAttribute('dir',      new T.BufferAttribute(burstDir,  3));

  const burstMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 }, blast: { value: 0 } }, // blast 0→1 = explosion progress
    vertexShader: `
      uniform float time, blast;
      attribute float seed; attribute vec3 dir;
      varying float vLife; varying float vSeed;
      void main(){
        vSeed = seed;
        // Ease-out: fast start, slow end — like a real shockwave
        float t = 1.0 - pow(1.0 - blast, 2.5);
        float speed = 2.8 + seed * 4.5;
        vec3 p = vec3(1.6, 0.8, 0.0) + dir * t * speed;
        // Add trailing sparkle wiggle
        p.x += sin(seed * 31.4 + time * 8.0) * t * 0.08;
        p.y += cos(seed * 27.1 + time * 7.2) * t * 0.06;
        vLife = (1.0 - blast) * (1.0 - blast); // quadratic fade
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((8.0 + seed * 30.0) * (1.0 - blast * 0.7) / -mv.z, 1.0, 80.0);
      }`,
    fragmentShader: `
      varying float vLife; varying float vSeed;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        // Vary colour per particle: pure white centre → gold → warm orange edge
        vec3 col = mix(vec3(1.0,1.0,0.95), vec3(1.0,0.78,0.12), d * 2.0);
        col = mix(col, vec3(1.0,0.42,0.04), max(0.0, d * 2.0 - 1.0));
        float a = (1.0 - smoothstep(0.0, 0.50, d)) * vLife;
        gl_FragColor = vec4(col, a * 0.95);
      }`
  });
  const burstParticles = new T.Points(burstGeo, burstMat);
  roots[7].add(burstParticles);

  // Layer 3: FLOATING DIVINE DUST — soft gold motes drift upward continuously after rebirth
  const dustCh7Count = 320;
  const dustCh7Geo   = new T.BufferGeometry();
  const dustCh7Seed  = new Float32Array(dustCh7Count);
  for (let i = 0; i < dustCh7Count; i++) dustCh7Seed[i] = Math.random();
  dustCh7Geo.setAttribute('position', new T.BufferAttribute(new Float32Array(dustCh7Count*3), 3));
  dustCh7Geo.setAttribute('seed',     new T.BufferAttribute(dustCh7Seed, 1));

  const dustCh7Mat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { time: { value: 0 }, presence: { value: 0 } },
    vertexShader: `
      uniform float time, presence;
      attribute float seed;
      varying float vA;
      void main(){
        // Motes drift in a soft column around Ganesha, drifting upward
        float phase = fract(seed + time * 0.12);
        float angle = seed * 6.2832 + time * 0.3;
        float r     = 0.5 + seed * 1.8;
        vec3 p = vec3(
          1.6 + cos(angle) * r,
          -2.0 + phase * 7.0,  // drift from floor to above head
          sin(angle) * r * 0.55
        );
        p.x += sin(seed * 19.3 + time * 0.9) * 0.22;
        p.z += cos(seed * 23.7 + time * 1.1) * 0.18;
        // Fade in/out through lifecycle, modulated by presence
        vA = sin(phase * 3.14159) * presence * (0.35 + seed * 0.45);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((4.0 + seed * 10.0) / -mv.z, 1.0, 18.0);
      }`,
    fragmentShader: `
      varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 col = mix(vec3(1.0,0.96,0.78), vec3(0.98,0.68,0.12), d * 2.0);
        gl_FragColor = vec4(col, (1.0 - smoothstep(0.0, 0.50, d)) * vA);
      }`
  });
  const dustCh7 = new T.Points(dustCh7Geo, dustCh7Mat);
  roots[7].add(dustCh7);

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

  const mushaka = new T.Group();
  mushaka.position.set(-1.3,.13,.3); mushaka.rotation.y = Math.PI/3;
  thali.add(mushaka);
  // paintDeity 'mushaka' — warm chestnut fur, cream belly, dark shadow
  addDetail('Mushak.stl', .65, mushaka, 'mushaka', null);

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
    const idol = ganesha(roots[10]);
    idol.position.set((i<2?-1:1)*(4+(i%2)*3), -1.4, -3-(i%2)*3);
    idol.scale.setScalar(.45+(i%2)*.12);
    idol.rotation.y = (i<2?1:-1)*.22;
  }

  // ─── CH 11: SUNRISE — "He never truly leaves" → underwater ascent → Nexis sunrise ───
  // The camera rises from underwater depth (-5) back up through the surface,
  // reveals a golden horizon, then the Nexis logo sprite fades in on the sun disc.
  const nexisTexture = new T.TextureLoader().load('./assets/nexis.png');
  const nexisSun = new T.Sprite(new T.SpriteMaterial({
    map: nexisTexture, transparent: true, opacity: 0,
    depthWrite: false, blending: T.NormalBlending
  }));
  nexisSun.scale.set(6, 3, 1);
  nexisSun.position.set(0, 4, -38);
  roots[11].add(nexisSun);

  // Golden horizon glow behind the logo
  const horizonCanvas = document.createElement('canvas');
  horizonCanvas.width = 256; horizonCanvas.height = 64;
  const hCtx = horizonCanvas.getContext('2d');
  const hGrad = hCtx.createLinearGradient(0, 0, 0, 64);
  hGrad.addColorStop(0, '#fff4d0ff');
  hGrad.addColorStop(0.35, '#ffb83088');
  hGrad.addColorStop(1,   '#ff600000');
  hCtx.fillStyle = hGrad;
  hCtx.fillRect(0, 0, 256, 64);
  const horizonSprite = new T.Sprite(new T.SpriteMaterial({
    map: new T.CanvasTexture(horizonCanvas), transparent: true, opacity: 0, depthWrite: false
  }));
  horizonSprite.scale.set(40, 8, 1);
  horizonSprite.position.set(0, -0.5, -40);
  roots[11].add(horizonSprite);

  // Shimmering water surface plane for the ascent
  const surfaceMat = new T.MeshStandardMaterial({
    color: 0x2a8090, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.9
  });
  mesh(new T.PlaneGeometry(80, 80), surfaceMat, roots[11], [0, 0, -18]).rotation.x = -Math.PI/2;

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
    [[0, 1.8, 13], [2.8, 1.2, 8], [0.6, -0.1, -3.5]],     // 06: The Search (Elephant in majesty)
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
      const weaponShot=index===4&&local>=.25&&local<.5;
      // During the throw, lock camera tight behind the Trishul path
      if(weaponShot) {
        const accel = beats.flight * beats.flight * beats.flight;
        // Camera pulls back slightly as Trishul rushes forward — cinematic dolly
        from.set(0, 1.2 + accel * 0.3, -4*42 + 9 - accel * 2.5);
        target.set(0, 1.1, -4*42);
        // Boost scene brightness as Trishul approaches
        key.color.setHex(0xfff0cc); key.intensity = 48 + accel * 220;
        rim.color.setHex(0xff8800); rim.intensity = 30 + accel * 160;
        scene.fog.color.setHex(0x060404);
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

      roots.forEach((root, i) => root.visible = i === index || (local > .74 && i === index + 1));

      // Dynamic cinematic lighting
      key.position.set(4, 6, camera.position.z - 4);
      rim.position.set(-6, 3, camera.position.z - 10);
      fill.position.set(0, 0, camera.position.z + 2);
      topRim.position.set(camera.position.x + 3, camera.position.y + 7, camera.position.z + 5);
      topRim.target.position.set(target.x, target.y, target.z);
      topRim.target.updateMatrixWorld();

      if (index === 5) {
        key.color.setHex(0xff2800); key.intensity = 65;
        rim.color.setHex(0xa01200); rim.intensity = 130;
        topRim.color.setHex(0xff9930); topRim.intensity = 2.8;
        scene.fog.color.setHex(0x120404);
      } else if (index === 2 || index === 3) {
        key.color.setHex(0xc0d8f0); key.intensity = 42;
        rim.color.setHex(0x2a5578); rim.intensity = 30;
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
        key.color.setHex(0xffe4cb); key.intensity = 48;
        rim.color.setHex(0x4a7ea5); rim.intensity = 35;
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
      glitterMat.uniforms.time.value = t;
      heartBloomMat.uniforms.time.value = t;
      // Fade all three prana effects in early, out late
      const pranaAlpha = T.MathUtils.smoothstep(local, 0.02, 0.15) * (1.0 - T.MathUtils.smoothstep(local, 0.72, 0.92));
      pranaParticles.visible  = index === 1 && pranaAlpha > 0.01;
      glitterParticles.visible = index === 1 && pranaAlpha > 0.01;
      heartBloom.visible       = index === 1 && pranaAlpha > 0.01;
      fogPlane.material.uniforms.time.value = t;

      // Chapter 2: Young Ganesha guarding the gate
      door.scale.x = Math.max(0.02, 1.0 - local * 0.9);
      guardianCh2.update(t, local);

      // Chapter 3: Lord Shiva arrives
      shivaCh3.update(t, local);
      snowMat.uniforms.time.value = t;

      // Chapter 4: The Battle — extended cinematic Trishul sequence
      // local 0.00–0.08 : normal battle scene
      // local 0.08–0.25 : WINDUP — camera orbits Shiva's trishul, 3 dramatic angles
      // local 0.25–0.50 : FLIGHT — Trishul flies tip-first at camera (weaponShot)
      // local 0.48–0.54 : IMPACT — flash + decapitation
      // local 0.50–0.70 : AFTERMATH — body falls

      battle.rotation.set(0,0,0);
      shivaCh4.update(t,local);
      shivaCh4.trishul.visible = false;

      // ─ WINDUP camera orbit (3 cinematic angles as Shiva winds up) ─
      if (index === 4 && local >= 0.08 && local < 0.25) {
        const wu = (local - 0.08) / 0.17;  // 0→1 across windup
        // Angle 1 (0–0.33): side-on close-up on Shiva's face + trishul
        // Angle 2 (0.33–0.66): low-angle looking up at trishul tip
        // Angle 3 (0.66–1.0): wide pull-back, both figures
        const seg = Math.floor(wu * 3);
        const segT = (wu * 3) % 1;
        const base = -4 * 42;
        if (seg === 0) {
          from.set(T.MathUtils.lerp(3.5, 2.5, segT), T.MathUtils.lerp(1.8, 2.2, segT), base + T.MathUtils.lerp(6, 5, segT));
          target.set(2.2, 1.4, base);
        } else if (seg === 1) {
          from.set(T.MathUtils.lerp(1.5, 0, segT), T.MathUtils.lerp(-0.5, -1.0, segT), base + T.MathUtils.lerp(5, 7, segT));
          target.set(2.2, 2.8, base);
        } else {
          from.set(T.MathUtils.lerp(-1, 0, segT), T.MathUtils.lerp(2.5, 1.2, segT), base + T.MathUtils.lerp(14, 10, segT));
          target.set(0, 0.6, base);
        }
        camera.position.copy(from);
        camera.lookAt(target);
        camera.rotation.z = Math.sin(t * 2.5) * 0.015;
      }

      battle.children.forEach(child=>child.visible=!weaponShot);
      flyingTrishul.visible = weaponShot;
      trishulTrail.visible  = weaponShot;

      if (weaponShot) {
        const rawF  = beats.flight;
        const eased = rawF * rawF * (3.0 - 2.0 * rawF);
        const accel = rawF * rawF * rawF;
        const f     = eased;

        const launchX =  1.4;
        const targetX = -0.1;
        const fx = T.MathUtils.lerp(launchX, targetX, f) + Math.sin(f * Math.PI) * 0.08;
        const fy = T.MathUtils.lerp(1.4,  1.05, f) - Math.sin(f * Math.PI) * 0.12;
        const fz = T.MathUtils.lerp(-8.5, 5.5, accel);
        flyingTrishul.position.set(fx, fy, fz);

        flyingTrishul.rotation.set(
          // STL prongs = +Y. addDetail bakes rotateX(-PI/2) → prongs now +Z.
          // Camera looks in -Z direction, so prongs must face -Z = rotate PI around X.
          // Add launch loft: starts slightly tilted back (PI + 0.25), snaps straight by f=1 (PI).
          Math.PI + 0.25 * (1.0 - f),  // prongs dead at camera — loft eases to zero
          -0.18 * (1.0 - f),            // yaw straightens as it homes
          0                              // zero roll — arrow-straight
        );

        const sc = T.MathUtils.lerp(0.55, 3.8, accel);
        flyingTrishul.scale.setScalar(sc);

        if (index === 4) {
          const shake = accel * 0.055;
          camera.position.x += (Math.random() - 0.5) * shake;
          camera.position.y += (Math.random() - 0.5) * shake * 0.6;
        }

        shivaCh4.rightArm.rotation.z = -beats.windup * 1.2 + rawF * 1.65;
        coronaMat.uniforms.time.value   = t;
        coronaMat.uniforms.flight.value = f;

        const spawnCount = 4 + Math.floor(accel * 14);
        for (let sp = 0; sp < spawnCount; sp++) {
          const idx = trailHead % trailCount;
          const spread = 0.04 + accel * 0.08;
          trailPos[idx*3]   = fx + (Math.random()-0.5)*spread;
          trailPos[idx*3+1] = fy + (Math.random()-0.5)*spread*0.5;
          trailPos[idx*3+2] = fz + 0.3 + Math.random()*0.4;
          trailAge[idx]     = 0.0;
          trailHead++;
        }
        for (let i = 0; i < trailCount; i++) {
          trailAge[i] = Math.min(1.0, trailAge[i] + delta * (3.5 + accel * 8.0));
        }
        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.age.needsUpdate      = true;
        trailMat.uniforms.speed.value = accel;

      } else {
        shivaCh4.rightArm.rotation.z = -beats.windup*1.2;
        flyingTrishul.scale.setScalar(1);
        for (let i = 0; i < trailCount; i++) trailAge[i] = 1.0;
        trailGeo.attributes.age.needsUpdate = true;
        coronaMat.uniforms.flight.value = 0;
        coronaMat.uniforms.time.value   = t;
      }

      // Shockwave overlay: flashes white on impact
      shockwaveMat.uniforms.impact.value = beats.impact;
      shockwaveMesh.visible = beats.impact > 0.01;

      fallenBody.visible = local>=.55;
      fallenBody.rotation.z = Math.PI/2;
      guardianCh4.group.visible = local<.5&&!weaponShot;
      impactLight.intensity = local >= .48 && local < .54 ? 120 : 0;
      guardianCh4.head.visible = local < .48;
      guardianCh4.group.rotation.z = beats.fall*1.45;
      guardianCh4.group.position.y = -.8 - beats.fall*1.25;
      // Staff moves to Ganesha's side (not through body) and drops with him
      guardianCh4.staff.visible = local < 0.48;
      guardianCh4.staff.position.set(0.55, 0.5, 0.2);
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
      // Responsive, scroll-linked reveal inspired by the Anime.js onScroll example.
      const elephantReveal=T.MathUtils.smoothstep(local,.08,.6);
      elephant.position.z=-5.5+elephantReveal*2;
      elephant.rotation.y=-.32+elephantReveal*.45;
      elephant.scale.y=1+Math.sin(t*1.1)*.003;
      forestMist.material.uniforms.time.value = t;

      // Chapter 7: Rebirth
      restoredChild.group.visible = local < .58;
      restoredChild.group.rotation.z = (1-beats.restore)*1.15;
      restoredChild.group.position.set(1.6, -2.2-(1-beats.restore)*.3, 0);

      elephantHead.visible = local < .58;
      {
        const gY  = -2.2 - (1-beats.restore)*0.3;
        const top = gY + 3.2;
        elephantHead.position.set(1.6, T.MathUtils.lerp(5.5, top, beats.restore), 0.0);
        elephantHead.rotation.y = Math.sin(t * 0.4) * 0.04;
      }
      elephantHead.scale.setScalar(1.0);

      // ── REBIRTH MAGIC PARTICLES ──
      {
        // Fusion vortex: active as head descends (local 0.45 → 0.60)
        const fusPhase = T.MathUtils.smoothstep(local, 0.45, 0.60);
        fusionParticles.visible = index === 7 && local >= 0.42 && local <= 0.65;
        fusMat.uniforms.time.value  = t;
        fusMat.uniforms.phase.value = fusPhase;

        // Explosion burst: fires exactly when head snaps onto body (local 0.55 → 0.78)
        const blastProgress = T.MathUtils.smoothstep(local, 0.56, 0.78);
        burstParticles.visible = index === 7 && local >= 0.55 && local <= 0.85;
        burstMat.uniforms.time.value  = t;
        burstMat.uniforms.blast.value = blastProgress;

        // Floating divine dust: appears after rebirth and persists
        const dustPresence = T.MathUtils.smoothstep(local, 0.60, 0.75);
        dustCh7.visible = index === 7 && local >= 0.58;
        dustCh7Mat.uniforms.time.value     = t;
        dustCh7Mat.uniforms.presence.value = dustPresence;

        // Boost halo spin and scale during the explosion moment
        if (local >= 0.58 && local < 0.78) {
          const flash = T.MathUtils.smoothstep(local, 0.58, 0.65);
          rebornHalo.scale.setScalar(1.0 + flash * 0.35);
        } else {
          rebornHalo.scale.setScalar(1.0);
        }
      }
      reborn.visible = local >= .58;
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

      mushaka.rotation.y = Math.PI/3+Math.sin(t*.6)*.1;
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

      // Chapter 11: Sunrise — camera ascends from underwater, reveals Nexis horizon
      if (index === 11) {
        // Camera rises: starts submerged at y=-4, breaks surface at local≈0.4, settles at y=2
        const rise = T.MathUtils.smoothstep(local, 0.0, 0.55);
        const camY = T.MathUtils.lerp(-4.5, 2.2, rise);
        camera.position.set(0, camY, -11 * 42 + 14);
        camera.lookAt(0, camY + 0.5, -11 * 42);

        // Underwater fog fades to sky as we break surface
        const surfaceBreak = T.MathUtils.smoothstep(local, 0.35, 0.55);
        scene.fog.color.setHex(surfaceBreak > 0.5 ? 0x0a1428 : 0x07343e);
        scene.fog.density = T.MathUtils.lerp(0.065, 0.012, surfaceBreak);
        scene.background.setHex(surfaceBreak > 0.5 ? 0x0a1428 : 0x07343e);

        // Sunrise lighting warms up
        key.color.setHex(0xffcc88); key.intensity = T.MathUtils.lerp(20, 180, rise);
        rim.color.setHex(0xff8830); rim.intensity = T.MathUtils.lerp(10, 120, rise);

        // Nexis logo + horizon fade in after surface break
        const logoReveal = T.MathUtils.smoothstep(local, 0.58, 0.82);
        nexisSun.material.opacity    = logoReveal * 0.95;
        horizonSprite.material.opacity = T.MathUtils.smoothstep(local, 0.45, 0.72) * 0.85;
        // Gentle pulse on the logo
        nexisSun.scale.set(6 + Math.sin(t * 1.4) * 0.12, 3 + Math.sin(t * 1.4) * 0.06, 1);
      } else {
        nexisSun.material.opacity    = 0;
        horizonSprite.material.opacity = 0;
      }

      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }
  };
}
