// js/three-scene.js
(() => {
  // Safety: only run in pages with the expected canvas
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  // Basics
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || 360, false);
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Camera
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / Math.max(canvas.clientHeight, 1), 0.1, 1000);
  camera.position.set(0, 1.6, 6);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const d = new THREE.DirectionalLight(0xffffff, 0.8);
  d.position.set(4, 6, 4);
  scene.add(d);

  // Particle field (soft, ambient depth)
  const particlesCount = 250;
  const positions = new Float32Array(particlesCount * 3);
  for (let i = 0; i < particlesCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ size: 0.08, transparent: true, opacity: 0.6 });
  const particlePoints = new THREE.Points(particleGeo, particleMat);
  scene.add(particlePoints);

  // Utility: a little canvas texture with text for labels (used for sprite markers)
  function createLabelTexture(text) {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, size, size);
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.fillText(text, size/2, size/2 + 12);
    const texture = new THREE.CanvasTexture(c);
    texture.needsUpdate = true;
    return texture;
  }

  // Create six navigation "cubes" (small floating panels)
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

  const boxGeo = new THREE.BoxGeometry(1.0, 0.6, 0.18);
  navItems.forEach((item, i) => {
    const hue = (i / navItems.length) * 360;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${hue} 80% 55%)`),
      metalness: 0.15,
      roughness: 0.5,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0.2
    });
    const mesh = new THREE.Mesh(boxGeo, mat);
    mesh.position.copy(item.pos);
    mesh.name = item.id; // store the section id
    mesh.userData = { id: item.id };
    mesh.scale.set(1,1,1);
    mesh.rotation.y = (Math.random() - 0.5) * 0.4;
    navGroup.add(mesh);

    // label as a sprite
    const spriteMat = new THREE.SpriteMaterial({ map: createLabelTexture(item.label), transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.6, 0.5, 1);
    sprite.position.set(item.pos.x, item.pos.y, item.pos.z + 0.15);
    scene.add(sprite);
  });

  // Raycaster for hover/click detection
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-2, -2);

  // Interaction state
  let hovered = null;
  let cameraTarget = new THREE.Vector3().copy(camera.position);
  let lookTarget = new THREE.Vector3(0, 0.6, 0);

  // Map of nice camera positions targeting each section (tweak if you like)
  const cameraPositions = {
    '#about': new THREE.Vector3(0, 1.7, 5.2),
    '#experience': new THREE.Vector3(-2.6, 1.8, 5),
    '#research': new THREE.Vector3(2.6, 2, 5.2),
    '#achievements': new THREE.Vector3(3.4, 1.1, 5),
    '#contact': new THREE.Vector3(0.2, 0.6, 4.2),
    '#CodingProjects': new THREE.Vector3(0.0, 2.6, 6.0)
  };

  // Resize handling
  function resizeRenderer() {
    const parent = canvas.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resizeRenderer, { passive: true });

  // Mouse move -> parallax & raycaster coords
  const wrapRect = canvas.parentElement.getBoundingClientRect();
  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ( (e.clientX - rect.left) / rect.width ) * 2 - 1;
    const y = - ( (e.clientY - rect.top) / rect.height ) * 2 + 1;
    mouse.x = x; mouse.y = y;
  }
  window.addEventListener('pointermove', onPointerMove);

  // Click / tap handler
  function onPointerDown(e) {
    // cast
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(navGroup.children, true);
    if (hits.length > 0) {
      const top = hits[0].object;
      const sectionId = top.userData?.id || top.name;
      if (sectionId) {
        navigateToSection(sectionId);
      }
    }
  }
  window.addEventListener('pointerdown', onPointerDown);

  // make page nav links communicate with scene (prevent default scroll and use Three camera movement + HTML scroll)
  document.querySelectorAll('nav a, .cta a.btn').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('#')) {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        navigateToSection(href);
      });
    }
  });

  // navigation action: move 3D camera and scroll real HTML
  function navigateToSection(sectionId) {
    // set camera target position (lerped)
    if (cameraPositions[sectionId]) {
      cameraTarget.copy(cameraPositions[sectionId]);
      // set a look target that points roughly to center of navGroup for nice framing
      lookTarget.set(0, 0.8, 0);
    }
    // smooth scroll to the page element if exists
    const el = document.querySelector(sectionId);
    if (el) {
      // keep native scroll for accessibility but smooth
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Animation loop
  let t = 0;
  function animate() {
    t += 0.01;
    // subtle particle drift
    particlePoints.rotation.y = t * 0.02;

    // update hover via raycaster
    ray.setFromCamera(mouse, camera);
    const intersects = ray.intersectObjects(navGroup.children, true);
    if (intersects.length > 0) {
      const top = intersects[0].object;
      if (hovered !== top) {
        if (hovered) { hovered.material.emissive && (hovered.material.emissive.setHex(0x000000)); hovered.scale.set(1,1,1); }
        hovered = top;
        hovered.material.emissive && hovered.material.emissive.setHex(0x222222);
        hovered.scale.set(1.06, 1.06, 1.06);
        canvas.classList.add('clickable');
      }
    } else {
      if (hovered) { hovered.material.emissive && hovered.material.emissive.setHex(0x000000); hovered.scale.set(1,1,1); hovered = null; }
      canvas.classList.remove('clickable');
    }

    // parallax effect: camera slightly follows pointer
    const parallaxX = mouse.x * 0.6;
    const parallaxY = mouse.y * 0.6;
    const desiredCam = new THREE.Vector3().copy(cameraTarget).add(new THREE.Vector3(parallaxX, parallaxY * 0.6, 0));
    camera.position.lerp(desiredCam, 0.06);

    // make camera look smoothly at lookTarget
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    camera.lookAt(lookTarget.x + (mouse.x * 0.2), lookTarget.y + (mouse.y * 0.2), lookTarget.z);

    // gentle drone rotation of the nav group
    navGroup.rotation.y += 0.0012;
    navGroup.position.y = Math.sin(t * 0.5) * 0.06;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // start positions (calm default)
  cameraTarget.copy(camera.position);
  animate();

  // ensure renderer sizes correctly when page loads and on CSS-driven changes
  setTimeout(resizeRenderer, 300);
  window.addEventListener('load', resizeRenderer);

  // Expose a debug function in case you want to jump directly from the console:
  window.__threeNav = { navigateToSection };

})();
