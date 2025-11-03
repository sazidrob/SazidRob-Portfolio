// js/three-scene.js
(() => {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  // Renderer / scene / camera
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  renderer.setSize(canvas.clientWidth || canvas.parentElement.clientWidth || window.innerWidth, canvas.clientHeight || 360, false);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x000000, 0); // transparent

  const camera = new THREE.PerspectiveCamera(50, (canvas.clientWidth || 800) / Math.max((canvas.clientHeight || 360), 1), 0.1, 1000);
  camera.position.set(0, 1.6, 6);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(4, 6, 4);
  scene.add(dir);

  // Particles
  const PARTICLE_COUNT = 240;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ size: 0.08, transparent: true, opacity: 0.65 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // small helper to create label textures
  function createLabelTexture(text) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.clearRect(0,0,size,size);
    // subtle translucent background to increase legibility
    ctx.fillStyle = 'rgba(0,0,0,0.0)';
    ctx.fillRect(0,0,size,size);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, size/2, size/2 + 12);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  // NAV items: positions tuned for aesthetic balance
  const navItems = [
    { id: '#about', label: 'About', pos: new THREE.Vector3(-3, 0.8, -2) },
    { id: '#experience', label: 'Experience', pos: new THREE.Vector3(-1, 1.1, -2.8) },
    { id: '#research', label: 'Research', pos: new THREE.Vector3(1.2, 1.2, -3) },
    { id: '#achievements', label: 'Achievements', pos: new THREE.Vector3(3, 0.9, -2.2) },
    { id: '#contact', label: 'Contact', pos: new THREE.Vector3(0.2, -0.6, -1.9) },
    { id: '#CodingProjects', label: 'Projects', pos: new THREE.Vector3(0.2, 2.2, -4) }
  ];

  const navGroup = new THREE.Group();
  scene.add(navGroup);

  const boxGeo = new THREE.BoxGeometry(1.0, 0.62, 0.18);

  navItems.forEach((item, i) => {
    const hue = (i / navItems.length) * 360;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${hue} 75% 55%)`),
      metalness: 0.12, roughness: 0.5, emissive: new THREE.Color(0x000000)
    });
    const mesh = new THREE.Mesh(boxGeo, mat);
    mesh.position.copy(item.pos);
    mesh.userData = { id: item.id };
    mesh.rotation.y = (Math.random() - 0.5) * 0.4;
    navGroup.add(mesh);

    // label sprite
    const spriteMat = new THREE.SpriteMaterial({ map: createLabelTexture(item.label), transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.6, 0.5, 1);
    sprite.position.set(item.pos.x, item.pos.y, item.pos.z + 0.15);
    scene.add(sprite);
  });

  // Raycaster + pointer tracking
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-2, -2);
  let hovered = null;

  function updatePointerFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouse.x = x; mouse.y = y;
  }
  window.addEventListener('pointermove', (e) => updatePointerFromEvent(e), { passive: true });
  window.addEventListener('pointerdown', () => {
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(navGroup.children, true);
    if (hits.length > 0) {
      const sec = hits[0].object.userData?.id || hits[0].object.name;
      if (sec) navigateToSection(sec);
    }
  }, { passive: true });

  // camera positions used when navigating to sections
  const cameraPositions = {
    '#about': new THREE.Vector3(0, 1.7, 5.2),
    '#experience': new THREE.Vector3(-2.6, 1.8, 5),
    '#research': new THREE.Vector3(2.6, 2, 5.2),
    '#achievements': new THREE.Vector3(3.4, 1.1, 5),
    '#contact': new THREE.Vector3(0.2, 0.6, 4.2),
    '#CodingProjects': new THREE.Vector3(0.0, 2.6, 6.0)
  };

  // resizing
  function resize() {
    const parent = canvas.parentElement || document.body;
    const w = Math.max(200, parent.clientWidth);
    const h = Math.max(120, parent.clientHeight);
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(DPR);
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  // navigation function — moves camera and scrolls HTML
  let cameraTarget = camera.position.clone();
  let lookTarget = new THREE.Vector3(0, 0.8, 0);
  function navigateToSection(sectionId) {
    if (cameraPositions[sectionId]) cameraTarget.copy(cameraPositions[sectionId]);
    // scroll the real HTML for accessibility / SEO
    const el = document.querySelector(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  window.__threeNav = { navigateToSection };

  // animation loop
  let t = 0;
  function animate() {
    t += 0.01;
    // particles drift
    particles.rotation.y = t * 0.02;

    // hover detection
    ray.setFromCamera(mouse, camera);
    const intersects = ray.intersectObjects(navGroup.children, true);
    if (intersects.length > 0) {
      const top = intersects[0].object;
      if (hovered !== top) {
        if (hovered) {
          hovered.material.emissive && hovered.material.emissive.setHex(0x000000);
          hovered.scale.set(1,1,1);
        }
        hovered = top;
        hovered.material.emissive && hovered.material.emissive.setHex(0x222222);
        hovered.scale.set(1.05,1.05,1.05);
        canvas.classList.add('clickable');
      }
    } else {
      if (hovered) { hovered.material.emissive && hovered.material.emissive.setHex(0x000000); hovered.scale.set(1,1,1); hovered = null; }
      canvas.classList.remove('clickable');
    }

    // parallax effect based on pointer
    const parX = mouse.x * 0.6;
    const parY = mouse.y * 0.6;
    const desired = new THREE.Vector3().copy(cameraTarget).add(new THREE.Vector3(parX, parY * 0.6, 0));
    camera.position.lerp(desired, 0.06);

    camera.lookAt(lookTarget.x + (mouse.x * 0.25), lookTarget.y + (mouse.y * 0.25), lookTarget.z);

    // gentle motion
    navGroup.rotation.y += 0.0012;
    navGroup.position.y = Math.sin(t * 0.5) * 0.06;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // initial warm-up
  setTimeout(resize, 120);
  animate();
})();
