import { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { api } from '../../utils/api';
import { OrbitControls, Html, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Box, 
  ShieldCheck, 
  Clock, 
  Plus, 
  Minus, 
  RotateCcw, 
  RefreshCw,
  Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Hotspot3DPage.module.css';
import Header from '../../components/common/Header';



// Reusable Hotspot Component
function HotspotMarker({ data, onClick, isSelected }: { data: any, onClick: (data: any) => void, isSelected: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Simple floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = data.position[1] + Math.sin(state.clock.elapsedTime * 2 + data.id) * 0.1;
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

      {/* HTML Label */}
      <Html position={[0.3, 0.2, 0]} center zIndexRange={[100, 0]}>
        <div 
          className={styles.hotspotLabel} 
          onClick={(e) => { e.stopPropagation(); onClick(data); }}
          style={{ border: isSelected ? '2px solid #f97316' : 'none' }}
        >
          <div className={styles.hotspotIcon}>
            {data.icon}
          </div>
          <div className={styles.hotspotInfo}>
            <span className={styles.hotspotTitle}>{data.title}</span>
            <span className={styles.hotspotPrice}>{data.price} <span style={{fontSize: '10px', color: '#94a3b8', fontWeight: 'normal'}}>/orang</span></span>
          </div>
        </div>
      </Html>
    </group>
  );
}

// The 3D Scene Wrapper
function OceanScene({ hotspots, selectedId, onSelect }: { hotspots: any[], selectedId: any, onSelect: (data: any) => void }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Particles/Bubbles */}
      <Sparkles count={100} scale={10} size={4} speed={0.4} opacity={0.2} color="#0ea5e9" />
      
      {/* Background elements to give depth */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[0, -5, -5]}>
          <cylinderGeometry args={[5, 5, 2, 32]} />
          <meshStandardMaterial color="#0b1e36" transparent opacity={0.8} />
        </mesh>
      </Float>

      {/* Hotspots */}
      {hotspots.map((spot: any) => (
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
        minDistance={2}
        maxDistance={10}
      />
    </>
  );
}

export default function Hotspot3DPage() {
  const navigate = useNavigate();
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null); 
  const [isBundled, setIsBundled] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/api/products');
        const products = res.data?.products || [];
        
        const spots = products.map((p: any, i: number) => {
          let pos = [Math.sin(i) * 2.5, Math.cos(i) * 1.5, Math.sin(i * 2) * 2];
          if (p.hotspots && p.hotspots.length > 0) {
            try {
               const coords = JSON.parse(p.hotspots[0].coordinates_json);
               pos = [coords.x || pos[0], coords.y || pos[1], coords.z || pos[2]];
            } catch(e){}
          }
          
          return {
            id: p.id,
            position: pos,
            title: p.nama_produk,
            price: `Rp ${Number(p.harga).toLocaleString('id-ID')}`,
            desc: p.deskripsi || p.vendor?.nama_toko || 'Produk wisata terbaik dari vendor lokal.',
            image: p.thumbnail_url || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            icon: <Navigation className="w-5 h-5 text-sky-500" />,
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

  const handleDetailClick = () => {
    if (selectedHotspot?.id) {
      navigate('/product/' + selectedHotspot.id);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <Header />

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span>Beranda</span>
        <span>&gt;</span>
        <span>Destinasi</span>
        <span>&gt;</span>
        <span>Lombok</span>
        <span>&gt;</span>
        <span className="active">Scene 3D</span>
      </div>

      {/* Main Content Area */}
      <main className={styles.mainArea}>
        {/* 3D Canvas Column */}
        <div className={styles.canvasContainer}>
          <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
            <OceanScene hotspots={hotspots} selectedId={selectedHotspot?.id} onSelect={setSelectedHotspot} />
          </Canvas>
          
          {/* Controls Overlay */}
          <div className={styles.controlsOverlay}>
            <button className={styles.controlBtn} title="Zoom In"><Plus size={20} /></button>
            <button className={styles.controlBtn} title="Zoom Out"><Minus size={20} /></button>
            <button className={styles.controlBtn} title="Reset View"><RotateCcw size={20} /></button>
            <button className={styles.controlBtn} title="Refresh"><RefreshCw size={20} /></button>
          </div>
          
          {/* Bottom Badge */}
          <div className={styles.locationBadge}>
            Gili Trawangan
          </div>
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
              <div className={styles.price}>
                {selectedHotspot?.price}<span>/orang</span>
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
              Refund 24 jam
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
