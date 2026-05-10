import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Box, 
  ShoppingCart, 
  ShieldCheck, 
  Clock, 
  Plus, 
  Minus, 
  RotateCcw, 
  RefreshCw,
  Fish,
  Anchor,
  Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';
import styles from './Hotspot3DPage.module.css';

// Mock Data
const MOCK_HOTSPOTS = [
  {
    id: 1,
    position: [-2, 1, 0],
    title: 'Tur Nelayan Lombok',
    price: 'Rp 275.000',
    icon: <Navigation className="w-5 h-5 text-sky-500" />
  },
  {
    id: 2,
    position: [2, 0.5, -1],
    title: 'Snorkeling Bunaken',
    price: 'Rp 350.000',
    icon: <Fish className="w-5 h-5 text-teal-500" />
  },
  {
    id: 3,
    position: [-1, -1.5, 1],
    title: 'Gili Trawangan Dive Pack',
    price: 'Rp 1.200.000',
    icon: <Anchor className="w-5 h-5 text-orange-500" />
  }
];

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
function OceanScene({ selectedId, onSelect }: { selectedId: number | undefined, onSelect: (data: any) => void }) {
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
      {MOCK_HOTSPOTS.map((spot) => (
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
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedHotspot, setSelectedHotspot] = useState(MOCK_HOTSPOTS[2]); // Default selection
  const [isBundled, setIsBundled] = useState(false);

  const handleDetailClick = () => {
    navigate('/product');
  };

  const handleCartClick = () => {
    if (isAuthenticated) {
      navigate('/cart');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Box className={styles.logoIcon} size={24} />
          <span>DIVEXPLORE-3D</span>
        </div>
        <nav className={styles.navLinks}>
          <span className={styles.navLink} style={{color: 'white', fontWeight: 600}}>Destinasi</span>
          <span className={styles.navLink} onClick={() => navigate('/catalog')}>Katalog</span>
          <span className={styles.navLink}>Tentang</span>
        </nav>
        <div className={styles.userSection}>
          {isAuthenticated && user ? (
            <>
              <div className={styles.userInfo}>
                <img src={user.avatar} alt="User" className={styles.avatar} />
                <span>{user.name}</span>
              </div>
              <button className={styles.logoutBtn} onClick={logout}>Keluar</button>
            </>
          ) : (
            <button className={styles.btnOutline} style={{padding: '8px 16px', fontSize: '13px'}} onClick={() => navigate('/login')}>Masuk</button>
          )}
        </div>
      </header>

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span>Beranda</span>
        <span>&gt;</span>
        <span>Destinasi</span>
        <span>&gt;</span>
        <span>Raja Ampat</span>
        <span>&gt;</span>
        <span className="active">Scene 3D</span>
      </div>

      {/* Main Content Area */}
      <main className={styles.mainArea}>
        {/* 3D Canvas Column */}
        <div className={styles.canvasContainer}>
          <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
            <OceanScene selectedId={selectedHotspot?.id} onSelect={setSelectedHotspot} />
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
            {/* Using placeholder image for diving */}
            <img 
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Diving" 
              className={styles.productImage}
            />
            
            <div className={styles.tag}>DIVING</div>
            
            <h3 className={styles.productName}>{selectedHotspot?.title.toUpperCase() || 'GILI TRAWANGAN SNORKELING'}</h3>
            
            <p className={styles.productDesc}>
              Paket menyelam lengkap di perairan Raja Ampat, termasuk instruktur bersertifikat dan perlengkapan selam.
            </p>
            
            <div className={styles.priceRow}>
              <div className={styles.price}>
                {selectedHotspot?.price || 'Rp 1.200.000'}<span>/orang</span>
              </div>
              <div className={styles.availability}>
                <ShieldCheck size={16} />
                8 slot tersedia
              </div>
            </div>
            
            <div className={styles.bundleBox}>
              <div className={styles.bundleInfo}>
                <div className={styles.bundleIcon}>
                  <Box size={24} />
                </div>
                <div className={styles.bundleText}>
                  <span className={styles.bundleTitle}>Bundling + Hotel Bintang 3</span>
                  <span className={styles.bundlePrice}>+ Tambah Rp 500.000</span>
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
            
            <div className={styles.actions}>
              <button className={styles.btnOutline} onClick={handleDetailClick}>Lihat Detail</button>
              <button className={styles.btnPrimary} onClick={handleCartClick}>
                <ShoppingCart size={18} />
                Tambah ke Keranjang
              </button>
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
