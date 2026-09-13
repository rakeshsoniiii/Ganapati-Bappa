import * as T from './vendor/three.module.js';
import { STLLoader } from './vendor/STLLoader.js';
import { mergeVertices } from './vendor/BufferGeometryUtils.js';

export function createWorld(canvas) {
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.5));
  renderer.setSize(innerWidth,innerHeight);
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new T.Scene();scene.background=new T.Color(0x050808);scene.fog=new T.FogExp2(0x050808,.027);
  const camera=new T.PerspectiveCamera(43,innerWidth/innerHeight,.1,120);
  const roots=Array.from({length:12},(_,i)=>{const g=new T.Group();g.position.z=-i*42;scene.add(g);return g;});
  const gold=new T.MeshStandardMaterial({color:0x9d681f,metalness:.94,roughness:.3});
  const paleGold=new T.MeshStandardMaterial({color:0xc39952,metalness:.89,roughness:.31});
  const darkGold=new T.MeshStandardMaterial({color:0x70501e,metalness:.75,roughness:.36});
  const ivory=new T.MeshStandardMaterial({color:0xf0dbb1,metalness:.18,roughness:.35});
  const obsidian=new T.MeshStandardMaterial({color:0x152021,metalness:.45,roughness:.4});
  const red=new T.MeshStandardMaterial({color:0x9b2513,metalness:.15,roughness:.48});
  const black=new T.MeshStandardMaterial({color:0x080908,metalness:.3,roughness:.16});
  const glow=new T.MeshBasicMaterial({color:0xf2c879});
  const sphere=new T.SphereGeometry(1,32,24),box=new T.BoxGeometry(1,1,1);
  function mesh(geo,mat,parent,pos=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geo,mat);m.position.set(...pos);m.scale.set(...scale);parent.add(m);return m;}
  function ell(parent,pos,scale,mat=gold){return mesh(sphere,mat,parent,pos,scale);}
  function ring(parent,r,t,pos=[0,0,0],mat=gold){return mesh(new T.TorusGeometry(r,t,8,80),mat,parent,pos);}
  function path(parent,points,r1,r2=r1,mat=gold){
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments=44,radial=12,frames=curve.computeFrenetFrames(segments,false),vertices=[],normals=[],indices=[];
    for(let i=0;i<=segments;i++){const p=curve.getPointAt(i/segments),r=T.MathUtils.lerp(r1,r2,i/segments);for(let j=0;j<=radial;j++){const a=j/radial*Math.PI*2,n=frames.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));vertices.push(p.x+n.x*r,p.y+n.y*r,p.z+n.z*r);normals.push(n.x,n.y,n.z);if(i<segments&&j<radial){const k=i*(radial+1)+j;indices.push(k,k+radial+1,k+1,k+1,k+radial+1,k+radial+2);}}}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setIndex(indices);return mesh(geo,mat,parent);
  }
  function beads(parent,positions,r=.045,mat=gold){const inst=new T.InstancedMesh(sphere,mat,positions.length),dummy=new T.Object3D();positions.forEach((p,i)=>{dummy.position.set(...p);dummy.scale.setScalar(r);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});parent.add(inst);return inst;}
  function halo(parent,r=3){
    const g=new T.Group();parent.add(g);
    for(let i=0;i<4;i++)ring(g,r+i*.17,.016,[0,0,-.15],i%2?glow:gold);
    const pts=[];
    for(let i=0;i<64;i++){const a=i/64*Math.PI*2;pts.push([Math.cos(a)*(r+.62),Math.sin(a)*(r+.62),-.15]);const petal=ring(g,.22,.012,[Math.cos(a)*(r+.28),Math.sin(a)*(r+.28),-.15],gold);petal.scale.set(.5,1.4,1);petal.rotation.z=a-Math.PI/2;}
    beads(g,pts,.028,glow);return g;
  }
  function pedestal(parent){
    for(let i=0;i<4;i++)mesh(new T.CylinderGeometry(2.2-i*.15,2.35-i*.15,.17,80),i%2?gold:obsidian,parent,[0,-2.3+i*.17,0]);
    for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const petal=ell(parent,[Math.cos(a)*1.55,-1.66,Math.sin(a)*1.55],[.28,.18,.7],paleGold);petal.rotation.y=-a+Math.PI/2;}
  }
  const sculptureHolders=[];let rebirthDust,farewellDust;
  function ganesha(parent){
    const g=new T.Group();parent.add(g);pedestal(g);
    const holder=new T.Group();g.add(holder);sculptureHolders.push(holder);
    return g;
  }
  new STLLoader().load('./assets/ganesha.stl',geometry=>{
    geometry.deleteAttribute('normal');geometry=mergeVertices(geometry,.00001);geometry.computeVertexNormals();
    geometry.rotateX(-Math.PI/2);geometry.center();geometry.computeBoundingBox();
    const size=new T.Vector3();geometry.boundingBox.getSize(size);
    geometry.scale(5.2/size.y,5.2/size.y,5.2/size.y);
    geometry.translate(0,.88,0);
    for(const holder of sculptureHolders)mesh(geometry,paleGold,holder);
    const particleMaterial=()=>new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{scatter:{value:0},opacity:{value:1}},vertexShader:`uniform float scatter;void main(){float seed=sin(dot(position,vec3(12.98,78.23,35.7)))*43758.54;vec3 p=position+vec3(sin(seed),cos(seed*1.3),sin(seed*.7))*scatter*6.;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(16./-mv.z,1.,3.);}`,fragmentShader:`uniform float opacity;void main(){float a=1.-smoothstep(.05,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(1.,.64,.24,a*opacity);}`});
    rebirthDust=new T.Points(geometry,particleMaterial());reborn.add(rebirthDust);
    farewellDust=new T.Points(geometry,particleMaterial());farewell.add(farewellDust);
    document.body.classList.add('model-ready');
    document.querySelector('#loading')?.remove();
  },undefined,error=>{
    console.error('Sculpture could not load',error);
    document.body.classList.remove('webgl-ready');document.body.classList.add('no-webgl');
    const loading=document.querySelector('#loading');if(loading)loading.textContent='3D unavailable. Showing the illustrated edition.';
  });
  function temple(parent){
    for(let z=4;z>=-25;z-=7){for(const x of [-5.5,5.5]){
      mesh(new T.CylinderGeometry(.39,.55,9,12),obsidian,parent,[x,1.8,z]);
      for(const y of [-2.5,5.8])mesh(new T.CylinderGeometry(.75,.75,.23,12),gold,parent,[x,y,z]);
      for(let y=-2;y<5.5;y+=1)ring(parent,.43,.025,[x,y,z]).rotation.x=Math.PI/2;
    }mesh(box,obsidian,parent,[0,6.1,z],[12,.55,1]);}
    mesh(box,obsidian,parent,[0,-2.5,-8],[100,.25,100]);
    for(let z=4;z>-24;z-=4)mesh(box,darkGold,parent,[0,-2.36,z],[10,.012,.02]);
  }
  const hero=ganesha(roots[0]);hero.position.set(2.5,0,0);
  const heroHalo=halo(roots[0],2.8);heroHalo.position.set(2.5,.8,-1);
  temple(roots[0]);
  const birthHalo=halo(roots[1],1.6);birthHalo.position.set(0,1,0);
  const orb=ell(roots[1],[0,1,0],[.7,.7,.7],new T.MeshBasicMaterial({color:0xffdda1,wireframe:true}));
  temple(roots[1]);temple(roots[2]);
  const mountainGeo=new T.ConeGeometry(6,15,12,7);
  const mountainPos=mountainGeo.attributes.position;
  for(let i=0;i<mountainPos.count;i++){const x=mountainPos.getX(i),y=mountainPos.getY(i),z=mountainPos.getZ(i),r=1+Math.sin(x*2.3+z*1.7+y)*.16;mountainPos.setXYZ(i,x*r,y,z*r);}mountainGeo.computeVertexNormals();
  const snow=new T.MeshStandardMaterial({color:0x788f9b,roughness:.88});
  for(let i=0;i<7;i++)mesh(mountainGeo,snow,roots[1],[(i-3)*7,2,-24-Math.abs(i-3)*2],[.8+i%2*.4,1+i%3*.15,1]);
  const door=mesh(box,darkGold,roots[2],[0,1,-7],[4,7,.25]);
  for(let x=-1.7;x<=1.7;x+=.57)mesh(box,gold,roots[2],[x,1,-6.84],[.025,6.5,.025]);
  const trishul=new T.Group();roots[3].add(trishul);trishul.position.set(2.5,.4,0);
  mesh(new T.CylinderGeometry(.055,.08,7,16),gold,trishul,[0,-.4,0]);
  path(trishul,[[-.9,3.1,0],[-.94,2.2,0],[-.6,1.6,0],[0,1.4,0],[.6,1.6,0],[.94,2.2,0],[.9,3.1,0]],.065);
  for(const x of [-.9,0,.9])mesh(new T.ConeGeometry(.13,.65,12),gold,trishul,[x,x===0?3.55:3.35,0]);
  for(const s of [-1,1])mesh(new T.CylinderGeometry(.31,.1,.4,20),darkGold,trishul,[0,.5+s*.2,0]).rotation.z=s<0?Math.PI:0;
  const battle=new T.Group();roots[4].add(battle);battle.add(trishul.clone());
  const rockGeo=new T.IcosahedronGeometry(.2,0);
  for(let i=0;i<90;i++){const a=i*2.4,r=2+(i%11)*.33;const m=mesh(rockGeo,i%4?obsidian:gold,battle,[Math.cos(a)*r,Math.sin(a)*r,(i%9)-4]);m.rotation.set(i,i*.3,i*.7);}
  const rageHalo=halo(roots[5],3.3);rageHalo.position.y=.6;
  const orbitals=[];for(let i=0;i<5;i++){const r=ring(roots[5],2.5+i*.45,.018,[0,.5,0],new T.MeshBasicMaterial({color:0xff6326}));r.rotation.set(i*.7,i*.5,0);orbitals.push(r);}
  const forest=roots[6];
  for(let i=0;i<50;i++){const x=(i%2?1:-1)*(3.5+i%5),z=-Math.floor(i/2)*2.4;mesh(new T.CylinderGeometry(.16,.32,14,7),obsidian,forest,[x,2,z]);for(let j=0;j<2;j++)mesh(new T.ConeGeometry(1.5+j*.3,5,7),obsidian,forest,[x,6-j*2,z]);}
  const reborn=ganesha(roots[7]);reborn.position.x=1.6;
  const rebornHalo=halo(roots[7],3);rebornHalo.position.set(1.6,.65,-1.1);
  temple(roots[7]);
  const modak=new T.Group();modak.position.set(2.8,.3,0);roots[8].add(modak);
  const modakGeo=new T.SphereGeometry(1,72,48),p=modakGeo.attributes.position;
  for(let i=0;i<p.count;i++){const y=p.getY(i),a=Math.atan2(p.getZ(i),p.getX(i)),rib=1+Math.cos(a*12)*.06,taper=y>0?1-y*.6:1;p.setXYZ(i,p.getX(i)*rib*taper,(y+1)*.9+(y>.7?(y-.7)*1.6:0)-.85,p.getZ(i)*rib*taper);}modakGeo.computeVertexNormals();mesh(modakGeo,ivory,modak);mesh(new T.CylinderGeometry(1.35,1.2,.1,64),gold,modak,[0,-.97,0]);halo(roots[8],2).position.set(2.8,.3,-1.5);
  const festive=ganesha(roots[9]);festive.position.set(1.7,0,0);halo(roots[9],3).position.set(1.7,.7,-1);temple(roots[9]);
  const petals=new T.InstancedMesh(new T.SphereGeometry(.065,6,4),new T.MeshStandardMaterial({color:0xff9829,roughness:.6}),220);roots[9].add(petals);const dummy=new T.Object3D();
  const farewell=ganesha(roots[10]);farewell.position.set(0,-.4,0);farewell.rotation.y=Math.PI;
  const waterMat=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:`uniform float time;varying vec3 p;void main(){p=position;vec3 q=position;q.z=sin(q.x*1.4+time*.6)*.12+sin(q.y*1.1+time)*.12;gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);}`,fragmentShader:`uniform float time;varying vec3 p;void main(){float w=sin(p.x*2.+sin(p.y*1.4+time)*1.2+time*.7);float light=pow(max(0.,w),18.);float beam=exp(-p.x*p.x*.03);vec3 col=mix(vec3(.012,.045,.057),vec3(.85,.46,.14),light*beam);gl_FragColor=vec4(col,1.);}`});
  const water=mesh(new T.PlaneGeometry(100,100,130,130),waterMat,roots[10],[0,-1.8,-14]);water.rotation.x=-Math.PI/2;
  mesh(new T.SphereGeometry(2,32,24),new T.MeshBasicMaterial({color:0xe28f40}),roots[10],[0,1.5,-35]);
  const count=innerWidth<700?1100:2600,positions=new Float32Array(count*3),seeds=new Float32Array(count);
  for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*32;positions[i*3+1]=(Math.random()-.5)*22;positions[i*3+2]=(Math.random()-.5)*55;seeds[i]=Math.random();}
  const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(positions,3));dustGeo.setAttribute('seed',new T.BufferAttribute(seeds,1));
  const dustMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:{value:0},tint:{value:new T.Color(0xe6bc70)},speed:{value:1},burst:{value:0}},vertexShader:`uniform float time;uniform float speed;uniform float burst;attribute float seed;varying float a;void main(){vec3 p=position;p.y=mod(p.y+11.+time*.3*speed,22.)-11.;p.x+=sin(time*.15+seed*40.)*.3;p+=normalize(p)*burst*5.;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((24.+seed*30.)/-mv.z,1.,6.);a=.2+.5*abs(sin(seed*20.+time*.3));}`,fragmentShader:`uniform vec3 tint;varying float a;void main(){gl_FragColor=vec4(tint,(1.-smoothstep(.02,.5,length(gl_PointCoord-.5)))*a);}`});
  const dust=new T.Points(dustGeo,dustMat);scene.add(dust);
  const hemi=new T.HemisphereLight(0x97aaa8,0x30210c,.8);scene.add(hemi);
  const key=new T.PointLight(0xffd092,110,40,1.4),rim=new T.PointLight(0x588db4,80,40,1.4);scene.add(key,rim);
  // Reflected light panels make the metal readable from every camera angle.
  const envScene=new T.Scene();envScene.background=new T.Color(0x37332c);
  for(const [pos,scale,intensity] of [[[0,5,0],[12,.1,8],3],[[5,1,0],[.1,8,10],2],[[-5,2,-2],[.1,7,8],1.2]])mesh(box,new T.MeshBasicMaterial({color:new T.Color(intensity,intensity*.83,intensity*.6)}),envScene,pos,scale);
  const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(envScene,.04);scene.environment=env.texture;pmrem.dispose();
  scene.environmentIntensity=.6;
  const rayMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,vertexShader:'varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){vUv=uv;vNormal=normalMatrix*normal;vec4 mv=modelViewMatrix*vec4(position,1.);vView=-mv.xyz;gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){float soft=pow(abs(dot(normalize(vNormal),normalize(vView))),2.);float fade=sin(vUv.y*3.14159);gl_FragColor=vec4(.92,.73,.41,soft*fade*.04);}'});
  for(const i of [0,1,7,9])for(const x of [-3,2,5]){const ray=mesh(new T.CylinderGeometry(.03,2.4,14,24,1,true),rayMat,roots[i],[x,3,-1]);ray.rotation.z=-.22;}
  const frame=new T.WebGLRenderTarget(innerWidth,innerHeight,{type:T.HalfFloatType});
  const postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const postMat=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{map:{value:frame.texture},pixel:{value:new T.Vector2(1/innerWidth,1/innerHeight)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform sampler2D map;uniform vec2 pixel;varying vec2 vUv;void main(){vec3 c=texture2D(map,vUv).rgb;vec3 bloom=vec3(0.);for(int x=-2;x<=2;x++){for(int y=-2;y<=2;y++){vec3 s=texture2D(map,vUv+vec2(float(x),float(y))*pixel*3.).rgb;bloom+=max(s-.65,0.)/25.;}}c+=bloom*.32;float vig=1.-.22*pow(length(vUv-.5)*1.35,2.);gl_FragColor=vec4(c*vig,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`});
  mesh(new T.PlaneGeometry(2,2),postMat,postScene);
  // Local start/end poses, connected by a forward flight into the next set.
  const poses=[
    [[0,1.5,15],[-3,2.3,11],[-1,0.6,0]],
    [[6,3,12],[-4,1,8],[0,1,0]],
    [[0,1.5,13],[0,1,1],[0,1,-7]],
    [[-3,1.2,12],[5,2.5,8],[0,1,0]],
    [[6,3,12],[-5,1,8],[0,.5,0]],
    [[1,1,13],[3,4,8],[0,.5,0]],
    [[0,2,12],[.5,1,-8],[0,2,-20]],
    [[7,3,12],[-3,2,11],[0,.7,0]],
    [[-1,2,11],[4,2,8],[0,.5,0]],
    [[-5,3,14],[5,2,12],[0,1,0]],
    [[4,3,13],[0,.1,6],[0,0,0]],
    [[0,1,15],[0,1,15],[0,1,0]],
  ];
  const from=new T.Vector3(),to=new T.Vector3(),target=new T.Vector3(),next=new T.Vector3(),nextTarget=new T.Vector3();
  let px=0,py=0,burst=0;
  addEventListener('pointermove',e=>{px=e.clientX/innerWidth-.5;py=e.clientY/innerHeight-.5;},{passive:true});
  function pose(i,local){const row=poses[i],u=T.MathUtils.smoothstep(local,0,.72);from.set(...row[0]);to.set(...row[1]);from.lerp(to,u);from.z-=i*42;target.set(...row[2]);target.z-=i*42;}
  return{
    burst(){burst=1;},
    resize(){renderer.setSize(innerWidth,innerHeight);frame.setSize(innerWidth,innerHeight);postMat.uniforms.pixel.value.set(1/innerWidth,1/innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();},
    suspend(){renderer.clear();},
    render(time,index,local,delta){
      const t=time/1000;pose(index,local);
      if(index<11&&local>.74){const mix=T.MathUtils.smoothstep(local,.74,1);next.set(...poses[index+1][0]);next.z-=(index+1)*42;nextTarget.set(...poses[index+1][2]);nextTarget.z-=(index+1)*42;from.lerp(next,mix);target.lerp(nextTarget,mix);}
      if(innerWidth<700){from.z+=5;from.x+=1;target.x=index===0?2.5:index===7||index===9?1.7:index===8?2.8:0;target.y=index===0?1.8:-2.4;}
      camera.position.copy(from);camera.position.x+=px*.35;camera.position.y-=py*.2;camera.lookAt(target);camera.rotation.z=index===4?Math.sin(local*Math.PI)*.06:0;
      roots.forEach((root,i)=>root.visible=Math.abs(i-index)<=1);
      key.position.set(4,6,camera.position.z-4);rim.position.set(-6,3,camera.position.z-10);key.color.setHex(index===5?0xff4e1c:0xffd092);rim.color.setHex(index===5?0xb52209:0x588db4);
      heroHalo.rotation.z=t*.015;birthHalo.rotation.z=local*1.2;birthHalo.rotation.y=local*.6;orb.scale.setScalar(.4+local*1.5);orb.rotation.set(t*.1,local*2,t*.08);
      door.scale.x=Math.max(.02,1-local*.9);trishul.rotation.y=local*.6;battle.rotation.set(local*.4,local*1.8,local*.2);battle.scale.setScalar(1+local*.8);
      rageHalo.rotation.z=-local*2;orbitals.forEach((r,i)=>{r.rotation.y=t*.1+i+local*2;});
      reborn.scale.setScalar(.92+Math.min(local,.6)*.13);rebornHalo.rotation.z=local*.3;
      if(rebirthDust){const assemble=T.MathUtils.clamp(local/.3,0,1);rebirthDust.visible=index===7&&local<.4;rebirthDust.material.uniforms.scatter.value=1-assemble;rebirthDust.material.uniforms.opacity.value=1-T.MathUtils.smoothstep(local,.25,.4);sculptureHolders[1].visible=index!==7||local>.25;}
      modak.rotation.y=t*.18+local*2;modak.position.y=.3+Math.sin(t)*.1;modak.scale.setScalar(1-burst*.12);
      if(index===9)for(let i=0;i<220;i++){dummy.position.set(Math.sin(i*12.4)*7,((i*.31-t*.5)%12+12)%12-3,Math.cos(i*8.2)*6);dummy.rotation.set(t*.3+i,i,t*.2);dummy.scale.set(1,.35,1.5);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix);}petals.instanceMatrix.needsUpdate=true;
      farewell.position.y=-.4-local*2.5;waterMat.uniforms.time.value=t;
      if(farewellDust){const dissolve=T.MathUtils.smoothstep(local,.3,.72);farewellDust.visible=index===10&&local>.3;farewellDust.material.uniforms.scatter.value=dissolve;farewellDust.material.uniforms.opacity.value=1-dissolve*.7;sculptureHolders[3].visible=index!==10||local<.45;}
      dust.position.z=camera.position.z-18;dust.rotation.y=t*.005;dustMat.uniforms.time.value=t;dustMat.uniforms.tint.value.setHex(index===5?0xff7238:index===6?0x9bb9c8:0xe6bc70);dustMat.uniforms.speed.value=index===5?5:index===10?-.5:1;
      burst=Math.max(0,burst-delta*.5);dustMat.uniforms.burst.value=burst;
      renderer.setRenderTarget(frame);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
    }
  };
}
