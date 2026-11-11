import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export async function createBikeViewer(onSelect) {
  const canvas=document.querySelector('#bikeCanvas'), host=document.querySelector('#viewer');
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(33,1,.05,50);
  const defaultCamera=new T.Vector3(-2.45,1.72,2.8), defaultTarget=new T.Vector3(0,.62,0);
  camera.position.copy(defaultCamera);
  const controls=new OrbitControls(camera,canvas);controls.target.copy(defaultTarget);controls.enableDamping=true;controls.dampingFactor=.09;
  controls.enablePan=false;controls.minDistance=1.9;controls.maxDistance=5.8;controls.minPolarAngle=.28;controls.maxPolarAngle=Math.PI*.51;
  scene.add(new T.HemisphereLight(0xffffff,0x8b927b,3.2));
  const key=new T.DirectionalLight(0xfffaf1,4.5);key.position.set(-2.5,5,3);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=2;key.shadow.camera.bottom=-2;key.shadow.normalBias=.025;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
  const rim=new T.DirectionalLight(0xcbdfe1,2);rim.position.set(2,2,-3);scene.add(rim);
  const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({color:0x4e5c38,opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=.004;ground.receiveShadow=true;scene.add(ground);
  const circle=new T.Mesh(new T.RingGeometry(1.11,1.115,80),new T.MeshBasicMaterial({color:0xc8cfb9,transparent:true,opacity:.6,side:T.DoubleSide}));circle.rotation.x=-Math.PI/2;circle.position.y=.007;scene.add(circle);
  const bike=new T.Group();scene.add(bike);
  const mat=(color,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness,flatShading:true});
  const white=mat(0xf0f0e9,.45),trim=mat(0xd4d6ce,.5),black=mat(0x242a2b,.8),rubber=mat(0x171b1c,.95),seatMat=mat(0x373c3d,.95),metal=mat(0xa1a7a3,.35,.65),darkMetal=mat(0x4b5352,.55,.5),red=mat(0x9f201d,.3),amber=mat(0xe48825,.3),glass=mat(0xc3d7d6,.24,.25),dial=mat(0x1a2929,.5),blue=mat(0x5e8693,.4);
  const selectable=[];const animated={};const rests=new Map();
  function mesh(geo,material,parent=bike,id){const o=new T.Mesh(geo,material);o.castShadow=true;o.receiveShadow=true;parent.add(o);if(id){o.userData.article=id;selectable.push(o);}return o;}
  function box(size,pos,material,parent=bike,id){const o=mesh(new T.BoxGeometry(...size),material,parent,id);o.position.set(...pos);return o;}
  function ellipsoid(size,pos,material,parent=bike,id,detail=1){const o=mesh(new T.IcosahedronGeometry(1,detail),material,parent,id);o.scale.set(...size);o.position.set(...pos);return o;}
  function rod(a,b,r,material,parent=bike,id,r2=r){const aa=new T.Vector3(...a),bb=new T.Vector3(...b),d=bb.clone().sub(aa);const o=mesh(new T.CylinderGeometry(r2,r,d.length(),10),material,parent,id);o.position.copy(aa.add(bb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
  function profile(points,width,material,parent=bike,id,bevel=.03){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,steps:1,curveSegments:4});geo.translate(0,0,-width/2);return mesh(geo,material,parent,id);}
  // Cross-sections keep the scooter's bulky rear shell faceted without square corners.
  function loft(sections,material,parent=bike,id){const vertices=[],indices=[],n=12;sections.forEach(([x,cy,ry,rz])=>{for(let j=0;j<n;j++){let a=j/n*Math.PI*2;vertices.push(x,cy+Math.sin(a)*ry,Math.cos(a)*rz);}});for(let i=0;i<sections.length-1;i++)for(let j=0;j<n;j++){let a=i*n+j,b=i*n+(j+1)%n,c=(i+1)*n+j,d=(i+1)*n+(j+1)%n;indices.push(a,c,b,b,c,d);}for(let j=1;j<n-1;j++){indices.push(0,j,j+1);let k=(sections.length-1)*n;indices.push(k,k+j+1,k+j);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return mesh(geo,material,parent,id);}
  function mark(group,part){group.traverse(o=>{if(o.isMesh&&!o.userData.article){o.userData.article=part;selectable.push(o);}});}
  // Wheel sizes preserve the smaller rear wheel of the LEAD 110.
  function wheel(x,y,r,width,front){const g=new T.Group();bike.add(g);g.position.set(x,y,0);const tyre=mesh(new T.TorusGeometry(r-.048,.048,6,32),rubber,g,'tyres');tyre.scale.z=width/.096;
    const rim=mesh(new T.CylinderGeometry(r-.07,r-.07,width*.67,16),metal,g,'tyres');rim.rotation.x=Math.PI/2;
    for(const z of [-1,1]){const hub=mesh(new T.CylinderGeometry(.043,.043,.018,12),darkMetal,g,'tyres');hub.rotation.x=Math.PI/2;hub.position.z=z*width*.4;for(let i=0;i<5;i++){let a=i/5*Math.PI*2;rod([Math.cos(a)*.045,Math.sin(a)*.045,z*width*.37],[Math.cos(a)*(r-.085),Math.sin(a)*(r-.085),z*width*.37],.012,trim,g,'tyres');}}
    if(front){const disc=mesh(new T.CylinderGeometry(.117,.117,.008,24),darkMetal,g,'brakes');disc.rotation.x=Math.PI/2;disc.position.z=.078;const ring=mesh(new T.TorusGeometry(.092,.012,4,24),metal,g,'brakes');ring.position.z=.084;box([.055,.085,.055],[.075,.065,.097],mat(0x6e6b61),g,'brakes');for(let i=0;i<12;i++){let a=i/12*Math.PI*2;const hole=mesh(new T.CircleGeometry(.008,6),black,g,'brakes');hole.position.set(Math.cos(a)*.083,Math.sin(a)*.083,.085);}}
    return g;
  }
  wheel(-.65,.242,.24,.115,true);wheel(.625,.216,.214,.135,false);
  const fork=new T.Group();bike.add(fork);for(const z of [-.083,.083]){rod([-.65,.25,z],[-.575,.69,z],.021,metal,fork,'suspension');rod([-.65,.25,z],[-.615,.43,z],.031,darkMetal,fork,'suspension');}
  profile([[-.91,.41],[-.83,.52],[-.65,.56],[-.49,.5],[-.43,.41],[-.49,.43],[-.66,.49],[-.81,.46]],.145,white,bike,'panels',.012);
  // Floorboard and lower chassis.
  profile([[-.46,.29],[-.38,.36],[.17,.36],[.25,.27],[-.44,.25]],.40,white,bike,'panels',.025);
  box([.59,.035,.42],[-.13,.355,0],black,bike,'panels');
  for(let i=0;i<7;i++)box([.025,.006,.31],[-.38+i*.065,.376,0],darkMetal,bike,'panels');
  rod([-.37,.26,-.12],[.59,.26,-.12],.029,darkMetal);rod([-.37,.26,.12],[.59,.26,.12],.029,darkMetal);
  // The inner shield stays put while the outer centre cover moves for service.
  const shield=profile([[-.53,.48],[-.59,.95],[-.48,.97],[-.33,.38],[-.43,.32],[-.48,.37]],.43,black,bike,'glove',.025);
  const frontPanel=new T.Group();bike.add(frontPanel);animated.battery=frontPanel;
  profile([[-.74,.48],[-.68,.93],[-.59,.99],[-.51,.92],[-.49,.67],[-.43,.39],[-.57,.33]],.43,white,frontPanel,'battery',.023);
  for(const z of [-.225,.225]){const piece=profile([[-.70,.54],[-.67,.84],[-.61,.92],[-.56,.84],[-.58,.61]],.016,glass,frontPanel,'front-turn',.006);piece.position.z=z;ellipsoid([.037,.06,.014],[-.649,.74,z*1.04],amber,frontPanel,'front-turn',0);}
  const nose=profile([[-.743,.58],[-.698,.87],[-.65,.91],[-.632,.86],[-.674,.61]],.13,trim,frontPanel,'battery',.006);
  for(let i=0;i<3;i++){const vent=box([.008,.012,.075],[-.73+i*.008,.59+i*.04,0],darkMetal,frontPanel,'battery');vent.rotation.z=-.2;}
  // Actual battery and fuse block behind the removable front centre panel.
  box([.11,.15,.15],[-.613,.69,0],black,bike,'battery');box([.115,.018,.16],[-.613,.775,0],darkMetal,bike,'battery');box([.024,.013,.024],[-.613,.789,.049],red,bike,'battery');box([.024,.013,.024],[-.613,.789,-.049],darkMetal,bike,'battery');rod([-.613,.79,.05],[-.58,.61,.06],.005,red,bike,'battery');box([.07,.09,.075],[-.61,.56,.12],black,bike,'fuses');for(let i=0;i<3;i++)box([.012,.025,.014],[-.65,.54+i*.026,.13],mat(0xb82b27),bike,'fuses');
  // Front glovebox is inset in the rider-facing shield.
  const glovePivot=new T.Group();glovePivot.position.set(-.395,.58,0);bike.add(glovePivot);animated.glove=glovePivot;
  const glove=box([.025,.205,.265],[-.015,.105,0],black,glovePivot,'glove');glove.rotation.z=.2;box([.032,.025,.047],[.005,.179,0],metal,glovePivot,'glove');
  box([.09,.11,.25],[-.49,.7,0],black,bike,'glove');
  const ignition=mesh(new T.CylinderGeometry(.021,.021,.006,12),metal,bike,'controls');ignition.rotation.z=Math.PI/2;ignition.position.set(-.415,.86,.14);box([.008,.018,.004],[-.41,.86,.14],black,bike,'controls');
  // Steering, headlight nacelle, instrument cluster and mirrors.
  rod([-.58,.75,0],[-.565,1.03,0],.034,darkMetal,bike,'controls');
  loft([[-.72,1.057,.045,.13],[-.665,1.08,.09,.225],[-.56,1.08,.085,.24],[-.48,1.065,.043,.17]],white,bike,'headlight');
  const lens=new T.Group();lens.position.set(-.727,1.065,0);bike.add(lens);
  const lensShape=new T.Shape();lensShape.moveTo(-.165,.027);lensShape.lineTo(-.105,.071);lensShape.lineTo(.105,.071);lensShape.lineTo(.165,.027);lensShape.lineTo(.10,-.045);lensShape.lineTo(-.10,-.045);lensShape.closePath();
  const lensGeo=new T.ExtrudeGeometry(lensShape,{depth:.012,bevelEnabled:true,bevelSize:.008,bevelThickness:.004,bevelSegments:1});const lensMesh=mesh(lensGeo,glass,lens,'headlight');lensMesh.rotation.y=-Math.PI/2;
  const bulbMaterial=mat(0xe0e9db,.2,.35);const headBulb=ellipsoid([.008,.028,.06],[-.746,1.075,0],bulbMaterial,bike,'headlight');
  const light=new T.PointLight(0xffe6a6,0,2);light.position.set(-.79,1.07,0);bike.add(light);
  for(const side of [-1,1]){rod([-.57,1.075,side*.16],[-.53,1.055,side*.31],.018,metal,bike,'controls');rod([-.53,1.055,side*.26],[-.52,1.055,side*.36],.027,rubber,bike,'controls');rod([-.57,1.08,side*.245],[-.62,1.075,side*.34],.009,metal,bike,'brakes');rod([-.59,1.12,side*.21],[-.59,1.32,side*.31],.0075,darkMetal,bike,'controls');const mir=ellipsoid([.032,.055,.087],[-.59,1.338,side*.325],black,bike,'controls',1);const mg=ellipsoid([.006,.042,.068],[-.563,1.34,side*.325],blue,bike,'controls',1);}
  const cluster=box([.12,.026,.225],[-.522,1.117,0],dial,bike,'dashboard');cluster.rotation.z=-.19;
  for(const z of [-.067,.02,.078]){const gauge=mesh(new T.CylinderGeometry(z===.02?.04:.022,z===.02?.04:.022,.003,18),glass,bike,'dashboard');gauge.position.set(-.517,1.134,z);for(let i=0;i<6;i++){let a=i/6*Math.PI*1.5;const tick=box([.006,.004,.003],[-.517+Math.cos(a)*.028,1.139,z+Math.sin(a)*.028],trim,bike,'dashboard');tick.rotation.y=-a;}}
  box([.007,.006,.041],[-.516,1.14,.02],red,bike,'dashboard').rotation.y=.7;
  // Storage tub: open top and visible floor, with no opaque lid below the seat.
  const tub=new T.Group();bike.add(tub);animated.engine=tub;
  box([.65,.025,.34],[.405,.55,0],black,tub,'seat');box([.71,.24,.025],[.405,.68,.19],black,tub,'seat');box([.71,.24,.025],[.405,.68,-.19],black,tub,'seat');box([.035,.23,.4],[.065,.68,0],black,tub,'seat');box([.035,.23,.4],[.75,.68,0],black,tub,'seat');
  const bodyPanels=[];
  for(const side of [-1,1]){const g=new T.Group();bike.add(g);bodyPanels.push(g);const p=profile([[.055,.40],[.025,.73],[.10,.805],[.53,.825],[.77,.78],[.9,.69],[.89,.57],[.77,.47],[.43,.425],[.13,.39]],.035,white,g,'engine',.027);p.position.z=side*.215;
    const stripe=profile([[.12,.45],[.38,.43],[.73,.46],[.86,.54],[.75,.49],[.37,.47]],.013,trim,g,'panels',.004);stripe.position.z=side*.27;
    // A small typographic decal is generated locally, no network assets.
    const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=64;const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#686f6b';ctx.font='italic bold 42px Arial';ctx.textAlign='center';ctx.fillText('LEAD',128,45);const tex=new T.CanvasTexture(labelCanvas);const decal=mesh(new T.PlaneGeometry(.19,.048),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}),g,'panels');decal.position.set(.54,.65,side*.269);if(side<0)decal.rotation.y=Math.PI;
  }
  const frontSeatCover=profile([[.025,.40],[.025,.73],[.075,.805],[.12,.77],[.13,.40]],.395,white,bodyPanels[0],'engine',.025);
  animated.sidePanels=bodyPanels;
  // Rear drivetrain, exposed when the side shells and tub are removed.
  const engine=loft([[.08,.33,.09,.12],[.23,.35,.13,.17],[.49,.30,.09,.14],[.66,.26,.07,.10]],darkMetal,bike,'engine');
  profile([[.07,.26],[.07,.41],[.25,.47],[.45,.38],[.73,.32],[.76,.22],[.61,.16],[.18,.18]],.10,darkMetal,bike,'cvt',.03).position.z=-.17;
  for(let i=0;i<6;i++)box([.17,.008,.025],[.19,.39+i*.014,-.23],metal,bike,'engine');
  const filter=loft([[.07,.47,.065,.055],[.19,.51,.085,.08],[.45,.49,.075,.075],[.60,.46,.05,.055]],black,bike,'air');filter.position.z=-.23;
  rod([.28,.42,-.1],[.26,.56,-.05],.023,black,bike,'spark');rod([.33,.43,.12],[.35,.3,.19],.014,metal,bike,'oil');const cap=mesh(new T.CylinderGeometry(.022,.022,.016,10),mat(0x9e8b4b),bike,'oil');cap.position.set(.36,.32,.20);cap.rotation.x=Math.PI/2;
  const radiator=box([.21,.19,.04],[.29,.46,.15],darkMetal,bike,'coolant');for(let i=0;i<7;i++)box([.18,.008,.01],[.29,.38+i*.024,.177],metal,bike,'coolant');rod([.32,.52,.14],[.45,.41,.11],.012,black,bike,'coolant');
  rod([.65,.27,-.12],[.50,.69,-.16],.023,metal,bike,'suspension');for(let i=0;i<10;i++){const coil=mesh(new T.TorusGeometry(.032,.006,4,10),darkMetal,bike,'suspension');coil.rotation.x=Math.PI/2;coil.rotation.z=-.35;coil.position.set(.532+i*.010,.59-i*.027,-.15);}
  // Muffler on the right, with heat shield and outlet.
  const muffler=loft([[.22,.255,.045,.05],[.35,.27,.067,.065],[.75,.29,.07,.065],[.84,.30,.045,.044]],black,bike,'engine');muffler.position.z=.21;
  const heatshield=profile([[.33,.26],[.36,.32],[.73,.35],[.78,.30],[.72,.25]],.018,metal,bike,'engine',.012);heatshield.position.z=.277;
  rod([.83,.30,.21],[.88,.30,.21],.026,darkMetal,bike,'engine');rod([.13,.36,.09],[.27,.25,.19],.018,darkMetal,bike,'engine');
  // Seat pivots at the front; opening also exposes the storage tub.
  const seatPivot=new T.Group();seatPivot.position.set(.035,.84,0);bike.add(seatPivot);animated.seat=seatPivot;
  loft([[0,.017,.035,.16],[.09,.025,.06,.21],[.42,.052,.062,.245],[.72,.06,.05,.20],[.81,.04,.027,.12]],seatMat,seatPivot,'seat');
  loft([[.01,-.012,.014,.165],[.15,-.015,.018,.214],[.48,.008,.017,.245],[.73,.019,.018,.20],[.80,.023,.012,.125]],black,seatPivot,'seat');
  // Tail cluster, grab rail, rear mudguard and a blank private plate.
  const tail=loft([[.81,.69,.048,.18],[.92,.68,.043,.17],[.95,.66,.027,.13]],red,bike,'tail');for(const side of [-1,1])ellipsoid([.04,.035,.065],[.915,.69,side*.16],amber,bike,'tail',0);
  for(const z of [-.2,.2])rod([.70,.84,z],[.91,.82,z*.8],.012,metal,bike,'seat');rod([.91,.82,-.16],[.91,.82,.16],.012,metal,bike,'seat');
  profile([[.82,.59],[.89,.59],[.91,.29],[.83,.28]],.15,black,bike,'tail',.005);
  const plate=box([.012,.105,.175],[.914,.435,0],trim,bike,'tail');plate.rotation.z=-.13;box([.02,.02,.075],[.921,.505,0],glass,bike,'tail');
  rod([.18,.23,-.13],[.06,.07,-.23],.012,darkMetal,bike,'panels');rod([.18,.23,.13],[.06,.07,.23],.012,darkMetal,bike,'panels');rod([.06,.07,-.23],[.06,.07,.23],.012,darkMetal,bike,'panels');
  // Each movable panel retains its own baseline for reversible animations.
  Object.values(animated).flat().forEach(o=>{rests.set(o,{position:o.position.clone(),rotation:o.rotation.clone()});});
  const open={seat:false,glove:false,battery:false,engine:false};let lightsOn=false,active='overview',labels=true,cameraGoal=null,targetGoal=null;
  const points=[
    {id:'headlight',label:'Свет',p:[-.75,1.08,.02],system:'lights',offset:[-28,-20]},
    {id:'dashboard',label:'Приборы',p:[-.49,1.15,-.05],system:'cockpit',offset:[34,-36]},
    {id:'battery',label:'Аккумулятор',p:[-.69,.65,.24],system:'electric',offset:[-35,-12]},
    {id:'seat',label:'Багажник',p:[.48,.91,0],system:'body',offset:[5,-30]},
    {id:'engine',label:'Двигатель',p:[.24,.42,.23],system:'engine',offset:[10,13]},
    {id:'cvt',label:'Вариатор',p:[.33,.29,-.24],system:'drive',offset:[22,20]},
    {id:'tyres',label:'Колёса',p:[-.67,.20,.09],system:'wheels',offset:[-17,18]},
    {id:'glove',label:'Бардачок',p:[-.37,.70,0],system:'body',offset:[35,12]},
    {id:'tail',label:'Задний свет',p:[.93,.69,0],system:'lights',offset:[30,-7]},
    {id:'oil',label:'Масло',p:[.36,.32,.22],system:'engine',offset:[30,20]},
    {id:'air',label:'Фильтр',p:[.25,.50,-.29],system:'engine',offset:[-28,-15]},
    {id:'fuses',label:'Предохранители',p:[-.51,.56,.13],system:'electric',offset:[34,20]},
    {id:'brakes',label:'Передний тормоз',p:[-.65,.28,.12],system:'wheels',offset:[22,-27]}
  ];
  const hotspotHost=document.querySelector('#hotspots');points.forEach((p,i)=>{p.el=document.createElement('button');p.el.className='hotspot';p.el.dataset.topic=p.id;p.el.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span>${p.label}`;p.el.setAttribute('aria-label',`Открыть: ${p.label}`);p.el.onclick=()=>onSelect(p.id);hotspotHost.append(p.el);});
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();let pointerDown=null;
  canvas.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY,id:e.pointerId};});
  canvas.addEventListener('pointerup',e=>{if(!pointerDown||pointerDown.id!==e.pointerId||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>6)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(selectable,false).find(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});if(hit)onSelect(hit.object.userData.article);pointerDown=null;});
  function orbit(angle){cameraGoal=null;targetGoal=null;const v=camera.position.clone().sub(controls.target);v.applyAxisAngle(new T.Vector3(0,1,0),angle);camera.position.copy(controls.target).add(v);controls.update();}
  function zoom(factor){cameraGoal=null;targetGoal=null;const v=camera.position.clone().sub(controls.target);const d=T.MathUtils.clamp(v.length()*factor,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(v.setLength(d));controls.update();}
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Home'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')orbit(-.15);if(e.key==='ArrowRight')orbit(.15);if(e.key==='ArrowUp'||e.key==='ArrowDown'){const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));s.phi=T.MathUtils.clamp(s.phi+(e.key==='ArrowUp'?-.1:.1),.28,Math.PI*.51);camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s));}if(['+','='].includes(e.key))zoom(.9);if(e.key==='-')zoom(1.1);if(e.key==='Home')reset();}});
  function reset(){cameraGoal=null;targetGoal=null;camera.position.copy(defaultCamera);controls.target.copy(defaultTarget);controls.update();document.querySelector('#viewCaption').textContent='Вид в три четверти';}
  controls.addEventListener('start',()=>{cameraGoal=null;targetGoal=null;document.querySelector('#viewCaption').textContent='Свободный обзор';});
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let width=1,height=1;
  const resize=()=>{width=host.clientWidth;height=host.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=width<440?41:33;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();
  let previousTime=0,paused=false;
  document.addEventListener('visibilitychange',()=>{paused=document.hidden;});
  function animate(now){requestAnimationFrame(animate);if(paused)return;const dt=Math.min((now-previousTime)/1000,.05)||.016;previousTime=now;const lerp=motion.matches?1:1-Math.exp(-9*dt);
    seatPivot.rotation.z=T.MathUtils.lerp(seatPivot.rotation.z,open.seat?1.30:0,lerp);
    glovePivot.rotation.z=T.MathUtils.lerp(glovePivot.rotation.z,open.glove?-1.05:0,lerp);
    frontPanel.position.x=T.MathUtils.lerp(frontPanel.position.x,open.battery?-.36:0,lerp);frontPanel.position.y=T.MathUtils.lerp(frontPanel.position.y,open.battery?.06:0,lerp);
    tub.position.y=T.MathUtils.lerp(tub.position.y,open.engine?.35:0,lerp);tub.position.x=T.MathUtils.lerp(tub.position.x,open.engine?.18:0,lerp);
    bodyPanels.forEach((o,i)=>{o.position.z=T.MathUtils.lerp(o.position.z,open.engine?(i===0?-.35:.35):0,lerp);});
    if(cameraGoal){camera.position.lerp(cameraGoal,lerp);controls.target.lerp(targetGoal,lerp);if(camera.position.distanceTo(cameraGoal)<.004){cameraGoal=null;targetGoal=null;}}
    controls.update();scene.updateMatrixWorld();
    const placed=[];
    for(const p of points){const relevant=active==='overview'?['headlight','seat','engine','battery','tyres'].includes(p.id):p.system===active;let show=labels&&relevant;
      const vec=new T.Vector3(...p.p);if(p.id==='seat'&&(open.seat||open.engine))vec.y+=.22;
      vec.project(camera);if(vec.z>1||vec.z<-1)show=false;
      let x=(vec.x*.5+.5)*width+p.offset[0],y=(-vec.y*.5+.5)*height+p.offset[1];
      x=T.MathUtils.clamp(x,75,width-76);y=T.MathUtils.clamp(y,72,height-100);
      // Keep hit targets separated even when viewed from an edge-on angle.
      if(show){for(const other of placed){if(Math.abs(other.x-x)<115&&Math.abs(other.y-y)<45)y=other.y+47;}if(y>height-95)y=height-95;placed.push({x,y});}
      p.el.hidden=!show;p.el.style.left=`${x}px`;p.el.style.top=`${y}px`;
    }
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);document.querySelector('#loading').hidden=true;
  return {
    select(system,article){active=system;points.forEach(p=>p.el.classList.toggle('active',p.id===article));},
    toggle(part){if(!(part in open))return false;open[part]=!open[part];if(part==='engine')open.seat=open.engine;if(part==='seat'&&!open.seat)open.engine=false;if(open[part]){const views={glove:[2.5,1.9,2.65],battery:[-3.4,1.9,2.6],seat:[-1.8,2.5,2.7],engine:[-2.1,2.5,3.5]};cameraGoal=new T.Vector3(...views[part]);targetGoal=new T.Vector3(0,.68,0);document.querySelector('#viewCaption').textContent='Сервисный доступ';}return open[part];},
    isOpen(part){return Boolean(open[part]);},
    setLabels(value){labels=value;},orbit,zoom,reset,
    toggleLights(){lightsOn=!lightsOn;light.intensity=lightsOn?2:0;bulbMaterial.emissive.set(lightsOn?0xffd47b:0);bulbMaterial.emissiveIntensity=lightsOn?2:0;return lightsOn;},
    isLightOn(){return lightsOn;},
    diagnostics(){return {meshes:selectable.length,triangles:renderer.info.render.triangles,open:{...open},lightsOn,active,width,height};}
  };
}
