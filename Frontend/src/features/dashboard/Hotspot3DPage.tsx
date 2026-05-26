import { useState, useRef, useEffect, useLayoutEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { api } from '../../utils/api';
import { OrbitControls, Html, Sparkles, useGLTF, Center, Environment, ContactShadows, MeshTransmissionMaterial, SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import {
  Box,
  ShieldCheck,
  Clock,
  Ship,
  Camera,
  Utensils,
  Waves,
  Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Hotspot3DPage.module.css';
import Header from '../../components/common/Header';



// Reusable Hotspot Component
export interface HotspotData {
  id: string | number;
  position: [number, number, number];
  title: string;
  price: string;
  rawPrice: number;
  desc: string;
  image: string;
  icon: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addons?: any[];
  location?: string;
  category?: string;
}

function HotspotMarker({ data, onClick, isSelected }: { data: HotspotData, onClick: (data: HotspotData) => void, isSelected: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  // Simple floating animation (Gunakan angka tetap agar tidak NaN)
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = data.position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });

  return (
    <group position={data.position} ref={meshRef}>
      {/* 3D Visual Marker */}
      <mesh onClick={() => onClick(data)}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshBasicMaterial color={isSelected ? "#f97316" : "#0ea5e9"} />
        <pointLight color={isSelected ? "#f97316" : "#0ea5e9"} intensity={2} distance={2} />
      </mesh>

      {/* Outer Ring */}
      <mesh>
        <ringGeometry args={[0.2, 0.22, 32]} />
        <meshBasicMaterial color={isSelected ? "#f97316" : "#0ea5e9"} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* HTML Label - Menggunakan Spatial Anchoring (Transform & Sprite) */}
      <Html
        position={[0, 0.8, 0]}
        center
        transform
        sprite
        distanceFactor={12}
        zIndexRange={[100, 0]}
      >
        <div
          className={`${styles.hotspotLabel} ${isSelected ? styles.hotspotSelected : ""}`}
          onClick={(e) => { e.stopPropagation(); onClick(data); }}
        >
          <div className={styles.hotspotInfo}>
            <div className={styles.hotspotHeader}>
              {data.icon}
              <span className={styles.hotspotTitle}>{data.title}</span>
            </div>
            {isSelected && (
              <span className={styles.hotspotPrice}>
                {data.price}
                <span className={styles.hotspotUnit}>/orang</span>
              </span>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}

// Komponen 3D Model Ocean v5 (dengan Animasi & Material Custom)
function OceanModel() {
  const { scene: originalScene } = useGLTF('/ocean_v5.glb');
  const scene = useMemo(() => originalScene.clone(), [originalScene]);

  // Referensi untuk menyimpan objek agar bisa dianimasikan
  const ikanRefs = useRef<THREE.Object3D[]>([]);
  const diverRefs = useRef<THREE.Object3D[]>([]);

  useLayoutEffect(() => {
    ikanRefs.current = [];
    diverRefs.current = [];

    // Menggunakan skala asli karena script Auto-Scale sebelumnya membuat model menjadi raksasa
    scene.scale.setScalar(1);

    scene.traverse((obj) => {
      const name = obj.name.toLowerCase().trim();

      // --- TANGKAP OBJEK PENYELAM ---
      if (
        name === 'sketchfab_model002' ||
        name === 'sketchfab_model003' ||
        name === 'sketchfab_model004'
      ) {
        if (obj.userData.initialY === undefined) {
          obj.userData.initialY = obj.position.y;
          obj.userData.initialRotX = obj.rotation.x;
        }
        diverRefs.current.push(obj);
      }

      // --- LOGIKA PEWARNAAN MATERIAL ---
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const meshName = mesh.name.toLowerCase().trim();
        const material = mesh.material as THREE.MeshStandardMaterial;

        if (material) {
          if (meshName.includes('ikan') || meshName.includes('fish') || meshName === 'ikan_ungu') {
            material.color = new THREE.Color('#9CA3AF'); // Abu-abu ikan
            material.roughness = 0.4;
            material.metalness = 0.6;
            if (material.emissive) material.emissive.setHex(0x000000);
            ikanRefs.current.push(obj);
          } else if (meshName.includes('karang') || meshName.includes('coral')) {
            material.color = new THREE.Color('#CD5C5C'); // Merah karang
            material.roughness = 0.9;
            material.metalness = 0.1;
          } else if (meshName.includes('plant') || meshName.includes('rumput')) {
            material.color = new THREE.Color('#2E8B57'); // Hijau laut
          } else if (meshName.includes('terrain') || meshName.includes('ground') || meshName.includes('plane') || meshName.includes('sand') || meshName.includes('dataran') || meshName.includes('pasir')) {
            material.color = new THREE.Color('#E2D0A5'); // Warna pasir
          } else {
            // Ubah magenta error jadi pasir (hanya jika bukan bagian dari penyelam)
            if (
              !meshName.includes('object_') &&
              material.color && material.color.r > 0.8 && material.color.b > 0.8 && material.color.g < 0.2
            ) {
              material.color = new THREE.Color('#E2D0A5');
              if (material.emissive) material.emissive.setHex(0x000000);
            }
          }
          material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Animasi putaran ikan
    ikanRefs.current.forEach((ikan) => {
      ikan.rotation.y -= 0.001;
    });

    // Animasi mengambang untuk penyelam (Buoyancy)
    diverRefs.current.forEach((diver, i) => {
      diver.position.y = diver.userData.initialY + Math.sin(t * 1.5 + i) * 0.4;
      diver.rotation.x = diver.userData.initialRotX + Math.cos(t * 1.0 + i) * 0.1;
    });
  });

  return (
    <Center position={[0, -1.5, -4]}>
      <primitive object={scene} />
    </Center>
  );
}

// Komponen Gelembung Air (Procedural)
const INITIAL_BUBBLES = Array.from({ length: 150 }).map(() => ({
  x: (Math.random() - 0.5) * 60,
  y: (Math.random() - 0.5) * 30,
  z: (Math.random() - 0.5) * 60,
  scale: Math.random() * 0.15 + 0.05,
  speed: Math.random() * 0.03 + 0.01,
}));

function GelembungAir() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((bubble, i) => {
        bubble.position.y += INITIAL_BUBBLES[i].speed
        if (bubble.position.y > 20) bubble.position.y = -5
      })
    }
  })

  return (
    <group ref={groupRef}>
      {INITIAL_BUBBLES.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]} scale={b.scale}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={0} />
        </mesh>
      ))}
    </group>
  )
}

// Lakukan preload agar model di-download di background secepat mungkin
useGLTF.preload('/ocean_v5.glb');

// The 3D Scene Wrapper
function OceanScene({ hotspots, selectedId, onSelect }: { hotspots: HotspotData[], selectedId: string | number | undefined, onSelect: (data: HotspotData) => void }) {
  return (
    <>
      {/* Latar Belakang & Kabut Laut Dalam Pekat */}
      <color attach="background" args={['#031021']} />
      <fog attach="fog" args={['#031021', 15, 75]} />

      {/* Pencahayaan Bawah Laut Dramatis */}
      <ambientLight intensity={0.4} color="#2b5b84" />
      <directionalLight position={[10, 30, 10]} intensity={1.5} color="#88ccff" />

      {/* Efek Cahaya Matahari Menyudut (God Rays) */}
      <SpotLight
        distance={150}
        angle={0.6}
        penumbra={0.8}
        attenuation={2}
        anglePower={5}
        intensity={150}
        color="#aaffee"
        position={[20, 100, 20]}
        volumetric={true}
        opacity={0.6}
      />

      {/* Efek Marine Snow / Plankton Besar & Terang */}
      <Sparkles
        count={3000}
        scale={[120, 80, 120]}
        size={8}
        speed={0.3}
        opacity={0.8}
        color="#aaddff"
      />

      {/* Permukaan Air (Langit-langit Laut) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 100, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <MeshTransmissionMaterial
          color="#1a4d5c"
          transmission={0.9}
          opacity={0.5}
          transparent={true}
          roughness={0.2}
          ior={1.33}
          thickness={5}
        />
      </mesh>

      {/* Efek Gelembung Udara Buatan */}
      <GelembungAir />

      <Environment preset="night" />
      <ContactShadows opacity={0.8} scale={50} blur={3} far={10} color="#000000" />

      {/* 3D Model Ocean_v5 */}
      <Suspense fallback={
        <Html center>
          <div style={{ color: 'white', background: 'rgba(0,0,0,0.7)', padding: '12px 20px', borderRadius: '8px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
            Memuat Model 3D...
          </div>
        </Html>
      }>
        <OceanModel />
      </Suspense>

      {/* Hotspots */}
      {hotspots.map((spot: HotspotData) => (
        <HotspotMarker
          key={spot.id}
          data={spot}
          onClick={onSelect}
          isSelected={selectedId === spot.id}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={100}
      />
    </>
  );
}

export default function Hotspot3DPage() {
  const navigate = useNavigate();
  const [hotspots, setHotspots] = useState<HotspotData[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(null);
  const [isBundled, setIsBundled] = useState(false);

  const handleSelectHotspot = (data: HotspotData) => {
    setSelectedHotspot(data);
    setIsBundled(false);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/api/products');
        const products = res.data?.products || [];

        // Batasi hanya 3 produk utama
        const mainProducts = products.slice(0, 3);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spots = mainProducts.map((p: any, i: number) => {
          // KOORDINAT TETAP (FIXED) - Dijamin tidak akan lari ke pojok
          let pos: [number, number, number] = [0, 0, 0];

          if (i === 0) {
            // Sharing Boat (Kiri - Dekat Penyelam / Karang)
            pos = [-9, -1, 1];
          } else if (i === 1) {
            // Discovery Scuba (Kiri Atas - Area Air Jernih Bebas Ikan)
            pos = [-4, 4, -5];
          } else if (i === 2) {
            // Drone (Kanan - Area Air Jernih Kanan)
            pos = [8, 2, 0];
          }

          const nameL = p.nama_produk.toLowerCase();
          let IconComp = Compass;

          if (nameL.includes('dive') || nameL.includes('scuba') || nameL.includes('snorkel')) {
            IconComp = Waves;
          } else if (nameL.includes('boat') || nameL.includes('hopping')) {
            IconComp = Ship;
          } else if (nameL.includes('foto') || nameL.includes('drone')) {
            IconComp = Camera;
          } else if (nameL.includes('makan') || nameL.includes('kuliner') || nameL.includes('seafood')) {
            IconComp = Utensils;
          }

          return {
            id: p.id,
            position: pos,
            title: p.nama_produk,
            price: `Rp ${Number(p.harga).toLocaleString('id-ID')}`,
            rawPrice: Number(p.harga),
            desc: p.deskripsi || p.vendor?.nama_toko || 'Produk wisata terbaik dari vendor lokal.',
            image: p.thumbnail_url || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            icon: <IconComp size={16} className={styles.hotspotIcon} />,
            addons: p.crossSellingAsMain || [],
            location: p.lokasi || 'Lombok',
            category: p.vendor?.kategori || 'AKTIVITAS BAHARI'
          };
        });

        setHotspots(spots);
        if (spots.length > 0) setSelectedHotspot(spots[0]);
      } catch (err) {
        console.error("Gagal load data produk 3D:", err);
      }
    };
    fetchProducts();
  }, []);



  const getTotalPrice = () => {
    if (!selectedHotspot) return 'Rp 0';
    let total = selectedHotspot.rawPrice || 0;
    if (isBundled && selectedHotspot.addons && selectedHotspot.addons.length > 0) {
      total += Number(selectedHotspot.addons[0].addonProduct.harga);
    }
    return `Rp ${total.toLocaleString('id-ID')}`;
  };

  const handleDetailClick = () => {
    if (selectedHotspot?.id) {
      let destUrl = `/product/${selectedHotspot.id}`;
      // If bundle active, pass selected addon product ID via query params
      if (isBundled && selectedHotspot.addons && selectedHotspot.addons.length > 0) {
        destUrl += `?addonId=${selectedHotspot.addons[0].addonProduct.id}`;
      }
      navigate(destUrl);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <Header />

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span onClick={() => navigate('/')}>Beranda</span>
        <span>&gt;</span>
        <span className={styles.active}>Scene 3D</span>
      </div>

      {/* Main Content Area */}
      <main className={styles.mainArea}>
        {/* 3D Canvas Column */}
        <div className={styles.canvasContainer}>
          <Canvas camera={{ position: [0, 2, 15], fov: 50 }}>
            <OceanScene hotspots={hotspots} selectedId={selectedHotspot?.id} onSelect={handleSelectHotspot} />
          </Canvas>


        </div>

        {/* Product Detail Sidebar */}
        <aside className={styles.sidePanel}>
          <h2 className={styles.panelTitle}>Detail Produk</h2>

          <div className={styles.productCard}>
            <img
              src={selectedHotspot?.image}
              alt={selectedHotspot?.title}
              className={styles.productImage}
            />

            <div className={styles.tag}>{selectedHotspot?.category?.toUpperCase()}</div>

            <h3 className={styles.productName}>{selectedHotspot?.title.toUpperCase()}</h3>

            <p className={styles.productDesc}>
              {selectedHotspot?.desc}
            </p>

            <div className={styles.priceRow}>
              <div className={styles.price} style={isBundled ? { color: '#10b981', textShadow: '0 0 10px rgba(16,185,129,0.2)', transform: 'scale(1.05)', transformOrigin: 'left center', transition: 'all 0.3s' } : { transition: 'all 0.3s' }}>
                {getTotalPrice()}<span>/orang</span>
              </div>
              <div className={styles.availability}>
                <ShieldCheck size={16} />
                Tersedia
              </div>
            </div>

            {selectedHotspot?.addons && selectedHotspot.addons.length > 0 ? (
              <div className={styles.bundleBox}>
                <div className={styles.bundleInfo}>
                  <div className={styles.bundleIcon}>
                    <Box size={24} />
                  </div>
                  <div className={styles.bundleText}>
                    <span className={styles.bundleTitle}>{selectedHotspot.addons[0].addonProduct.nama_produk}</span>
                    <span className={styles.bundlePrice}>+ Rp {Number(selectedHotspot.addons[0].addonProduct.harga).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={isBundled}
                    onChange={() => setIsBundled(!isBundled)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            ) : (
              <div className={styles.bundleBox} style={{ opacity: 0.5 }}>
                <div className={styles.bundleInfo}>
                  <div className={styles.bundleText}>
                    <span className={styles.bundleTitle}>Tidak ada tambahan opsional</span>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button className={styles.btnPrimary} onClick={handleDetailClick}>Lihat Detail</button>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className={styles.footer}>
            <div className={styles.footerItem}>
              <ShieldCheck size={14} color="#0ea5e9" />
              Pembayaran Aman
            </div>
            <div className={styles.footerItem}>
              <Clock size={14} color="#0ea5e9" />
              Refund 3-5 Hari Kerja
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
