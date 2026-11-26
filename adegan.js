import * as THREE from 'three';

const diam = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Kartu miring mengikuti kursor (jalan juga tanpa WebGL)
if (!diam && matchMedia('(hover: hover)').matches) {
  for (const k of document.querySelectorAll('.kartu')) {
    k.addEventListener('pointermove', (e) => {
      const r = k.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      k.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-2px)`;
    });
    k.addEventListener('pointerleave', () => { k.style.transform = ''; });
  }
}

const kanvas = document.getElementById('adegan');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: kanvas, antialias: true });
} catch {
  kanvas.remove(); // tanpa WebGL halaman tetap utuh, hanya tanpa latar 3D
}
if (renderer) mulai();

function mulai() {
  const LATAR = 0x0c0a09, AKSEN = 0x4ade80, JARAK = 14;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(LATAR);

  const adegan = new THREE.Scene();
  adegan.fog = new THREE.Fog(LATAR, 8, 26);
  const kamera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
  kamera.position.z = 8;

  // Bintang
  const jumlah = innerWidth < 700 ? 500 : 1400;
  const titik = new Float32Array(jumlah * 3);
  for (let i = 0; i < jumlah; i++) {
    titik[i * 3] = (Math.random() - 0.5) * 40;
    titik[i * 3 + 1] = 8 - Math.random() * 34;
    titik[i * 3 + 2] = 2 - Math.random() * 22;
  }
  const geoBintang = new THREE.BufferGeometry();
  geoBintang.setAttribute('position', new THREE.BufferAttribute(titik, 3));
  const bintang = new THREE.Points(geoBintang, new THREE.PointsMaterial({ color: 0xd6d3d1, size: 0.06, transparent: true, opacity: 0.8 }));
  adegan.add(bintang);

  // Panel melayang berisi tangkapan layar proyek
  const panel = new THREE.Group();
  adegan.add(panel);
  const muat = new THREE.TextureLoader();
  const letak = [[0, 0, 0], [-1.9, 1.1, -1.6], [1.9, 1.0, -1.9], [-1.7, -1.2, -1.2], [1.8, -1.25, -1.5]];
  ['kateringkita', 'sekolahku', 'kuliahkita', 'todo', 'hermes'].forEach((nama, i) => {
    const tekstur = muat.load(`img/${nama}.webp`, () => { if (diam) gambarkan(0); });
    tekstur.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: tekstur }));
    const bingkai = new THREE.Mesh(new THREE.PlaneGeometry(2.46, 1.56), new THREE.MeshBasicMaterial({ color: 0x44403c }));
    bingkai.position.z = -0.01;
    m.add(bingkai);
    m.position.set(...letak[i]);
    m.userData = { y: letak[i][1], fase: i * 1.3 };
    panel.add(m);
  });

  // Bola kawat di ujung bawah halaman
  const bola = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.2, 2)),
    new THREE.LineBasicMaterial({ color: AKSEN, transparent: true, opacity: 0.35 })
  );
  adegan.add(bola);

  let dasarY = 0, mx = 0, my = 0;
  function ukur() {
    const w = innerWidth, h = innerHeight, lebar = w / h >= 1.1;
    renderer.setSize(w, h, false);
    kamera.aspect = w / h;
    kamera.updateProjectionMatrix();
    panel.position.x = lebar ? 2.6 : 0;
    panel.scale.setScalar(lebar ? 0.8 : 0.5);
    dasarY = lebar ? 0 : -1.7;
    bola.position.set(lebar ? 3.2 : 0, -JARAK, -2);
    if (diam) gambarkan(0);
  }

  function gambarkan(ms) {
    const t = ms / 1000;
    const maks = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    kamera.position.y = -(scrollY / maks) * JARAK;
    panel.position.y = dasarY + Math.min(1, scrollY / innerHeight) * 5;
    panel.rotation.y += (mx * 0.25 - panel.rotation.y) * 0.05;
    panel.rotation.x += (my * 0.15 - panel.rotation.x) * 0.05;
    for (const m of panel.children) m.position.y = m.userData.y + Math.sin(t + m.userData.fase) * 0.08;
    bintang.rotation.y = t * 0.01;
    bola.rotation.set(t * 0.1, t * 0.15, 0);
    renderer.render(adegan, kamera);
  }

  let id;
  function putar(ms) { gambarkan(ms); id = requestAnimationFrame(putar); }

  addEventListener('resize', ukur);
  ukur();
  if (diam) {
    addEventListener('scroll', () => gambarkan(0), { passive: true });
    gambarkan(0);
  } else {
    addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(id);
      if (!document.hidden) id = requestAnimationFrame(putar);
    });
    id = requestAnimationFrame(putar);
  }
}
