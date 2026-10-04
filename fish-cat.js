import * as THREE from './assets/vendor/three.module.min.js';

// Original procedural sculpture, interpreted from the supplied fish-cat reference.
// Geometry, painted face, and lighting are local; no model/CDN/tracking requests.
export function createFishCat(button, { paused = false, onHello = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  renderer.setClearColor(0xffffff, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  button.append(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.85, 1.85, 1.75, -1.95, .1, 30);
  camera.position.set(0, .4, 7);
  camera.lookAt(0, .08, 0);
  scene.add(new THREE.HemisphereLight(0xfff9ff, 0xc4b9d0, 2.5));
  const key = new THREE.DirectionalLight(0xfff7e9, 3.4); key.position.set(-3, 5, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xc3dfff, 1.7); fill.position.set(4, 2, -1); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffc6dc, .8); rim.position.set(-3, -1, 2); scene.add(rim);
  const pet = new THREE.Group(); scene.add(pet);
  const white = new THREE.MeshStandardMaterial({ color: 0xf7f3ff, roughness: .4 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xfff1e8, roughness: .55 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xf2a6cb, roughness: .4 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x192031, roughness: .69 });
  const hairMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .41 });
  const sphere = new THREE.SphereGeometry(1, 40, 28);
  function ellipsoid(parent, material, pos, scale, rotation = 0) {
    const mesh = new THREE.Mesh(sphere, material); mesh.position.set(...pos); mesh.scale.set(...scale); mesh.rotation.z = rotation; parent.add(mesh); return mesh;
  }
  function tube(parent, points, radius, material) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, radius, 8, false), material); parent.add(mesh); return mesh;
  }
  function lock(parent, coords, width, depth = .4, tint = true) {
    const curve = new THREE.CubicBezierCurve3(...coords.map(p => new THREE.Vector3(...p)));
    const positions = [], colors = [], indices = [];
    const count = 30, around = 14;
    const c1 = new THREE.Color(0xf9f6ff), c2 = new THREE.Color(tint ? 0xf2a7cf : 0xf9f6ff);
    for (let i = 0; i <= count; i++) {
      const t = i / count, p = curve.getPoint(t), tangent = curve.getTangent(t);
      const side = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
      const radius = width * Math.pow(Math.sin(Math.PI * (.12 + .88 * t)), .62) * Math.pow(1 - t, .17) + .002;
      const color = c1.clone().lerp(c2, THREE.MathUtils.smoothstep(t, .62, 1));
      for (let j = 0; j <= around; j++) {
        const a = j / around * Math.PI * 2;
        positions.push(p.x + side.x * Math.cos(a) * radius, p.y + side.y * Math.cos(a) * radius, p.z + Math.sin(a) * radius * depth);
        colors.push(color.r, color.g, color.b);
        if (i < count && j < around) { const n = i * (around + 1) + j; indices.push(n, n + 1, n + around + 1, n + 1, n + around + 2, n + around + 1); }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.setIndex(indices); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, hairMaterial); parent.add(mesh); return mesh;
  }
  // The fish silhouette stays round, with a separate bifurcated tail and little fins.
  const tail = new THREE.Group(); tail.position.set(-1.0, -.14, -.34); pet.add(tail);
  ellipsoid(tail, pink, [-.38, .24, 0], [.26, .51, .105], .66);
  ellipsoid(tail, pink, [-.40, -.25, 0], [.26, .5, .105], -.63);
  ellipsoid(tail, cream, [-.04, 0, 0], [.35, .29, .23]);
  ellipsoid(pet, white, [-.22, .10, -.12], [1.07, 1.00, .80]);
  const body = ellipsoid(pet, cream, [.05, -.15, .02], [1.05, .91, .84]);
  const finL = ellipsoid(pet, cream, [-.91, -.58, .10], [.20, .33, .17], -.9);
  const finR = ellipsoid(pet, cream, [.89, -.64, -.05], [.17, .27, .17], .85);
  ellipsoid(pet, cream, [-.50, -.93, -.06], [.16, .23, .17], -.3);
  ellipsoid(pet, cream, [.50, -.94, -.08], [.14, .18, .16], .4);
  // Beveled, slightly asymmetric feline ears.
  function ear(x, y, angle, size) {
    const group = new THREE.Group(); group.position.set(x, y, -.05); group.rotation.z = angle; group.scale.setScalar(size); pet.add(group);
    const s = new THREE.Shape(); s.moveTo(-.35, -.17); s.bezierCurveTo(-.42,.08,-.31,.67,-.23,.73); s.bezierCurveTo(-.13,.79,.30,.27,.36,-.09); s.quadraticCurveTo(0,-.23,-.35,-.17);
    const g = new THREE.ExtrudeGeometry(s, { depth:.15, bevelEnabled:true, bevelSegments:4, steps:1, bevelSize:.08, bevelThickness:.08, curveSegments:20 });
    const mesh = new THREE.Mesh(g,white); group.add(mesh);
    const inside = new THREE.Shape(); inside.moveTo(-.25,-.03); inside.quadraticCurveTo(-.29,.25,-.21,.52); inside.quadraticCurveTo(.07,.22,.20,-.04); inside.quadraticCurveTo(0,-.12,-.25,-.03);
    const inner = new THREE.Mesh(new THREE.ShapeGeometry(inside,20),pink); inner.position.z=.237; group.add(inner);
  }
  ear(-.68,.60,.19,1); ear(.74,.66,-.22,.72);
  // Hair has a quiet back volume and individually swept, tapered locks.
  const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24, 0, Math.PI*2, 0, 1.1), white); cap.scale.set(1.09,1.04,.81); cap.position.set(-.02,.04,.02); pet.add(cap);
  lock(pet,[[-.68,.81,.31],[-1.18,.45,.48],[-1.15,-.53,.50],[-.86,-.77,.47]],.28,.58);
  lock(pet,[[-.84,.40,.42],[-1.04,-.04,.55],[-.80,-.55,.57],[-.99,-.73,.52]],.23,.6);
  lock(pet,[[-.83,.06,.51],[-1.02,-.35,.63],[-.51,-.55,.68],[-.68,-.90,.50]],.20,.55);
  lock(pet,[[.72,.79,.31],[1.1,.49,.38],[1.12,-.38,.43],[.92,-.64,.47]],.25,.55);
  lock(pet,[[.95,.19,.31],[1.15,-.22,.34],[.87,-.52,.46],[1.02,-.78,.36]],.17,.53);
  // Fringe, ordered back-to-front. Broad roots merge into the scalp rather than thin cylinders.
  lock(pet,[[.19,1.01,.39],[.64,.87,.69],[.91,.43,.75],[.70,.14,.78]],.23,.48,false);
  lock(pet,[[.14,1.04,.51],[.56,.91,.77],[.67,.38,.92],[.34,.16,.91]],.25,.53,false);
  lock(pet,[[-.10,1.07,.55],[.27,1.04,.88],[.39,.42,.94],[.03,.16,.96]],.26,.5,false);
  lock(pet,[[-.22,1.06,.50],[-.52,.80,.94],[-.27,.40,1.02],[-.59,.14,.88]],.29,.49,false);
  lock(pet,[[-.33,1.00,.39],[-.81,.82,.69],[-.93,-.15,.72],[-.59,-.43,.76]],.29,.50);
  // The tilted midnight beret and its rim sit behind the fringe.
  const hat = new THREE.Group(); hat.position.set(.08,1.01,-.12); hat.rotation.z=-.13; pet.add(hat);
  ellipsoid(hat,dark,[0,0,0],[.86,.13,.62]);
  ellipsoid(hat,dark,[.01,.17,-.05],[.91,.25,.65]);
  ellipsoid(hat,dark,[-.13,.39,-.12],[.08,.04,.08]);
  // Satin ribbon tails, flower, and two crossed hairpins.
  ellipsoid(pet,dark,[1.02,.26,-.09],[.13,.43,.055],.4);
  ellipsoid(pet,dark,[1.05,.21,-.16],[.13,.36,.055],-.24);
  const flower = new THREE.Group(); flower.position.set(.86,.77,.59); flower.rotation.z=-.12; pet.add(flower);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5; ellipsoid(flower,white,[Math.sin(a)*.14,Math.cos(a)*.14,.01],[.077,.155,.053],-a);}
  ellipsoid(flower,pink,[0,0,.07],[.076,.071,.044]);
  for(const [x,y] of [[.79,.48],[.89,.25]]) {
    tube(pet,[[x-.075,y+.10,.824],[x,y,.87],[x+.09,y-.085,.81]],.024,dark);
    tube(pet,[[x-.10,y-.045,.842],[x,y+.015,.87],[x+.065,y+.08,.82]],.022,dark);
  }
  // High-resolution hand-painted eyes are wrapped over the curved face, not a flat billboard.
  function faceTexture(expression) {
    const c=document.createElement('canvas'); c.width=1024;c.height=640; const ctx=c.getContext('2d');
    ctx.scale(1,1); ctx.lineCap='round'; ctx.lineJoin='round';
    function eye(cx,cy,flip) {
      ctx.save();ctx.translate(cx,cy);ctx.scale(flip,1);
      if(expression==='blink' || expression==='happy') {ctx.strokeStyle='#503444';ctx.lineWidth=15;ctx.beginPath();ctx.moveTo(-113,7);ctx.quadraticCurveTo(0,expression==='happy'?-73:20,112,5);ctx.stroke();ctx.restore();return;}
      ctx.beginPath();ctx.moveTo(-111,-65);ctx.bezierCurveTo(-134,-4,-116,124,-54,135);ctx.bezierCurveTo(10,140,86,132,104,78);ctx.bezierCurveTo(127,16,110,-62,69,-81);ctx.closePath();
      ctx.fillStyle='#503040';ctx.fill();
      ctx.save();ctx.clip();
      const iris=ctx.createLinearGradient(0,-90,0,148);iris.addColorStop(0,'#755075');iris.addColorStop(.35,'#b477a4');iris.addColorStop(.78,'#eaa9c5');iris.addColorStop(1,'#ffc6d7');ctx.fillStyle=iris;ctx.fillRect(-103,-81,202,214);
      ctx.fillStyle='rgba(255,189,217,.35)';ctx.beginPath();ctx.ellipse(10,77,81,49,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#8c4d74';ctx.beginPath();ctx.ellipse(1,13,22,40,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fffdfd';ctx.beginPath();ctx.ellipse(-20,-50,18,25,-.14,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(56,78,9,13,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
      ctx.strokeStyle='#362633';ctx.lineWidth=23;ctx.beginPath();ctx.moveTo(-128,-51);ctx.bezierCurveTo(-74,-106,62,-108,118,-46);ctx.stroke();
      ctx.fillStyle='#362633';ctx.beginPath();ctx.moveTo(-130,-53);ctx.lineTo(-150,-92);ctx.lineTo(-93,-69);ctx.fill();
      ctx.strokeStyle='#a78086';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-80,-136);ctx.quadraticCurveTo(-17,-159,54,-143);ctx.stroke();ctx.restore();
    }
    // Soft blush is subtle enough to keep the porcelain body readable.
    for(const x of [169,855]) {const g=ctx.createRadialGradient(x,393,0,x,393,81);g.addColorStop(0,'rgba(244,137,168,.4)');g.addColorStop(1,'rgba(244,137,168,0)');ctx.fillStyle=g;ctx.fillRect(x-82,308,164,170);}
    eye(287,256,1);eye(751,256,-1);
    ctx.strokeStyle='#ac767e';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(468,382);ctx.quadraticCurveTo(488,404,512,381);ctx.quadraticCurveTo(534,404,554,381);ctx.stroke();
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return texture;
  }
  const textures={ open:faceTexture('open'), blink:faceTexture('blink'), happy:faceTexture('happy') };
  const faceMat=new THREE.MeshBasicMaterial({map:textures.open,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const fg=new THREE.PlaneGeometry(1.74,1.05,44,32); const pos=fg.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i)+.05,y=pos.getY(i)-.12;const z=.02+.84*Math.sqrt(Math.max(.01,1-((x-.05)/1.05)**2-((y+.15)/.91)**2));pos.setXYZ(i,x,y,z+.013);}
  fg.computeVertexNormals();const face=new THREE.Mesh(fg,faceMat);pet.add(face);
  // A soft contact shadow gives the floating character a home without a card or backdrop.
  const sc=document.createElement('canvas');sc.width=sc.height=128;const sx=sc.getContext('2d');const grad=sx.createRadialGradient(64,64,2,64,64,61);grad.addColorStop(0,'rgba(78,63,87,.16)');grad.addColorStop(1,'rgba(78,63,87,0)');sx.fillStyle=grad;sx.fillRect(0,0,128,128);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.42),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false}));shadow.position.set(-.05,-1.23,-.4);scene.add(shadow);
  const bubbles=new THREE.Group();scene.add(bubbles);
  const bubbleMat=new THREE.MeshStandardMaterial({color:0xc5dce9,transparent:true,opacity:.30,roughness:.14,metalness:.1});
  for(let i=0;i<3;i++){const b=ellipsoid(bubbles,bubbleMat,[-1.1+i*1.1,-.6,0],[.07,.07,.07]);b.visible=false;}
  let frame=0,last=0, elapsed=0, helloAt=-20, nextBlink=4.5, blinkUntil=0, currentFace='open';
  let hoverX=0,hoverY=0,turn=0,targetTurn=0,drag=null,moved=false,inView=true,disposed=false;
  const baseAngle=-.13;
  function setFace(name){if(currentFace!==name){faceMat.map=textures[name];currentFace=name;}}
  function render(time=0) {
    frame=0;if(disposed)return;
    const dt=Math.min((time-last)/1000,.06)||0;last=time;if(!paused)elapsed+=dt;
    const h=elapsed-helloAt, greeting=h>=0&&h<2.6;
    turn+=(targetTurn-turn)*.12;
    pet.rotation.y=baseAngle+turn+(paused?0:hoverX*.12+Math.sin(elapsed*.65)*.055);
    pet.rotation.x=paused?0:hoverY*.045;
    pet.rotation.z=paused?0:Math.sin(elapsed*.9)*.022+(greeting?Math.sin(h*7)*.065*Math.sin(h/2.6*Math.PI):0);
    pet.position.y=paused?0:Math.sin(elapsed*1.7)*.035+(greeting?Math.sin(h/2.6*Math.PI)*.13:0);
    tail.rotation.y=paused?0:Math.sin(elapsed*2.2)*.16;
    tail.rotation.z=paused?0:Math.sin(elapsed*1.8)*.07;
    finL.rotation.z=-.9+(paused?0:Math.sin(elapsed*2)*.09)+(greeting?Math.sin(h*10)*.22:0);
    finR.rotation.z=.85+(paused?0:Math.sin(elapsed*2+.7)*.07);
    if(!paused&&elapsed>nextBlink){blinkUntil=elapsed+.15;nextBlink=elapsed+3.5+Math.random()*3;}
    setFace(greeting?'happy':(!paused&&elapsed<blinkUntil?'blink':'open'));
    bubbles.children.forEach((b,i)=>{b.visible=!paused&&greeting&&h>i*.25;if(b.visible){const p=h-i*.25;b.position.set(-1.20+i*1.02,-.15+p*.57,0);b.scale.setScalar(.04+i*.017);b.material.opacity=Math.max(0,.32-p*.1);}});
    shadow.scale.x=1-(paused?0:Math.sin(elapsed*1.7)*.035);
    renderer.render(scene,camera);
    if(!paused&&inView&&!document.hidden)frame=requestAnimationFrame(render);
  }
  function schedule(){if(!frame&&!disposed){last=performance.now();frame=requestAnimationFrame(render);}}
  function resize(){const r=button.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);schedule();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(button);
  const intersectionObserver=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)schedule();else if(frame){cancelAnimationFrame(frame);frame=0;}},{threshold:.01});intersectionObserver.observe(button);
  function hello(){onHello();if(paused){setFace('happy');renderer.render(scene,camera);setTimeout(()=>{if(!disposed){setFace('open');renderer.render(scene,camera);}},1000);}else{helloAt=elapsed;schedule();}}
  button.addEventListener('pointermove',e=>{const r=button.getBoundingClientRect();hoverX=(e.clientX-r.left)/r.width*2-1;hoverY=(e.clientY-r.top)/r.height*2-1;if(drag){const delta=e.clientX-drag.x;if(Math.abs(delta)>5)moved=true;targetTurn=THREE.MathUtils.clamp(drag.turn+delta/r.width*2.4,-.85,.85);if(paused){turn=targetTurn;render(performance.now());}}});
  button.addEventListener('pointerleave',()=>{hoverX=hoverY=0;});
  button.addEventListener('pointerdown',e=>{drag={x:e.clientX,turn:targetTurn};moved=false;button.setPointerCapture(e.pointerId);});
  button.addEventListener('pointerup',()=>{drag=null;});
  button.addEventListener('pointercancel',()=>{drag=null;moved=false;});
  button.addEventListener('click',()=>{if(!moved)hello();moved=false;});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(frame)cancelAnimationFrame(frame);frame=0;button.closest('.pet-dock').dataset.ready='false';});
  canvas.addEventListener('webglcontextrestored',()=>{button.closest('.pet-dock').dataset.ready='true';schedule();});
  resize();
  return { setPaused(value){paused=value;if(frame){cancelAnimationFrame(frame);frame=0;}schedule();}, dispose(){disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();intersectionObserver.disconnect();scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();});Object.values(textures).forEach(t=>t.dispose());renderer.dispose();canvas.remove();} };
}
