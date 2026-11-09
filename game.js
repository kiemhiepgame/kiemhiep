import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import {EffectComposer} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/postprocessing/ShaderPass.js';
import {FXAAShader} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/shaders/FXAAShader.js';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x071525);
scene.fog=new THREE.FogExp2(0x071525,0.018);

const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,500);
camera.position.set(0,5,10);

const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.shadowMap.enabled=false; // môi trường dùng baked/lightmap khi thay asset thật
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
document.body.appendChild(renderer.domElement);

// Post-processing: Bloom + ACES tone mapping (renderer) + FXAA
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),1.15,.55,.7);
composer.addPass(bloom);
const fxaa=new ShaderPass(FXAAShader);
fxaa.material.uniforms.resolution.value.set(1/(innerWidth*renderer.getPixelRatio()),1/(innerHeight*renderer.getPixelRatio()));
composer.addPass(fxaa);

// Chỉ dùng ambient + directional như ánh sáng demo. Khi production: thay bằng Lightmap trong GLB.
scene.add(new THREE.HemisphereLight(0x8ab6ff,0x17220f,1.6));
const sun=new THREE.DirectionalLight(0xffe0ad,1.6); sun.position.set(-10,18,8); scene.add(sun);

// Mặt đất
const groundMat=new THREE.MeshStandardMaterial({color:0x183126,roughness:.96,metalness:0});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),groundMat);
ground.rotation.x=-Math.PI/2; scene.add(ground);

// Núi low-poly
function mountain(x,z,s){
 const g=new THREE.ConeGeometry(s*.9,s*2.2,7,2);
 const m=new THREE.MeshStandardMaterial({color:0x182a2c,roughness:1,flatShading:true});
 const o=new THREE.Mesh(g,m); o.position.set(x,s*.7,z); scene.add(o);
}
for(let i=0;i<35;i++){const a=Math.random()*Math.PI*2,r=28+Math.random()*45; mountain(Math.cos(a)*r,Math.sin(a)*r,3+Math.random()*8);}

// Shader nước UV scrolling
const waterGeo=new THREE.PlaneGeometry(60,60,1,1);
const waterMat=new THREE.ShaderMaterial({
 transparent:true,
 uniforms:{time:{value:0}},
 vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform float time; varying vec2 vUv;
 void main(){float w=sin((vUv.x+time*.025)*38.)*.04+sin((vUv.y-time*.018)*27.)*.04;
 vec3 c=mix(vec3(.02,.12,.17),vec3(.05,.32,.38),vUv.y+w);
 gl_FragColor=vec4(c,.82);}`
});
const water=new THREE.Mesh(waterGeo,waterMat); water.rotation.x=-Math.PI/2; water.position.y=.03; water.position.z=-24; scene.add(water);

// Nhân vật procedural, placeholder dưới ngân sách poly
const player=new THREE.Group();
const cloth=new THREE.MeshStandardMaterial({color:0x243a5c,roughness:.75});
const skin=new THREE.MeshStandardMaterial({color:0xc68f6d,roughness:.85});
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,1.35,5,8),cloth); body.position.y=1.35; player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.38,12,8),skin); head.position.y=2.38; player.add(head);
const sword=new THREE.Group();
const blade=new THREE.Mesh(new THREE.BoxGeometry(.07,1.8,.14),new THREE.MeshStandardMaterial({color:0xa8c7d4,metalness:.9,roughness:.22}));
blade.position.y=.8; sword.add(blade);
const guard=new THREE.Mesh(new THREE.BoxGeometry(.55,.08,.1),new THREE.MeshStandardMaterial({color:0xb89235,metalness:.8,roughness:.3})); sword.add(guard);
sword.position.set(.65,1.15,0); sword.rotation.z=-.35; player.add(sword);
scene.add(player);

// Particle billboards 2D
const particles=[];
function spark(pos,color=0x6ad9ff,count=20){
 const texMat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
 for(let i=0;i<count;i++){
  const p=new THREE.Mesh(new THREE.PlaneGeometry(.08+Math.random()*.15,.08+Math.random()*.15),texMat.clone());
  p.position.copy(pos); p.userData={v:new THREE.Vector3((Math.random()-.5)*5,Math.random()*2,(Math.random()-.5)*5),life:.45+Math.random()*.5,max:1};
  scene.add(p); particles.push(p);
 }
}
const keys={}; addEventListener('keydown',e=>keys[e.code]=true); addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('mousedown',()=>{spark(player.position.clone().add(new THREE.Vector3(0,1.4,-1)),0x9bdcff,32); sword.rotation.z=-1.6;});
addEventListener('keydown',e=>{if(e.code==='KeyQ'){spark(player.position.clone().add(new THREE.Vector3(0,1.2,-1)),0x70b8ff,55); document.querySelector('#mana').textContent=Math.max(0,+document.querySelector('#mana').textContent-15);}});

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.target.set(0,1.2,0); controls.maxDistance=13; controls.minDistance=5;
let last=performance.now();
function loop(now){
 const dt=Math.min(.033,(now-last)/1000); last=now;
 let speed=(keys.ShiftLeft?7:4)*dt,dx=0,dz=0;
 if(keys.KeyW)dz-=speed;if(keys.KeyS)dz+=speed;if(keys.KeyA)dx-=speed;if(keys.KeyD)dx+=speed;
 if(dx||dz){const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();
 const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
 player.position.addScaledVector(forward,-dz);player.position.addScaledVector(right,dx);
 player.rotation.y=Math.atan2(-dx,-dz); sword.rotation.z=THREE.MathUtils.lerp(sword.rotation.z,-.35,.08);
 }
 if(keys.Space) player.position.y=Math.min(1.1,player.position.y+speed*1.7); else player.position.y=Math.max(0,player.position.y-speed*2.4);
 waterMat.uniforms.time.value+=dt;
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.position.addScaledVector(p.userData.v,dt);p.userData.v.y-=5*dt;p.userData.life-=dt;p.material.opacity=Math.max(0,p.userData.life/p.userData.max);p.lookAt(camera.position);if(p.userData.life<=0){scene.remove(p);particles.splice(i,1);}}
 controls.target.lerp(player.position.clone().add(new THREE.Vector3(0,1.2,0)),.08);
 controls.update(); composer.render(); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);fxaa.material.uniforms.resolution.value.set(1/(innerWidth*renderer.getPixelRatio()),1/(innerHeight*renderer.getPixelRatio()));});
