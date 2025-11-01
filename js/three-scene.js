const canvas=document.getElementById('threeCanvas');if(canvas){const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
r.setPixelRatio(window.devicePixelRatio);const s=new THREE.Scene();const c=new THREE.PerspectiveCamera(45,1,0.1,100);
c.position.set(0,0,6);const l=new THREE.DirectionalLight(0xffffff,1);l.position.set(5,5,5);
s.add(l);s.add(new THREE.AmbientLight(0xffffff,0.3));
const g=new THREE.IcosahedronGeometry(1.5,2);const m=new THREE.MeshStandardMaterial({color:0x7c5cff,metalness:0.5,roughness:0.3});
const mesh=new THREE.Mesh(g,m);s.add(mesh);
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;r.setSize(w,h,false);c.aspect=w/h;c.updateProjectionMatrix();}
let t=0;function anim(){resize();t+=0.01;mesh.rotation.y+=0.008;mesh.rotation.x=Math.sin(t*0.3)*0.15;r.render(s,c);requestAnimationFrame(anim);}anim();}
