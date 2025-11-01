// three-scene.js - minimal, theme-aware Three.js scene
(function(){
  const canvas = document.getElementById('threeCanvas');
  if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0,0,6);

  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(5,5,5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const geom = new THREE.IcosahedronGeometry(1.6, 2);
  const mat = new THREE.MeshStandardMaterial({metalness:0.4,roughness:0.2,envMapIntensity:0.6});
  const mesh = new THREE.Mesh(geom, mat);
  scene.add(mesh);

  const pointsGeo = new THREE.BufferGeometry();
  const count = 220;
  const positions = new Float32Array(count*3);
  for(let i=0;i<count;i++){
    positions[i*3+0] = (Math.random()-0.5)*12;
    positions[i*3+1] = (Math.random()-0.5)*6;
    positions[i*3+2] = (Math.random()-0.5)*6;
  }
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  const pointsMat = new THREE.PointsMaterial({size:0.06,opacity:0.8,transparent:true});
  const points = new THREE.Points(pointsGeo, pointsMat);
  scene.add(points);

  function resize(){
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if(canvas.width !== w || canvas.height !== h){
      renderer.setSize(w,h,false);
      camera.aspect = w/h; camera.updateProjectionMatrix();
    }
  }

  let t = 0;
  function animate(){
    resize();
    t += 0.01;
    mesh.rotation.y += 0.008;
    mesh.rotation.x = Math.sin(t*0.3)*0.15;
    mesh.rotation.z = Math.cos(t*0.2)*0.1;
    points.rotation.y = -t*0.02;
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }
  animate();

  function applyTheme(name){
    if(name === 'light'){
      mat.color.set('#2b2b6b');
      mat.emissive.set('#e9ecff');
      renderer.setClearColor(0xf6f8fb, 0);
      pointsMat.color = new THREE.Color('#4f46e5');
    } else {
      mat.color.set('#8ea7ff');
      mat.emissive.set('#0b1220');
      renderer.setClearColor(0x0f1724, 0);
      pointsMat.color = new THREE.Color('#7c5cff');
    }
    mat.needsUpdate = true; pointsMat.needsUpdate = true;
  }
  applyTheme(localStorage.getItem('theme') || 'dark');

  window.app = {onThemeChange: applyTheme};

  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden) renderer.setAnimationLoop(null);
    else requestAnimationFrame(animate);
  });
})();
