/*! Sword Sovereign (万剑归宗) · (c) 2026 stackcraftio · MIT License */
(function(){
'use strict';
const TAU=Math.PI*2, MAXN=10000, CAMD=36, FOV=55;
const $=id=>document.getElementById(id);

if(typeof THREE==='undefined'){
  document.body.innerHTML='<p style="padding:40px;font-family:sans-serif;color:#fff">Could not load Three.js from the CDN. Please check your internet connection and reload.</p>';
  return;
}

/* ---------------- formations ---------------- */
const FORMS=[
  {name:'Sword Orbit',zh:'环剑'},
  {name:'Sword Summoning',zh:'召剑'},
  {name:'Defensive Formation',zh:'护体剑阵'},
  {name:'Sword Launch',zh:'飞剑齐发'},
  {name:'Precision Control',zh:'御剑'},
  {name:'Rain of Swords',zh:'剑雨'},
  {name:'Spiral Vortex',zh:'剑旋'},
  {name:'Ten Thousand Swords',zh:'万剑归宗'}
];
const FORM_K=[22,30,40,90,26,90,26,20];

/* ---------------- state ---------------- */
const S={n:1500,size:1,form:0,manual:null,ax:0,ay:0,az:0,ltx:0,lty:4,ltz:-25,px:0,py:0,pz:0,
  ultT:0,flash:0,swordScale:0.4,mouseMode:false,camOn:false,adv:true,trails:true,bloom:true,circle:true,
  particles:true,sound:true,theme:'azure',env:'midnight'};
const H={count:0,form:0,cand:'none',candN:0,lastT:0,ax:0,ay:0,az:0,ltx:0,lty:0,ltz:-25,px:0,py:0,pz:0,prevRaw:'none'};
const M={nx:.5,ny:.5,has:false};

/* ---------------- renderer ---------------- */
const renderer=new THREE.WebGLRenderer({canvas:$('gl'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x04050c);
scene.fog=new THREE.FogExp2(0x04050c,0.010);
const camera=new THREE.PerspectiveCamera(FOV,1,0.1,800);
camera.position.set(0,2,CAMD);
let VISH=2*CAMD*Math.tan(FOV*Math.PI/360), VISW=VISH;

let composer=null,bloom=null;
if(THREE.EffectComposer&&THREE.RenderPass&&THREE.UnrealBloomPass){
  composer=new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene,camera));
  bloom=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.8,0.55,0.12);
  composer.addPass(bloom);
}else{
  S.bloom=false; $('optBloomRow').style.display='none';
}

function onResize(){
  const w=innerWidth,h=innerHeight;
  renderer.setSize(w,h,false);
  if(composer) composer.setSize(w,h);
  camera.aspect=w/h; camera.updateProjectionMatrix();
  VISW=VISH*camera.aspect;
}
addEventListener('resize',onResize); onResize();

/* ---------------- environments & themes ---------------- */
const ENVS={
  midnight:{bg:0x04050c,fog:0.010,star:0xbfd8ff},
  dawn:{bg:0x150d2a,fog:0.012,star:0xffd9f0},
  abyss:{bg:0x01121a,fog:0.016,star:0x8fe8ff},
  ember:{bg:0x1c0705,fog:0.012,star:0xffc9a0},
  void:{bg:0x000000,fog:0.004,star:0xffffff}
};
const THEMES={
  azure:[0x66ccff,0x9be6ff,0x4d9bff],
  crimson:[0xff4d5e,0xff9a6b,0xff2d55],
  jade:[0x4dffb0,0xb3ffd9,0x2de0a0],
  gold:[0xffd45e,0xfff1a8,0xffaa33],
  violet:[0xb07cff,0xe0b3ff,0x7a5cff],
  rainbow:null
};
const accent=new THREE.Color(0x66ccff);

/* ---------------- per-sword data ---------------- */
const F32=()=>new Float32Array(MAXN);
const R1=F32(),R2=F32(),R3=F32(),KV=F32(),SQV=F32(),CI=new Uint8Array(MAXN),RB=F32();
const PX=F32(),PY=F32(),PZ=F32(),VX=F32(),VY=F32(),VZ=F32(),DX=F32(),DY=F32(),DZ=F32(),SC=F32(),SCT=F32();
const TX=F32(),TY=F32(),TZ=F32(),FX=F32(),FY=F32(),FZ=F32();
for(let i=0;i<MAXN;i++){
  R1[i]=Math.random();R2[i]=Math.random();R3[i]=Math.random();
  KV[i]=0.6+Math.random()*0.8;SQV[i]=Math.sqrt(KV[i]);
  CI[i]=(Math.random()*3)|0;RB[i]=0.8+Math.random()*0.2;
  const th=Math.random()*TAU,ph=Math.acos(2*Math.random()-1),r=40+Math.random()*30;
  PX[i]=Math.sin(ph)*Math.cos(th)*r;PY[i]=Math.cos(ph)*r;PZ[i]=Math.sin(ph)*Math.sin(th)*r-10;
  DX[i]=0;DY[i]=1;DZ[i]=0;SC[i]=0;SCT[i]=1;
}

/* ---------------- sword geometry ---------------- */
function buildSwordGeometry(){
  const pos=[],col=[];
  function tri(a,b,c,rgb,sh){
    for(const p of [a,b,c]){pos.push(p[0],p[1],p[2]);col.push(rgb[0]*sh,rgb[1]*sh,rgb[2]*sh);}
  }
  function box(cx,cy,cz,w,h,d,rgb){
    const x0=cx-w/2,x1=cx+w/2,y0=cy-h/2,y1=cy+h/2,z0=cz-d/2,z1=cz+d/2;
    const F=[
      [[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],.8],
      [[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[x0,y0,z0],.55],
      [[x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],1],
      [[x0,y0,z1],[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],.5],
      [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],1],
      [[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],.65]
    ];
    for(const f of F){tri(f[0],f[1],f[2],rgb,f[4]);tri(f[0],f[2],f[3],rgb,f[4]);}
  }
  function pyramid(yb,ya,hw,hd,rgb){
    const A=[0,ya,0],a=[hw,yb,hd],b=[hw,yb,-hd],c=[-hw,yb,-hd],d=[-hw,yb,hd];
    tri(A,a,b,rgb,.8);tri(A,b,c,rgb,.65);tri(A,c,d,rgb,.55);tri(A,d,a,rgb,1);
  }
  const W=[1,1,1];
  box(-0.08,1.1,0,0.16,1.6,0.07,[.78,.78,.78]);   // blade, shaded half
  box(0.08,1.1,0,0.16,1.6,0.07,W);                // blade, lit half
  pyramid(1.9,2.6,0.16,0.035,W);                  // tip
  box(0,0.22,0,0.84,0.1,0.17,[.92,.92,.92]);      // guard
  box(0,-0.22,0,0.1,0.55,0.1,[.35,.35,.4]);       // hilt
  box(0,-0.58,0,0.18,0.14,0.18,[.8,.8,.8]);       // pommel
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  g.translate(0,-0.9,0);
  return g;
}
const swordMat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
const swordMesh=new THREE.InstancedMesh(buildSwordGeometry(),swordMat,MAXN);
swordMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
swordMesh.frustumCulled=false; swordMesh.count=S.n;

const tg=new THREE.CylinderGeometry(0.16,0,1,4,1,true); tg.translate(0,-0.5,0);
{
  const pa=tg.attributes.position,cols=new Float32Array(pa.count*3);
  for(let i=0;i<pa.count;i++){const v=Math.max(0,1+pa.getY(i))*0.9;cols[i*3]=v;cols[i*3+1]=v;cols[i*3+2]=v;}
  tg.setAttribute('color',new THREE.BufferAttribute(cols,3));
}
const trailMat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
const trailMesh=new THREE.InstancedMesh(tg,trailMat,MAXN);
trailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
trailMesh.frustumCulled=false; trailMesh.count=S.n;

const COL=new Float32Array(MAXN*3);
const colA=new THREE.InstancedBufferAttribute(COL,3); colA.setUsage(THREE.DynamicDrawUsage);
const colB=new THREE.InstancedBufferAttribute(COL,3); colB.setUsage(THREE.DynamicDrawUsage);
swordMesh.instanceColor=colA; trailMesh.instanceColor=colB;
scene.add(trailMesh); scene.add(swordMesh);

/* ---------------- stars, particles, summoning circles ---------------- */
function glowTexture(){
  const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);
}
const glowTex=glowTexture();

const starN=1400,starPos=new Float32Array(starN*3);
for(let i=0;i<starN;i++){
  const th=Math.random()*TAU,ph=Math.acos(2*Math.random()-1),r=140+Math.random()*200;
  starPos[i*3]=Math.sin(ph)*Math.cos(th)*r;starPos[i*3+1]=Math.cos(ph)*r;starPos[i*3+2]=Math.sin(ph)*Math.sin(th)*r;
}
const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));
const starMat=new THREE.PointsMaterial({size:1.6,map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:.8,color:0xbfd8ff});
const stars=new THREE.Points(starGeo,starMat);scene.add(stars);

const PN=700,partPos=new Float32Array(PN*3),PA=F32(),PR=F32(),PYv=F32(),PS=F32();
for(let i=0;i<PN;i++){PA[i]=Math.random()*TAU;PR[i]=0.25+Math.random()*0.75;PYv[i]=Math.random()*2-1;PS[i]=0.4+Math.random()*1.2;}
const partGeo=new THREE.BufferGeometry();partGeo.setAttribute('position',new THREE.BufferAttribute(partPos,3));
const partMat=new THREE.PointsMaterial({size:0.9,map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:.85});
const parts=new THREE.Points(partGeo,partMat);parts.frustumCulled=false;scene.add(parts);
let partRad=6;

function circleTexture(kind){
  const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');
  x.translate(512,512);x.strokeStyle='#fff';x.fillStyle='#fff';x.lineCap='round';
  const ring=(r,w,a)=>{x.globalAlpha=a;x.lineWidth=w;x.beginPath();x.arc(0,0,r,0,TAU);x.stroke();};
  if(kind==='outer'){
    ring(490,6,1);ring(470,2,.7);ring(380,3,.8);ring(360,2,.5);
    for(let i=0;i<72;i++){const a=i/72*TAU,l=i%6===0?34:14;x.globalAlpha=.8;x.lineWidth=i%6===0?4:2;
      x.beginPath();x.moveTo(Math.cos(a)*470,Math.sin(a)*470);x.lineTo(Math.cos(a)*(470-l),Math.sin(a)*(470-l));x.stroke();}
    const txt='万剑归宗 · 御剑飞行 · 一剑破万法 · 剑气纵横 · ';
    x.font='46px "Songti SC","Noto Serif SC","STSong","SimSun",serif';x.textAlign='center';x.textBaseline='middle';x.globalAlpha=.9;
    const n=txt.length;
    for(let i=0;i<n;i++){const a=i/n*TAU;x.save();x.rotate(a);x.translate(0,-420);x.fillText(txt[i],0,0);x.restore();}
  }else{
    ring(300,5,1);ring(150,3,.8);
    for(const rot of [0,Math.PI]){
      x.save();x.rotate(rot);x.globalAlpha=.9;x.lineWidth=4;x.beginPath();
      for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3;const px=Math.cos(a)*300,py=Math.sin(a)*300;i?x.lineTo(px,py):x.moveTo(px,py);}
      x.closePath();x.stroke();x.restore();
    }
    for(let i=0;i<6;i++){const a=-Math.PI/2+i*TAU/6;x.globalAlpha=.9;x.beginPath();x.arc(Math.cos(a)*300,Math.sin(a)*300,18,0,TAU);x.fill();
      x.lineWidth=2;x.beginPath();x.moveTo(0,0);x.lineTo(Math.cos(a)*300,Math.sin(a)*300);x.stroke();}
    x.globalAlpha=1;x.lineWidth=4;x.beginPath();x.moveTo(0,-90);x.lineTo(24,0);x.lineTo(0,90);x.lineTo(-24,0);x.closePath();x.stroke();
  }
  return new THREE.CanvasTexture(c);
}
const circleGroup=new THREE.Group();
function circleMesh(kind){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:circleTexture(kind),transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide}));
  circleGroup.add(m);return m;
}
const cOuter=circleMesh('outer'),cInner=circleMesh('inner');
circleGroup.rotation.x=-0.18;scene.add(circleGroup);
let circleOp=0.3,circleScale=17;

/* ---------------- theme / environment application ---------------- */
function applyTheme(){
  const pal=THEMES[S.theme],c=new THREE.Color();
  if(pal){
    for(let i=0;i<MAXN;i++){c.setHex(pal[CI[i]]);const b=RB[i];COL[i*3]=c.r*b;COL[i*3+1]=c.g*b;COL[i*3+2]=c.b*b;}
    accent.setHex(pal[0]);
    colA.needsUpdate=true;colB.needsUpdate=true;
  }
  document.documentElement.style.setProperty('--accent','#'+accent.getHexString());
}
function updateRainbow(n,t){
  const c=new THREE.Color();
  for(let i=0;i<n;i++){c.setHSL((i*0.0007+t*0.08)%1,0.9,0.62);COL[i*3]=c.r;COL[i*3+1]=c.g;COL[i*3+2]=c.b;}
  colA.needsUpdate=true;colB.needsUpdate=true;
  accent.setHSL((t*0.08)%1,0.9,0.65);
}
function applyEnv(){
  const e=ENVS[S.env];scene.background.setHex(e.bg);scene.fog.color.setHex(e.bg);scene.fog.density=e.fog;starMat.color.setHex(e.star);
}
applyTheme();applyEnv();

/* ---------------- sword count / scale ---------------- */
function recalcScale(){S.swordScale=0.62*(1.5-0.25*Math.log10(Math.max(S.n,10)))*S.size;}
function setCount(n){
  const old=S.n;S.n=n;
  if(n>old){
    for(let i=old;i<n;i++){
      const th=Math.random()*TAU,ph=Math.acos(2*Math.random()-1),r=25+Math.random()*20;
      PX[i]=S.ax+Math.sin(ph)*Math.cos(th)*r;PY[i]=S.ay+Math.cos(ph)*r;PZ[i]=Math.sin(ph)*Math.sin(th)*r;
      VX[i]=VY[i]=VZ[i]=0;SC[i]=0;
    }
  }
  swordMesh.count=n;trailMesh.count=n;recalcScale();
  $('ncount').textContent=n;$('cntLabel').textContent=n.toLocaleString();
}
recalcScale();

/* ---------------- formation targets ---------------- */
function fOrbit(n,t,R0){
  const L=6,m=Math.ceil(n/L),jit=Math.min(7,0.4+n/1500);
  for(let i=0;i<n;i++){
    const layer=i%L,j=(i/L)|0,dir=(layer&1)?-1:1;
    const ang=(j/m)*TAU+t*(0.5+0.12*layer)*dir+layer;
    const r=R0+layer*1.4+(R1[i]-0.5)*jit;
    const lx=Math.cos(ang)*r,lz=Math.sin(ang)*r,ly=Math.sin(ang*3+t*1.5+layer)*0.7+(R3[i]-0.5)*jit*0.5;
    const tilt=layer*0.55+0.2,ct=Math.cos(tilt),st=Math.sin(tilt);
    TX[i]=S.ax+lx;TY[i]=S.ay+ly*ct-lz*st;TZ[i]=S.az+ly*st+lz*ct;
    const tx0=-Math.sin(ang)*dir,tz0=Math.cos(ang)*dir;
    FX[i]=tx0;FY[i]=-tz0*st;FZ[i]=tz0*ct;
  }
}
function fWings(n,t){
  const half=Math.ceil(n/2),rows=Math.max(2,Math.min(18,Math.round(Math.sqrt(half)/2.5))),cols=Math.ceil(half/rows);
  const flap=Math.sin(t*1.7)*0.07;
  for(let i=0;i<n;i++){
    const side=(i&1)?1:-1,k=i>>1,row=k%rows,col=(k/rows)|0;
    const th=0.05*Math.PI+(col/cols)*0.52*Math.PI+flap*(1+row*0.06);
    const d=3.5+row*(13/rows)+(R2[i]-0.5)*0.8;
    const c=Math.cos(th),s=Math.sin(th);
    TX[i]=S.ax+side*(2+d*c);TY[i]=S.ay-1+d*s;TZ[i]=S.az-2-R3[i]*1.5;
    FX[i]=side*c;FY[i]=s;FZ[i]=0;
  }
}
function fShield(n,t){
  const R=7+Math.sin(t*3)*0.25,shell=Math.min(2.2,n/2500),ga=2.399963;
  const ca=Math.cos(t*0.35),sa=Math.sin(t*0.35);
  for(let i=0;i<n;i++){
    const yy=1-2*(i+0.5)/n,rr=Math.sqrt(Math.max(0,1-yy*yy)),th=i*ga+t*0.9;
    let x=Math.cos(th)*rr,y=yy,z=Math.sin(th)*rr;
    const y2=y*ca-z*sa,z2=y*sa+z*ca;y=y2;z=z2;
    const r=R+R1[i]*shell;
    TX[i]=S.ax+x*r;TY[i]=S.ay+y*r;TZ[i]=S.az+z*r;
    FX[i]=x;FY[i]=y;FZ[i]=z;
  }
}
function fLaunch(n,t){
  const ox=S.ax*0.4,oy=-VISH*0.33,oz=8;
  const dx=S.ltx-ox,dy=S.lty-oy,dz=S.ltz-oz,dl=Math.hypot(dx,dy,dz)||1,nx=dx/dl,ny=dy/dl,nz=dz/dl;
  const spread=3+Math.min(4,n/2500),hold=0.28;
  for(let i=0;i<n;i++){
    const s=(t*0.85+R1[i])%1;
    let e=0;if(s>hold){e=(s-hold)/(1-hold);e=Math.pow(e,1.5);}
    const a=R3[i]*TAU+t*2,rad=R2[i]*spread*(1-e*0.85);
    TX[i]=ox+dx*e+Math.cos(a)*rad;TY[i]=oy+dy*e+Math.sin(a)*rad;TZ[i]=oz+dz*e+(R2[i]-0.5)*2;
    FX[i]=nx;FY[i]=ny;FZ[i]=nz;
    SCT[i]=s<0.06?s/0.06:(s>0.94?(1-s)/0.06:1);
  }
}
function fRain(n,t){
  const w=VISW*0.95,top=VISH*0.62;
  for(let i=0;i<n;i++){
    const s=(t*(0.22+0.3*R2[i])+R3[i])%1;
    TX[i]=S.ax*0.5+(R1[i]-0.5)*w;TY[i]=top-s*top*2.1;TZ[i]=-6+(R2[i]-0.5)*34;
    FX[i]=0.1;FY[i]=-1;FZ[i]=0;
    SCT[i]=s<0.04?s/0.04:(s>0.96?(1-s)/0.04:1);
  }
}
function fVortex(n,t,scale,spin,cx,cy,cz){
  const HH=24*scale;
  for(let i=0;i<n;i++){
    const h=(i*0.6180339887)%1,arm=i%5;
    const R=(2+11*Math.pow(h,1.25))*scale*(1+(R2[i]-0.5)*0.18);
    const ang=h*14+arm*TAU/5+t*spin+(R1[i]-0.5)*0.35;
    const c=Math.cos(ang),s=Math.sin(ang);
    TX[i]=cx+c*R;TY[i]=cy+(h-0.5)*HH+Math.sin(t*2+R1[i]*6)*0.4;TZ[i]=cz+s*R;
    FX[i]=-s;FY[i]=0.55;FZ[i]=c;
  }
}
function fGiant(n,t){
  const a=t*0.5,ca=Math.cos(a),sa=Math.sin(a),bob=Math.sin(t*1.4)*0.5,cy0=S.ay*0.4-1.5,cx0=S.ax*0.4;
  for(let i=0;i<n;i++){
    const p=(i*0.7548776662)%1;let x,y,z;
    if(p<0.74){const u=R1[i],w=2.2*(u<0.8?1:(1-(u-0.8)/0.2));y=-4+u*22;x=(R2[i]*2-1)*w;z=(R3[i]-0.5)*1.0;}
    else if(p<0.86){x=(R1[i]*2-1)*8.5;y=-5+(R2[i]-0.5)*1.6+Math.pow(Math.abs(x)/8.5,2)*1.5;z=(R3[i]-0.5)*2.2;}
    else if(p<0.95){x=(R2[i]-0.5)*1.4;y=-6-R1[i]*8;z=(R3[i]-0.5)*1.4;}
    else{x=(R2[i]-0.5)*3.2;y=-15+(R1[i]-0.5)*3;z=(R3[i]-0.5)*3.2;}
    TX[i]=cx0+x*ca+z*sa;TY[i]=cy0+y+bob;TZ[i]=-x*sa+z*ca;
    FX[i]=x*0.02;FY[i]=1;FZ[i]=z*0.1;
    SCT[i]=1+0.15*Math.sin(t*3+R1[i]*20);
  }
}
function computeTargets(n,t){
  SCT.fill(1,0,n);
  switch(S.form){
    case 0:fOrbit(n,t,5.5);break;
    case 1:fWings(n,t);break;
    case 2:fShield(n,t);break;
    case 3:fLaunch(n,t);break;
    case 4:{
      fOrbit(n,t,9.5);
      const sp=Math.hypot(VX[0],VY[0],VZ[0]);
      TX[0]=S.px;TY[0]=S.py;TZ[0]=S.pz;
      if(sp>4){FX[0]=VX[0]/sp;FY[0]=VY[0]/sp;FZ[0]=VZ[0]/sp;}else{FX[0]=0.25;FY[0]=1;FZ[0]=0;}
      break;}
    case 5:fRain(n,t);break;
    case 6:fVortex(n,t,1,1.6,S.ax,S.ay,S.az);break;
    case 7:
      if(S.ultT<2.2) fVortex(n,t,1+Math.min(1,S.ultT/2.2)*1.1,2.6,S.ax*0.5,S.ay*0.5,0);
      else fGiant(n,t);
      break;
  }
}

/* ---------------- matrix compose ---------------- */
function setM(a,o,px,py,pz,qx,qy,qz,qw,sx,sy,sz){
  const x2=qx+qx,y2=qy+qy,z2=qz+qz,xx=qx*x2,xy=qx*y2,xz=qx*z2,yy=qy*y2,yz=qy*z2,zz=qz*z2,wx=qw*x2,wy=qw*y2,wz=qw*z2;
  a[o]=(1-(yy+zz))*sx;a[o+1]=(xy+wz)*sx;a[o+2]=(xz-wy)*sx;a[o+3]=0;
  a[o+4]=(xy-wz)*sy;a[o+5]=(1-(xx+zz))*sy;a[o+6]=(yz+wx)*sy;a[o+7]=0;
  a[o+8]=(xz+wy)*sz;a[o+9]=(yz-wx)*sz;a[o+10]=(1-(xx+yy))*sz;a[o+11]=0;
  a[o+12]=px;a[o+13]=py;a[o+14]=pz;a[o+15]=1;
}

/* ---------------- simulation ---------------- */
function simulate(dt,t){
  const n=S.n,form=S.form;
  computeTargets(n,t);
  const kBase=form===7?(S.ultT>2.2?30:18):FORM_K[form];
  const d0=1.7*Math.sqrt(kBase),base=S.swordScale,fast=(form===3||form===5);
  const mA=swordMesh.instanceMatrix.array,mT=trailMesh.instanceMatrix.array;
  const trails=S.trails,aF=Math.min(1,dt*9),aS=Math.min(1,dt*6);
  for(let i=0;i<n;i++){
    let k=kBase*KV[i],dmp=d0*SQV[i];
    const lead=(form===4&&i===0);
    if(lead){k=130;dmp=1.7*Math.sqrt(130);}
    let vx=VX[i],vy=VY[i],vz=VZ[i];
    vx+=((TX[i]-PX[i])*k-vx*dmp)*dt;vy+=((TY[i]-PY[i])*k-vy*dmp)*dt;vz+=((TZ[i]-PZ[i])*k-vz*dmp)*dt;
    VX[i]=vx;VY[i]=vy;VZ[i]=vz;
    const px=PX[i]+=vx*dt,py=PY[i]+=vy*dt,pz=PZ[i]+=vz*dt;
    const sp=Math.sqrt(vx*vx+vy*vy+vz*vz);
    let fx=FX[i],fy=FY[i],fz=FZ[i];
    const fl=Math.sqrt(fx*fx+fy*fy+fz*fz)||1;fx/=fl;fy/=fl;fz/=fl;
    const w=Math.min(0.85,Math.max(0,(sp-6)/14));
    if(w>0){const inv=1/sp;fx=fx*(1-w)+vx*inv*w;fy=fy*(1-w)+vy*inv*w;fz=fz*(1-w)+vz*inv*w;}
    let dx=DX[i]+(fx-DX[i])*aF,dy=DY[i]+(fy-DY[i])*aF,dz=DZ[i]+(fz-DZ[i])*aF;
    const dl=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;dx/=dl;dy/=dl;dz/=dl;
    DX[i]=dx;DY[i]=dy;DZ[i]=dz;
    if(fast)SC[i]=SCT[i];else SC[i]+=(SCT[i]-SC[i])*aS;
    // orientation: rotate +Y onto d, then roll about local Y
    let qx=dz,qy=0,qz=-dx,qw=1+dy;
    if(qw<1e-5){qx=1;qy=0;qz=0;qw=0;}else{const ql=1/Math.sqrt(qx*qx+qz*qz+qw*qw);qx*=ql;qz*=ql;qw*=ql;}
    const ang=R3[i]*TAU,rs=Math.sin(ang*0.5),rc=Math.cos(ang*0.5);
    const rx=qx*rc-qz*rs,ry=qy*rc+qw*rs,rz=qz*rc+qx*rs,rw=qw*rc-qy*rs;
    let sc=base*SC[i];if(lead)sc*=2.4;
    setM(mA,i*16,px,py,pz,rx,ry,rz,rw,sc,sc,sc);
    if(trails){
      const tl=(sc*0.55+Math.min(9,sp*0.09)*(lead?1.8:1))*Math.min(1,SC[i]*1.5);
      const o=1.45*sc;
      setM(mT,i*16,px-dx*o,py-dy*o,pz-dz*o,rx,ry,rz,rw,sc*0.9,Math.max(0.001,tl),sc*0.9);
    }
  }
  swordMesh.instanceMatrix.needsUpdate=true;
  if(trails)trailMesh.instanceMatrix.needsUpdate=true;
}

/* ---------------- particles ---------------- */
function updateParticles(dt){
  const rs=[5.5,8,8,9,10,14,14,22][S.form];
  partRad+=(rs-partRad)*Math.min(1,dt*2);
  for(let i=0;i<PN;i++){
    PA[i]+=dt*PS[i]*(S.form===7?2.2:1);PYv[i]+=dt*PS[i]*0.12;if(PYv[i]>1)PYv[i]=-1;
    const r=PR[i]*partRad;
    partPos[i*3]=S.ax+Math.cos(PA[i])*r;partPos[i*3+1]=S.ay+PYv[i]*partRad*0.9;partPos[i*3+2]=S.az+Math.sin(PA[i])*r;
  }
  partGeo.attributes.position.needsUpdate=true;
}

/* ---------------- audio ---------------- */
let AC=null;
function audio(){
  if(!S.sound)return null;
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}
  if(AC.state==='suspended')AC.resume();return AC;
}
function tone(f0,f1,dur,gain,type,delay){
  const ac=audio();if(!ac)return;const t0=ac.currentTime+(delay||0);
  const o=ac.createOscillator(),g=ac.createGain();o.type=type||'sine';
  o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(gain,t0+Math.min(0.06,dur*0.3));g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g);g.connect(ac.destination);o.start(t0);o.stop(t0+dur+0.05);
}
function noise(dur,gain,f0,f1,delay){
  const ac=audio();if(!ac)return;const t0=ac.currentTime+(delay||0);
  const len=Math.floor(ac.sampleRate*dur),buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  const s=ac.createBufferSource();s.buffer=buf;
  const f=ac.createBiquadFilter();f.type='bandpass';f.Q.value=0.9;
  f.frequency.setValueAtTime(f0,t0);f.frequency.exponentialRampToValueAtTime(f1,t0+dur);
  const g=ac.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(gain,t0+dur*0.35);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  s.connect(f);f.connect(g);g.connect(ac.destination);s.start(t0);
}
function sfx(f){
  switch(f){
    case 0:tone(330,330,.6,.03,'sine');break;
    case 1:tone(440,880,.5,.07,'triangle');tone(660,1320,.6,.04,'sine',.1);break;
    case 2:tone(110,55,.7,.14,'sine');noise(.4,.08,800,200);break;
    case 3:noise(.5,.12,300,3000);tone(300,1200,.4,.04,'sawtooth');break;
    case 4:tone(880,1760,.25,.05,'sine');break;
    case 5:noise(1.2,.1,2000,6000);break;
    case 6:noise(1.2,.08,200,1500);tone(120,300,1.2,.05,'sawtooth');break;
    case 7:tone(55,110,2.2,.15,'sawtooth');noise(2,.12,150,4000);break;
  }
}

/* ---------------- UI wiring ---------------- */
let uiForm=-1;
function setStatus(txt,warn){const s=$('status');s.textContent=txt;s.classList.toggle('warn',!!warn);}
function updateFormUI(){
  const f=FORMS[S.form];$('gname').textContent=f.name+(S.manual!==null?'  (manual)':'');$('gzh').textContent=f.zh;
  document.querySelectorAll('.card').forEach(el=>el.classList.toggle('on',+el.dataset.form===S.form));
}
document.querySelectorAll('.card').forEach(el=>el.addEventListener('click',()=>{
  const f=+el.dataset.form;S.manual=(S.manual===f)?null:f;audio();
}));
addEventListener('keydown',e=>{
  if(e.target&&(e.target.tagName==='SELECT'||e.target.tagName==='INPUT'))return;
  if(e.key>='1'&&e.key<='8'){S.manual=+e.key-1;}
  else if(e.key==='0'||e.key==='Escape'){S.manual=null;}
});
addEventListener('pointermove',e=>{M.nx=e.clientX/innerWidth;M.ny=e.clientY/innerHeight;M.has=true;});

$('cnt').addEventListener('input',e=>{
  let n=Math.pow(10,+e.target.value);
  n=n>=1000?Math.round(n/50)*50:(n>=100?Math.round(n/10)*10:Math.round(n));
  setCount(Math.max(1,Math.min(MAXN,n)));
});
$('size').addEventListener('input',e=>{S.size=+e.target.value;$('sizeLabel').textContent=S.size.toFixed(2).replace(/0$/,'')+'×';recalcScale();});
$('theme').addEventListener('change',e=>{S.theme=e.target.value;applyTheme();});
$('env').addEventListener('change',e=>{S.env=e.target.value;applyEnv();});
$('mode').addEventListener('change',e=>{S.adv=e.target.value==='adv';});
$('optTrails').addEventListener('change',e=>{S.trails=e.target.checked;trailMesh.visible=S.trails;});
$('optBloom').addEventListener('change',e=>{S.bloom=e.target.checked&&!!composer;});
$('optCircle').addEventListener('change',e=>{S.circle=e.target.checked;});
$('optParticles').addEventListener('change',e=>{S.particles=e.target.checked;parts.visible=S.particles;});
$('optSound').addEventListener('change',e=>{S.sound=e.target.checked;});
$('optCam').addEventListener('change',e=>{$('cam').style.display=(e.target.checked&&S.camOn)?'block':'none';});
$('panelToggle').addEventListener('click',()=>$('panelBody').classList.toggle('hide'));
if(innerWidth<800)$('panelBody').classList.add('hide');

/* ---------------- hand tracking ---------------- */
const video=$('vid'),ov=$('ov'),octx=ov.getContext('2d');
const CONN=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
let hands=null,busy=false,tracking=false;

function analyse(lm,W,Hh){
  const P=lm.map(l=>({x:l.x*W,y:l.y*Hh}));
  const d=(a,b)=>Math.hypot(P[a].x-P[b].x,P[a].y-P[b].y);
  const palm=d(0,9)||1;
  const ext=[d(8,0)>d(5,0)*1.45,d(12,0)>d(9,0)*1.45,d(16,0)>d(13,0)*1.4,d(20,0)>d(17,0)*1.35];
  const count=ext.filter(Boolean).length;
  let g='unknown';
  if(S.adv&&d(4,8)<palm*0.3)g='pinch';
  else if(count>=3)g='open';
  else if(count===0)g='fist';
  else if(ext[0]&&!ext[1]&&!ext[2]&&!ext[3])g='point';
  else if(S.adv&&ext[0]&&ext[1]&&!ext[2]&&!ext[3])g='peace';
  let cx=0,cy=0;for(const i of [0,5,9,13,17]){cx+=lm[i].x;cy+=lm[i].y;}cx/=5;cy/=5;
  return{g,cx,cy,palmFrac:palm/Hh,tip:lm[8],pinch:{x:(lm[4].x+lm[8].x)/2,y:(lm[4].y+lm[8].y)/2}};
}
const wx=nx=>(0.5-nx)*VISW*0.9, wy=ny=>(0.5-ny)*VISH*0.9;
const GFORM={open:1,fist:2,point:3,pinch:4,peace:5,vortex:6,ult:7};

function onResults(res){
  const lms=res.multiHandLandmarks||[];
  drawPreview(lms);
  if(!lms.length){H.count=0;H.candN=0;return;}
  const W=video.videoWidth||640,Hh=video.videoHeight||480;
  const infos=lms.slice(0,2).map(lm=>analyse(lm,W,Hh));
  let raw,primary;
  if(infos.length===2&&infos[0].g==='open'&&infos[1].g==='open'){
    const sp=Math.hypot(infos[0].cx-infos[1].cx,(infos[0].cy-infos[1].cy)*(Hh/W));
    raw=(H.prevRaw==='ult'?sp>0.28:sp>0.36)?'ult':'vortex';
    primary={cx:(infos[0].cx+infos[1].cx)/2,cy:(infos[0].cy+infos[1].cy)/2,palmFrac:(infos[0].palmFrac+infos[1].palmFrac)/2,tip:infos[0].tip,pinch:infos[0].pinch};
  }else{
    primary=infos.find(i=>i.g!=='open'&&i.g!=='unknown')||infos[0];
    raw=primary.g;
  }
  H.prevRaw=raw;
  if(raw===H.cand)H.candN++;else{H.cand=raw;H.candN=1;}
  if(raw!=='unknown'&&H.candN>=3&&GFORM[raw]!==undefined)H.form=GFORM[raw];
  H.count=infos.length;H.lastT=performance.now()/1000;
  H.ax=wx(primary.cx);H.ay=wy(primary.cy);H.az=Math.max(-8,Math.min(12,(primary.palmFrac-0.2)*80));
  const k=(CAMD+25)/CAMD;
  H.ltx=wx(primary.tip.x)*k;H.lty=wy(primary.tip.y)*k;H.ltz=-25;
  H.px=wx(primary.pinch.x);H.py=wy(primary.pinch.y);H.pz=H.az;
}
function drawPreview(lms){
  const W=video.videoWidth||640,Hh=video.videoHeight||480;
  if(ov.width!==W){ov.width=W;ov.height=Hh;}
  octx.clearRect(0,0,W,Hh);
  octx.lineWidth=3;octx.strokeStyle='#' + accent.getHexString();octx.fillStyle='#fff';
  for(const lm of lms){
    octx.beginPath();
    for(const [a,b] of CONN){octx.moveTo(lm[a].x*W,lm[a].y*Hh);octx.lineTo(lm[b].x*W,lm[b].y*Hh);}
    octx.stroke();
    for(const p of lm){octx.beginPath();octx.arc(p.x*W,p.y*Hh,3.5,0,TAU);octx.fill();}
  }
}
async function trackLoop(){
  if(!tracking)return;
  if(video.readyState>=2&&!busy){
    busy=true;
    try{await hands.send({image:video});}catch(e){console.warn(e);}
    busy=false;
  }
  requestAnimationFrame(trackLoop);
}
function fallbackToMouse(msg){
  S.mouseMode=true;S.camOn=false;$('cam').style.display='none';
  setStatus(msg+' Mouse mode: move the mouse, press 1–8, or click a gesture card.',true);
}
async function startCamera(){
  if(typeof Hands==='undefined'){fallbackToMouse('Hand-tracking library did not load (offline?).');return;}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){fallbackToMouse('Camera access is unavailable on this page.');return;}
  setStatus('Requesting camera…');
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:'user'},audio:false});
    video.srcObject=stream;await video.play();
  }catch(e){fallbackToMouse('Camera unavailable ('+(e.name||'error')+').');return;}
  S.camOn=true;$('cam').style.display=$('optCam').checked?'block':'none';
  setStatus('Loading hand-tracking model…');
  try{
    hands=new Hands({locateFile:f=>'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/'+f});
    hands.setOptions({maxNumHands:2,modelComplexity:1,minDetectionConfidence:0.6,minTrackingConfidence:0.5});
    hands.onResults(onResults);
    await hands.initialize();
  }catch(e){console.warn(e);fallbackToMouse('Could not load the hand model.');return;}
  tracking=true;trackLoop();
  setStatus('Hand tracking ready — show me your hand.');
}
$('btnCam').addEventListener('click',()=>{$('intro').classList.add('hide');audio();startCamera();});
$('btnMouse').addEventListener('click',()=>{$('intro').classList.add('hide');audio();fallbackToMouse('');});

/* ---------------- main loop ---------------- */
let last=performance.now(),camR=CAMD,camAng=0,fpsS=60,fpsT=0,slowT=0,prevUlt=0;
function frame(nowMs){
  requestAnimationFrame(frame);
  const rawDt=Math.max(0.0001,(nowMs-last)/1000);last=nowMs;
  const dt=Math.min(0.033,rawDt),t=nowMs/1000;
  const kk=1-Math.exp(-dt*10);

  // inputs -> anchor / form
  const handOn=S.camOn&&H.count>0&&(t-H.lastT)<0.45;
  let tax=0,tay=0,taz=0,ltx=0,lty=4,ltz=-25,ptx=0,pty=0,ptz=0;
  if(handOn){tax=H.ax;tay=H.ay;taz=H.az;ltx=H.ltx;lty=H.lty;ltz=H.ltz;ptx=H.px;pty=H.py;ptz=H.pz;}
  else if(S.mouseMode&&M.has){
    tax=(M.nx-0.5)*VISW;tay=(0.5-M.ny)*VISH;
    const k=(CAMD+25)/CAMD;ltx=tax*k;lty=tay*k;ptx=tax;pty=tay;
  }
  S.ax+=(tax-S.ax)*kk;S.ay+=(tay-S.ay)*kk;S.az+=(taz-S.az)*kk;
  S.ltx+=(ltx-S.ltx)*kk;S.lty+=(lty-S.lty)*kk;S.ltz+=(ltz-S.ltz)*kk;
  S.px+=(ptx-S.px)*Math.min(1,dt*18);S.py+=(pty-S.py)*Math.min(1,dt*18);S.pz+=(ptz-S.pz)*kk;

  let want=S.manual!==null?S.manual:(handOn?H.form:0);
  if(want!==S.form){S.form=want;sfx(want);}
  if(uiForm!==S.form+(S.manual!==null?100:0)){uiForm=S.form+(S.manual!==null?100:0);updateFormUI();}

  if(S.form===7)S.ultT+=dt;else S.ultT=Math.max(0,S.ultT-dt*3);
  if(prevUlt<2.2&&S.ultT>=2.2){S.flash=1;tone(220,880,1.2,.1,'triangle');tone(110,110,1.5,.1,'sine');}
  prevUlt=S.ultT;
  S.flash=Math.max(0,S.flash-dt*1.6);

  if(S.theme==='rainbow')updateRainbow(S.n,t);

  simulate(dt,t);
  if(S.particles){updateParticles(dt);partMat.color.copy(accent);}

  // summoning circles
  const co=[0.3,0.9,0.7,0.5,0.4,0.35,0.6,1][S.form]*(S.circle?1:0);
  circleOp+=(co-circleOp)*Math.min(1,dt*3);
  const cs=[17,20,16,18,16,22,26,36][S.form];circleScale+=(cs-circleScale)*Math.min(1,dt*2);
  circleGroup.visible=circleOp>0.01;
  cOuter.material.opacity=circleOp;cInner.material.opacity=circleOp*0.9;
  cOuter.material.color.copy(accent);cInner.material.color.copy(accent);
  cOuter.scale.set(circleScale,circleScale,1);cInner.scale.set(circleScale*0.82,circleScale*0.82,1);
  cOuter.rotation.z=t*0.15;cInner.rotation.z=-t*0.25;
  circleGroup.position.set(S.ax*0.8,S.ay*0.8,-9);

  // cinematic camera
  let r=CAMD,ang=0,hy=2;
  if(S.form===7){r=S.ultT>2.2?50:46;ang=Math.sin(t*0.25)*0.55;hy=5;}
  else if(S.form===6){r=40;ang=Math.sin(t*0.3)*0.25;}
  const ck=1-Math.exp(-dt*1.5);camR+=(r-camR)*ck;camAng+=(ang-camAng)*ck;
  const sh=S.flash*0.5;
  camera.position.set(Math.sin(camAng)*camR+S.ax*0.05+(Math.random()-.5)*sh,hy+S.ay*0.04+(Math.random()-.5)*sh,Math.cos(camAng)*camR);
  camera.lookAt(0,0.5,0);
  stars.rotation.y=t*0.004;

  if(bloom){bloom.strength=0.8+S.flash*1.6;bloom.radius=0.55;}
  $('flash').style.opacity=(S.flash*0.35).toFixed(3);

  if(S.bloom&&composer)composer.render();else renderer.render(scene,camera);

  // fps / status
  fpsS+=(1/rawDt-fpsS)*0.05;fpsT+=rawDt;
  if(fpsT>0.5){
    fpsT=0;$('fps').textContent=Math.round(fpsS)+' fps';
    if(fpsS<28&&S.n>500){slowT+=0.5;if(slowT>=3&&!S.camOn||slowT>=3){if(!$('status').dataset.perf){$('status').dataset.perf=1;setStatus('Running slowly — try fewer swords or turn off Bloom glow in ⚙ settings.',true);}}}
    else slowT=Math.max(0,slowT-0.5);
    if(S.camOn&&tracking&&!handOn&&S.manual===null&&!$('status').dataset.perf)setStatus('Show your hand to the camera…');
    else if(handOn&&!$('status').dataset.perf)setStatus(H.count===2?'Two hands detected':'Hand detected');
  }
}
setCount(S.n);
updateFormUI();
requestAnimationFrame(frame);
})();
console.log('%cstackcraftio%c · Sword Sovereign','color:#7fd4ff;font-weight:bold','color:inherit');
