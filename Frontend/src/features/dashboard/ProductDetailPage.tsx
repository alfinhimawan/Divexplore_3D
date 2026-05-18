import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthContext";
import { api } from "../../utils/api";
import {
  Clock,
  Users,
  Award,
  MapPin,
  Star,
  ShoppingCart,
  Zap,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Package,
  Minus,
  Plus,
  ArrowRight,
  Calendar,
  AlertCircle,
  XCircle,
  Scale,
  History,
  X,
  CreditCard,
  CloudRain,
  Building,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./ProductDetailPage.module.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import Swal from "sweetalert2";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<
    "deskripsi" | "lokasi" | "ulasan" | "kebijakan" | "syarat"
  >("deskripsi");
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const [activeAddonTab, setActiveAddonTab] = useState<string>("");
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  // Dapatkan tanggal hari ini sesuai zona waktu lokal (WIB/WITA/WIT), bukan UTC
  const todayString = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // Inisialisasi state tanggal dari URL atau SessionStorage (Bulletproof)
  const queryParams = new URLSearchParams(window.location.search);
  const initialDate =
    queryParams.get("date") ||
    sessionStorage.getItem("divexplore_filter_date") ||
    "";

  const [bookingDate, setBookingDate] = useState<string>(initialDate);
  const [checkInDate, setCheckInDate] = useState<string>(initialDate);

  const getInitialCheckOut = () => {
    if (!initialDate) return "";
    const nextDay = new Date(initialDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().split("T")[0];
  };
  const [checkOutDate, setCheckOutDate] =
    useState<string>(getInitialCheckOut());

  const PRODUCT_IMAGES = [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80",
    "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1600&q=80",
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1600&q=80",
    "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1600&q=80",
  ];

  const [activeImage, setActiveImage] = useState(PRODUCT_IMAGES[0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (id) {
          const res = await api.get(`/api/products/${id}`);
          const p = res.data?.product;
          
          // Filter out Homestay/Akomodasi from addons (Must stand alone)
          if (p?.crossSellingAsMain) {
            p.crossSellingAsMain = p.crossSellingAsMain.filter((item: any) => {
              const cat = item.addonProduct?.vendor?.kategori?.toLowerCase() || "";
              return !cat.includes("homestay") && !cat.includes("akomodasi");
            });
          }

          setProduct(p);
          if (p?.thumbnail_url) {
            setActiveImage(p.thumbnail_url);
          }
          // Set default addon tab to first category
          if (p?.crossSellingAsMain?.length > 0) {
            const firstCat = p.crossSellingAsMain[0].addonProduct.vendor?.kategori || "lainnya";
            setActiveAddonTab(firstCat);
          }

          // Check URL query for pre-selected addon from 3D Preview Flow
          const preSelectAddonId = queryParams.get("addonId");
          if (preSelectAddonId) {
            setSelectedAddons([preSelectAddonId]);
            setAddonQuantities({ [preSelectAddonId]: 1 });
            // Auto-activate the category tab that contains this addon
            const matchingAddon = p?.crossSellingAsMain?.find((a: any) => String(a.addonProduct.id) === String(preSelectAddonId));
            if (matchingAddon) {
              setActiveAddonTab(matchingAddon.addonProduct.vendor?.kategori || "lainnya");
            }
          }
        }

        const relRes = await api.get("/api/products");
        const allProds = relRes.data?.products || [];
        const filteredProds = allProds.filter((p: any) => p.id !== id);
        const shuffledProds = filteredProds.sort(() => 0.5 - Math.random());
        setRelatedProducts(shuffledProds.slice(0, 5));
      } catch (err) {
        console.error("Gagal load detail:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // MapLibre Initialization with Dynamic Theming
  useEffect(() => {
    if (
      activeTab === "lokasi" &&
      mapContainer.current &&
      !map.current &&
      product
    ) {
      // 1. Deteksi Tema Berdasarkan Kategori
      const category = (
        product.vendor?.kategori ||
        product.kategori_produk ||
        ""
      ).toLowerCase();
      const name = (product.nama_produk || "").toLowerCase();

      const isDiving =
        category.includes("diving") ||
        category.includes("bahari") ||
        name.includes("dive") ||
        name.includes("snorkel");
      const isStay =
        category.includes("homestay") ||
        category.includes("hotel") ||
        category.includes("villa");
      const isFood =
        category.includes("kuliner") ||
        name.includes("makan") ||
        name.includes("resto");

      let theme = {
        sky: "#0ea5e9",
        horizon: "#fde68a",
        fog: "#2e3b4e",
        accent: "#0ea5e9",
        exaggeration: 1.5,
        label: "ADVENTURE SPOT",
      };

      if (isDiving) {
        theme = {
          sky: "#083344",
          horizon: "#0ea5e9",
          fog: "#075985",
          accent: "#38bdf8",
          exaggeration: 2.5,
          label: "MARINE & DIVE SPOT",
        };
      } else if (isStay) {
        theme = {
          sky: "#f97316",
          horizon: "#451a03",
          fog: "#271201",
          accent: "#f97316",
          exaggeration: 1.2,
          label: "PREMIUM STAY",
        };
      } else if (isFood) {
        theme = {
          sky: "#fbbf24",
          horizon: "#78350f",
          fog: "#451a03",
          accent: "#f59e0b",
          exaggeration: 1.0,
          label: "CULINARY SPOT",
        };
      }

      // 2. Smart Product-Aware Location & Dynamic Copywriting
      const getSmartMapping = (p: any) => {
        const vendorName = (p.vendor?.nama_toko || "").toLowerCase();
        const category = (
          p.vendor?.kategori ||
          p.kategori_produk ||
          ""
        ).toLowerCase();
        const prodName = (p.nama_produk || "").toLowerCase();
        const lokasi = p.lokasi || p.vendor?.alamat_lengkap || "Lombok";

        const landmarks = {
          GILI_T_JETTY: { lat: -8.3542, lng: 116.0442 },
          GILI_T_STREET: { lat: -8.3505, lng: 116.0435 },
          GILI_T_INLAND: { lat: -8.3485, lng: 116.0412 },
          SENGGIGI_JETTY: { lat: -8.5025, lng: 116.0402 },
          SENGGIGI_HUB: { lat: -8.4855, lng: 116.0475 },
          SENGGIGI_ROAD: { lat: -8.4952, lng: 116.0545 },
        };

        let base = landmarks.SENGGIGI_HUB;
        let desc = "Lokasi Terverifikasi, titik kumpul utama petualangan Anda.";

        if (
          category.includes("homestay") ||
          vendorName.includes("ocean view")
        ) {
          base = landmarks.GILI_T_INLAND;
          desc = `Akomodasi premium dengan suasana tenang dan akses cepat ke pesisir ${lokasi}.`;
        } else if (
          category.includes("diving") ||
          prodName.includes("dive") ||
          prodName.includes("hopp")
        ) {
          base = vendorName.includes("gili")
            ? landmarks.GILI_T_JETTY
            : landmarks.SENGGIGI_JETTY;
          desc = `Dermaga keberangkatan utama untuk memulai petualangan bawah laut Anda di ${lokasi}.`;
        } else if (
          category.includes("kuliner") ||
          vendorName.includes("marwah") ||
          vendorName.includes("sukardi")
        ) {
          base = vendorName.includes("marwah")
            ? landmarks.GILI_T_STREET
            : landmarks.SENGGIGI_ROAD;
          desc = `Nikmati hidangan autentik dengan bahan segar harian di lokasi strategis ${lokasi}.`;
        }

        const seed = p.id ? p.id.charCodeAt(0) : Math.random();
        const jitterLat = ((seed % 8) - 4) * 0.0003;
        const jitterLng = (((seed * 3) % 8) - 4) * 0.0003;

        return {
          lat: base.lat + jitterLat,
          lng: base.lng + jitterLng,
          description: desc,
        };
      };

      const mapping = getSmartMapping(product);
      const lat = mapping.lat;
      const lng = mapping.lng;

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            satellite: {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              attribution: "Tiles \u0026copy; Esri",
              maxzoom: 18,
            },
            labels: {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
            },
            terrainSource: {
              type: "raster-dem",
              url: "https://demotiles.maplibre.org/terrain-tiles/tiles.json",
              tileSize: 256,
            },
          },
          layers: [
            { id: "satellite-layer", type: "raster", source: "satellite" },
            { id: "labels-layer", type: "raster", source: "labels" },
          ],
          terrain: {
            source: "terrainSource",
            exaggeration: theme.exaggeration,
          },
        },
        center: [lng, lat],
        zoom: 16,
        maxZoom: 18,
        minZoom: 2,
        pitch: 65,
        bearing: -15,
      });

      map.current.on("style.load", () => {
        map.current?.setSky({
          "sky-color": theme.sky,
          "sky-horizon-blend": 0.5,
          "horizon-color": theme.horizon,
          "horizon-fog-blend": 0.8,
          "fog-color": theme.fog,
          "fog-ground-blend": 0.6,
        });
      });

      map.current.addControl(new maplibregl.NavigationControl(), "top-right");

      const popup = new maplibregl.Popup({
        offset: 35,
        closeButton: false,
        anchor: "bottom",
        className: "luxury-popup",
        maxWidth: "300px",
      }).setHTML(`
        <div style="background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(12px); color: white; border-radius: 16px; border: 1px solid ${theme.accent}44; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.4); font-family: sans-serif;">
          <img src="${product.thumbnail_url || "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=400\u0026q=80"}" style="width: 100%; height: 120px; object-fit: cover; border-bottom: 1px solid ${theme.accent}22;" />
          <div style="padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="background: ${theme.accent}22; color: ${theme.accent}; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${theme.label}</span>
              <div style="display: flex; gap: 2px;">
                ${[1, 2, 3, 4, 5].map(() => `<span style="color: #fbbf24; font-size: 10px;">\u2605</span>`).join("")}
              </div>
            </div>
            <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: white;">${product.nama_produk}</h3>
            <p style="margin: 6px 0 16px; font-size: 12px; color: #94a3b8; line-height: 1.5;">${mapping.description}</p>
            <a href="https://www.google.com/maps/dir/?api=1\u0026destination=${lat},${lng}" target="_blank" style="display: block; width: 100%; background: linear-gradient(135deg, ${theme.accent}, ${theme.sky}); color: white; text-align: center; padding: 10px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; transition: transform 0.2s;">
              Dapatkan Petunjuk Arah
            </a>
          </div>
        </div>
      `);

      new maplibregl.Marker({ color: theme.accent, scale: 1.2 })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current);

      popup.addTo(map.current);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [activeTab, product]);

  // Pricing logic
  const basePrice = product ? Number(product.harga) : 0;

  // Review logic
  const reviewCount = product?.reviews?.length || 0;
  const averageRating =
    reviewCount > 0
      ? product.reviews.reduce(
          (acc: number, rev: any) => acc + (rev.rating || 5),
          0,
        ) / reviewCount
      : 0;

  const calculateNights = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const calculateTotal = () => {
    const nights = isAkomodasi ? calculateNights(checkInDate, checkOutDate) : 1;
    let total = basePrice * quantity * nights;

    if (product?.crossSellingAsMain) {
      product.crossSellingAsMain.forEach((addonObj: any) => {
        const addon = addonObj.addonProduct;
        if (selectedAddons.includes(addon.id)) {
          const addonQty = addonQuantities[addon.id] || 1;
          total += Number(addon.harga) * addonQty;
        }
      });
    }

    return total;
  };

  const getSelectedAddonsData = () => {
    const res: any[] = [];
    if (product?.crossSellingAsMain) {
      product.crossSellingAsMain.forEach((addonObj: any) => {
        if (selectedAddons.includes(addonObj.addonProduct.id)) {
          res.push({
            id: addonObj.id,
            addon_product_id: addonObj.addonProduct.id,
            name: addonObj.addonProduct.nama_produk,
            price: Number(addonObj.addonProduct.harga),
            qty: addonQuantities[addonObj.addonProduct.id] || 1,
            vendor: addonObj.addonProduct.vendor,
          });
        }
      });
    }
    return res;
  };

  const getDynamicFeatures = () => {
    if (!product) {
      return {
        durasi: "-",
        kapasitas: "-",
        level: "-",
        included: [],
        excluded: [],
        policy: "",
        terms: []
      };
    }
    const category = product?.vendor?.kategori?.toLowerCase() || "";
    const name = product?.nama_produk?.toLowerCase() || "";

    const kapasitasDb = product.kapasitas
      ? `${product.kapasitas} ${category === "homestay" ? "Kamar" : "Pax"}`
      : null;

    // 1. SPECIFIC PRODUCT OVERRIDES (HIGH PRECISION)
    if (name.includes("sharing boat")) {
      return {
        durasi: "5-6 Jam",
        kapasitas: kapasitasDb || "Sharing Group",
        level: "Umur 5-60 Tahun",
        included: [
          "Glass Bottom Boat (Sharing Trip ekonomis)",
          "Alat snorkeling lengkap (Masker & Fin)",
          "Life Jacket (Jaket Pelampung keselamatan)",
          "Pemandu snorkeling lokal berpengalaman",
          "Spot Patung Bawah Air (Bask Nest Meno)",
          "Spot Penyu (Turtle Point Gili Air)"
        ],
        excluded: [
          "Dokumentasi Foto/Video GoPro",
          "Makan siang selama tur",
          "Pengeluaran pribadi & Tips pemandu",
          "Antar-jemput dari hotel ke dermaga"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan minimal 24 jam sebelum berangkat. Proses refund memakan waktu 3-5 hari kerja.",
        terms: [
          "Peserta diharapkan berkumpul 15 menit sebelum jadwal keberangkatan.",
          "Membawa baju ganti, handuk, dan tabir surya ramah lingkungan.",
          "Wajib mengikuti arahan pemandu demi keselamatan bersama.",
          "Dilarang keras menyentuh atau merusak ekosistem terumbu karang."
        ]
      };
    } 
    
    if (name.includes("private boat")) {
      return {
        durasi: "4-5 Jam",
        kapasitas: kapasitasDb || "Private 1-8 Orang",
        level: "Semua Umur",
        included: [
          "Private Glass Bottom Boat (Eksklusif 1 grup)",
          "Waktu keberangkatan bebas fleksibel",
          "Alat snorkeling premium untuk semua peserta",
          "Jaket pelampung ukuran anak & dewasa",
          "Pemandu pribadi khusus grup Anda",
          "Air mineral botol dingin di kapal"
        ],
        excluded: [
          "Dokumentasi foto udara/GoPro",
          "Menu makan siang di Gili Meno/Air",
          "Tips sukarela untuk kru kapal"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan minimal 24 jam sebelum keberangkatan. Proses refund memakan waktu 3-5 hari kerja.",
        terms: [
          "Jadwal penjemputan disepakati saat konfirmasi.",
          "Rute rincian spot snorkeling bisa disesuaikan (fleksibel).",
          "Harap menjaga kebersihan kapal dari sampah plastik."
        ]
      };
    }

    if (name.includes("discovery scuba")) {
      return {
        durasi: "2-3 Jam",
        kapasitas: kapasitasDb || "Pribadi/Pasangan",
        level: "Pemula (Tanpa Lisensi)",
        included: [
          "1x Penyelaman di laut terbuka (kedalaman maks 12m)",
          "Briefing teori dasar menyelam dari instruktur",
          "Instruktur PADI/SSI tersertifikasi mendampingi erat",
          "Full Set Equipment (Tank, BCD, Regulator, Masker, Fin)",
          "Asuransi keselamatan penyelaman standar"
        ],
        excluded: [
          "Sertifikasi menyelam resmi PADI (Hanya program ujicoba)",
          "Dokumentasi foto & video underwater Pro",
          "Makan & Minuman setelah menyelam"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan minimal 24 jam sebelum kegiatan. Proses refund 3-5 hari kerja. Pembatalan mendadak hangus.",
        terms: [
          "Peserta wajib mengisi kuesioner medis kesehatan sebelum menyelam.",
          "Tidak diperbolehkan terbang dengan pesawat minimal 18 jam setelah menyelam.",
          "Batas usia minimal peserta adalah 10 tahun."
        ]
      };
    }

    if (name.includes("fun dive")) {
      return {
        durasi: "3-4 Jam",
        kapasitas: kapasitasDb || "Grup Kecil",
        level: "Pemilik Lisensi (Open Water+)",
        included: [
          "2 Sesi Penyelaman di spot unggulan Gili (Meno Wall, Shark Point)",
          "Dive Master lokal berpengalaman yang hafal rute",
          "Kapal dive boat khusus keberangkatan",
          "Penyediaan Tabung & Pemberat (Weights)",
          "Teh hangat, buah segar & snack ringan di kapal"
        ],
        excluded: [
          "Rental full-set BCD & Regulator (Opsional Add-on)",
          "Logbook fisik (Peserta membawa sendiri)",
          "Biaya konservasi pulau Gili (Gili Eco Trust)"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan minimal 24 jam sebelum keberangkatan. Proses refund 3-5 hari kerja.",
        terms: [
          "Wajib menunjukkan Lisensi Menyelam fisik/digital yang valid sebelum berangkat.",
          "Maksimal rasio 4 penyelam didampingi 1 Dive Master demi keamanan.",
          "Penyelaman terakhir disarankan minimal dalam kurun waktu 1 tahun."
        ]
      };
    }

    if (name.includes("garden view")) {
      return {
        durasi: "Per Malam",
        kapasitas: kapasitasDb || "2 Dewasa",
        level: "Semua Umur",
        included: [
          "Menginap di Bungalow Standard",
          "Pendingin Ruangan (AC) & Kipas Angin",
          "Teras pribadi dengan pemandangan taman tropis",
          "Sarapan pagi khas lokal untuk 2 orang",
          "Akses gratis ke kolam renang utama",
          "Kamar mandi terbuka (Semi-open bathroom) dengan shower"
        ],
        excluded: [
          "Minibar berbayar di dalam kamar",
          "Layanan Laundry baju",
          "Layanan Extra Bed (Kasur tambahan)"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan hingga 48 jam sebelum Check-in. Proses refund 3-5 hari kerja.",
        terms: [
          "Wajib membawa KTP/Paspor asli untuk registrasi.",
          "Dilarang keras merokok di dalam area kamar tidur.",
          "Waktu Check-in jam 14:00, Check-out jam 12:00."
        ]
      };
    }

    if (name.includes("ocean view")) {
      return {
        durasi: "Per Malam",
        kapasitas: kapasitasDb || "2 Dewasa",
        level: "Semua Umur",
        included: [
          "Kamar Tipe Premium Deluxe di lantai atas",
          "Pemandangan matahari terbit dan pantai langsung",
          "Smart TV dengan akses Netflix & Wi-Fi kecepatan tinggi",
          "Balkon luas dengan kursi santai gantung",
          "Kulkas mini, brankas, dan air panas",
          "Sarapan A-la-Carte premium di restoran pantai"
        ],
        excluded: [
          "Biaya antar-jemput bandara/pelabuhan",
          "Layanan room service setelah jam 10 malam"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan hingga 3 hari sebelum kunjungan. Proses refund 3-5 hari kerja. Di bawah itu hangus/tarif 1 malam.",
        terms: [
          "Check-in mulai jam 14:00. Check-out jam 12:00.",
          "Deposit kunci sebesar Rp 200.000 (refundable) saat registrasi.",
          "Mohon menjaga ketenangan di atas jam 10 malam."
        ]
      };
    }

    if (name.includes("family bungalow")) {
      return {
        durasi: "Per Malam",
        kapasitas: kapasitasDb || "4 Dewasa + 2 Anak",
        level: "Semua Umur",
        included: [
          "Rumah Bungalow utuh dengan 2 kamar tidur besar",
          "Ruang tamu keluarga & dapur mini pribadi",
          "Akses kolam renang semi-private di depan unit",
          "Sarapan keluarga lengkap untuk 4 orang",
          "Teras santai depan kolam dengan meja makan outdoor",
          "Dispenser air minum & perlengkapan teh/kopi lengkap"
        ],
        excluded: [
          "Bahan masakan di dapur (bisa dibeli di minimarket sekitar)",
          "Layanan kebersihan ekstra di luar jadwal harian"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan hingga H-7 sebelum kedatangan. Proses refund 3-5 hari kerja.",
        terms: [
          "Sangat cocok untuk liburan keluarga/grup kecil.",
          "Maksimal kapasitas adalah 6 orang (dengan extra bed berbayar).",
          "Dilarang membawa hewan peliharaan."
        ]
      };
    }

    if (name.includes("seafood bakar")) {
      return {
        durasi: "Instan",
        kapasitas: kapasitasDb || "1 Porsi",
        level: "Semua Kalangan",
        included: [
          "Ikan Bakar Kakap/Kerapu segar tangkapan hari ini",
          "Sate Cumi bakar kecap & Udang madu",
          "Nasi putih hangat melimpah",
          "Sambal Khas Sasak (Sambal Beberuk) & Pelecing Kangkung",
          "Es Kelapa Muda utuh langsung di batoknya"
        ],
        excluded: [
          "Minuman bersoda atau beralkohol di luar paket",
          "Menu tambahan pembuka (Appetizer) seperti kentang goreng"
        ],
        policy: "Voucher makan berlaku 24 jam. Pesanan yang sudah dibakar tidak bisa dibatalkan.",
        terms: [
          "Hanya berlaku untuk makan di tempat (Dine-in) restoran.",
          "Tunjukkan voucher pesanan sebelum memesan untuk diproses cepat.",
          "Jam operasional restoran adalah pukul 11:00 - 22:00."
        ]
      };
    }

    if (name.includes("malam romantis")) {
      return {
        durasi: "1.5 - 2 Jam",
        kapasitas: kapasitasDb || "2 Orang (Pasangan)",
        level: "Dewasa",
        included: [
          "Setup meja makan romantis eksklusif di bibir pantai",
          "Dekorasi lilin, lentera, dan taburan kelopak bunga mawar",
          "4-Course Menu (Appetizer, Soup, Main Course, Dessert)",
          "Pelayan khusus (Personal Butler) selama malam malam",
          "2 Gelas Mocktail segar pembuka suasana"
        ],
        excluded: [
          "Bouquet Bunga Mawar asli segar (Add-on tambahan)",
          "Dokumentasi foto professional oleh fotografer",
          "Botol Wine atau minuman beralkohol lainnya"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan minimal 24 jam sebelumnya. Proses refund 3-5 hari kerja. Pembatalan hari H dikenakan biaya 50%.",
        terms: [
          "Wajib konfirmasi waktu kedatangan minimal 6 jam sebelumnya.",
          "Tersedia opsi menu Vegetarian/Seafood (harap informasikan di awal).",
          "Jika cuaca buruk/hujan, meja akan dipindah ke area semi-outdoor beratap."
        ]
      };
    }

    if (name.includes("peralatan snorkeling")) {
      return {
        durasi: "24 Jam",
        kapasitas: kapasitasDb || "1 Unit Alat",
        level: "Semua Umur",
        included: [
          "1x Masker silikon anti bocor yang pas di wajah",
          "1x Snorkel pipa pernapasan tipe dry-top",
          "1 Pasang Kaki Katak (Fins) ukuran sesuai pesanan",
          "Tas jaring penyimpanan peralatan selam",
          "Pencucian & sterilisasi alat standar sebelum disewa"
        ],
        excluded: [
          "Layanan pemandu/Guide (Hanya sewa fisik alat)",
          "Layanan antar-jemput alat ke hotel (Ambil di toko vendor)",
          "Asuransi kerusakan alat"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan sebelum serah terima barang.",
        terms: [
          "Penyewa wajib meninggalkan jaminan identitas asli (KTP/SIM/Paspor).",
          "Keterlambatan pengembalian dikenakan denda tarif harian.",
          "Kerusakan parah atau hilangnya alat wajib diganti rugi senilai harga beli."
        ]
      };
    }

    if (name.includes("underwater")) {
      return {
        durasi: "1-2 Jam",
        kapasitas: kapasitasDb || "Grup/Pribadi",
        level: "Semua Umur",
        included: [
          "1 Jam pemotretan oleh fotografer selam profesional",
          "Penggunaan Kamera Pro Mirrorless & Housing Bawah Air khusus",
          "Minimal 30 file foto resolusi tinggi yang diambil",
          "10 file foto terpilih melalui proses editing/retouching warna",
          "Link Google Drive khusus untuk download hasil foto"
        ],
        excluded: [
          "Tiket masuk perahu/biaya sewa kapal",
          "Tiket konservasi menyelam peserta",
          "Alat menyelam/snorkeling fotografer (jika dipasang di trip pribadi)"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan minimal 24 jam sebelum sesi. Proses refund 3-5 hari kerja.",
        terms: [
          "Fotografer akan ikut serta di kapal snorkeling Anda.",
          "Peserta disarankan memakai baju renang berwarna cerah (merah/kuning) agar kontras di kamera.",
          "Proses editing foto memakan waktu maksimal 2-3-5 hari kerja."
        ]
      };
    }

    if (name.includes("drone")) {
      return {
        durasi: "1 Jam",
        kapasitas: kapasitasDb || "Grup/Pribadi",
        level: "Semua Umur",
        included: [
          "Pilot drone berpengalaman & berlisensi APDI",
          "Penggunaan drone DJI 4K kualitas premium",
          "Minimal 15 foto lanskap udara dari berbagai sudut",
          "Video mentah (raw footage) resolusi 4K cinematic",
          "Transfer file instan ke handphone/laptop Anda di lokasi"
        ],
        excluded: [
          "Proses editing video klip cinematic (Add-on tambahan)",
          "Izin terbang di kawasan terlarang (No-fly zone bandara)"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan minimal 24 jam sebelum sesi. Proses refund 3-5 hari kerja.",
        terms: [
          "Penerbangan drone sangat bergantung pada kestabilan arah angin dan cuaca.",
          "Pilot drone berhak menghentikan sesi jika kondisi alam dianggap tidak aman bagi alat.",
          "Harap mematuhi panduan visual dari pilot saat pengambilan gambar."
        ]
      };
    }

    // 2. FALLBACK BY CATEGORY (IF NO SPECIFIC NAME MATCHES)
    if (category === "homestay") {
      return {
        durasi: "Per Malam",
        kapasitas: kapasitasDb || "2 Orang/Kamar",
        level: "Semua Umur",
        included: [
          "Kamar bersih dan nyaman (AC/Kipas)",
          "Sarapan gratis untuk 2 orang",
          "Akses Wi-Fi gratis di seluruh area",
          "Layanan kebersihan harian"
        ],
        excluded: ["Pengeluaran Pribadi & Tips", "Minuman Tambahan"],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan hingga 48 jam sebelum Check-in. Proses refund 3-5 hari kerja.",
        terms: [
          "Wajib menunjukkan KTP saat check-in.",
          "Dilarang merokok di dalam kamar.",
          "Check-in mulai jam 14:00, Check-out jam 12:00."
        ]
      };
    } else if (category === "kuliner") {
      return {
        durasi: "Instan",
        kapasitas: kapasitasDb || "1 Porsi",
        level: "Semua Kalangan",
        included: [
          "Bahan makanan segar tangkapan lokal",
          "Bumbu rempah otentik khas daerah",
          "Pilihan area makan indoor/outdoor",
          "Termasuk pajak dan layanan"
        ],
        excluded: ["Menu minuman tambahan", "Pengeluaran pribadi"],
        policy: "Pesanan yang sudah diproses tidak dapat dibatalkan.",
        terms: [
          "Harap tunjukkan bukti pesanan digital.",
          "Berlaku hanya untuk makan di tempat.",
          "Voucher berlaku 24 jam dari tanggal pemesanan."
        ]
      };
    } else if (category === "fotografi") {
      return {
        durasi: "1-3 Jam",
        kapasitas: kapasitasDb || "Grup/Pribadi",
        level: "Semua Umur",
        included: [
          "Fotografer lokal profesional",
          "Peralatan kamera & drone berkualitas tinggi",
          "Transfer file foto digital cepat",
          "Termasuk retouch/editing dasar"
        ],
        excluded: ["Biaya masuk area komersil", "Tips sukarela fotografer"],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan minimal 24 jam sebelum sesi. Proses refund 3-5 hari kerja.",
        terms: [
          "Tiba di lokasi 15 menit sebelum sesi dimulai.",
          "Membawa kostum/baju ganti sendiri.",
          "Hasil editing dikirim maksimal 3-5 hari kerja."
        ]
      };
    } else if (category.includes("bahari") || name.includes("gili") || name.includes("boat") || name.includes("snorkeling")) {
      return {
        durasi: name.includes("hopping") ? "5-6 Jam" : "2-3 Jam",
        kapasitas: kapasitasDb || "Sharing/Private Boat",
        level: "Umur 5-60 Tahun",
        included: [
          "Glass Bottom Boat (untuk Island Hopping)",
          "Alat snorkeling (Masker & Fin)",
          "Life Jacket (Jaket Pelampung)",
          "Pemandu snorkeling berpengalaman",
          "Dokumentasi GoPro (Opsional/Add-on)"
        ],
        excluded: [
          "Pengeluaran Pribadi & Tips pemandu",
          "Transportasi ke Titik Kumpul awal"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan minimal 24 jam sebelum keberangkatan. Proses refund memakan waktu 3-5 hari kerja.",
        terms: [
          "Peserta wajib dalam kondisi sehat.",
          "Membawa baju ganti dan tabir surya.",
          "Mengikuti instruksi pemandu demi keselamatan.",
          "Dilarang menyentuh atau merusak terumbu karang."
        ]
      };
    } else {
      return {
        durasi:
          name.includes("discovery") || name.includes("fun")
            ? "2-3 Jam"
            : "4-6 Jam",
        kapasitas: kapasitasDb || "Grup/Pribadi",
        level: name.includes("discovery")
          ? "Pemula (No License)"
          : "Berlisensi (Pro)",
        included: [
          "Pelayanan terbaik dari vendor lokal terverifikasi",
          "Peralatan keselamatan sesuai standar",
          "Pemandu lokal berpengalaman",
          "Asuransi perjalanan dasar selama aktivitas"
        ],
        excluded: [
          "Makan dan minum pribadi",
          "Pengeluaran di luar paket"
        ],
        policy: "Refund dana (dipotong biaya layanan Midtrans & platform) jika dibatalkan minimal 24 jam sebelumnya. Proses refund memakan waktu 3-5 hari kerja.",
        terms: [
          "Peserta wajib mematuhi aturan keselamatan.",
          "Peralatan yang rusak akibat kelalaian menjadi tanggung jawab peserta.",
          "Pemesanan dianggap sah setelah pembayaran lunas."
        ]
      };
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const category = product?.vendor?.kategori?.toLowerCase() || "";
    if (category.includes("homestay")) {
      if (!checkInDate || !checkOutDate) {
        Swal.fire(
          "Perhatian",
          "Harap pilih tanggal Check-in dan Check-out",
          "warning",
        );
        return;
      }
      if (new Date(checkOutDate) <= new Date(checkInDate)) {
        Swal.fire("Error", "Tanggal Check-out harus setelah Check-in", "error");
        return;
      }
    } else {
      if (!bookingDate) {
        Swal.fire(
          "Perhatian",
          "Harap pilih tanggal rencana kunjungan Anda",
          "warning",
        );
        return;
      }
    }

    const cartItem = {
      id: product.id,
      product_id: product.id,
      name: product.nama_produk,
      type: (() => {
        const cat = product.vendor?.kategori?.toLowerCase() || "";
        const map: Record<string, string> = {
          aktivitas_tur: "Aktivitas Tur", homestay: "Akomodasi", kuliner: "Kuliner", 
          fotografi: "Fotografi", peralatan: "Peralatan", bahari: "Aktivitas Bahari",
        };
        return map[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ") : "Paket Wisata");
      })(),
      location: product.vendor?.alamat_lengkap || "Gili Trawangan, Lombok",
      vendor_name: product.vendor?.nama_toko || "",
      price: basePrice,
      quantity: quantity,
      image: product.thumbnail_url || PRODUCT_IMAGES[0],
      addons: getSelectedAddonsData(),
      addon_ids: getSelectedAddonsData()
        .map((a: any) => a.id)
        .filter(Boolean),
      visitDate: bookingDate,
      checkIn: checkInDate,
      checkOut: checkOutDate,
    };

    const existingCart = JSON.parse(
      localStorage.getItem("divexplore_cart") || "[]",
    );
    const existingIndex = existingCart.findIndex(
      (item: any) => item.id === cartItem.id,
    );

    if (existingIndex > -1) {
      existingCart[existingIndex] = cartItem;
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem("divexplore_cart", JSON.stringify(existingCart));
    window.dispatchEvent(new Event("cartUpdated"));

    Swal.fire({
      title: "Berhasil!",
      text: "Pesanan berhasil dimasukkan ke keranjang",
      icon: "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      background: "#1e293b",
      color: "#f8fafc",
      iconColor: "#0ea5e9",
    });
  };

  const handleBook = () => {
    if (!product) return;
    const category = product?.vendor?.kategori?.toLowerCase() || "";
    if (category.includes("homestay")) {
      if (!checkInDate || !checkOutDate) {
        Swal.fire(
          "Perhatian",
          "Harap pilih tanggal Check-in dan Check-out",
          "warning",
        );
        return;
      }
    } else {
      if (!bookingDate) {
        Swal.fire(
          "Perhatian",
          "Harap pilih tanggal rencana kunjungan Anda",
          "warning",
        );
        return;
      }
    }

    const directItem = {
      id: product.id,
      product_id: product.id,
      name: product.nama_produk,
      type: (() => {
        const cat = product.vendor?.kategori?.toLowerCase() || "";
        const map: Record<string, string> = {
          aktivitas_tur: "Aktivitas Tur", homestay: "Akomodasi", kuliner: "Kuliner", 
          fotografi: "Fotografi", peralatan: "Peralatan", bahari: "Aktivitas Bahari",
        };
        return map[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ") : "Paket Wisata");
      })(),
      location: product.vendor?.alamat_lengkap || "Gili Trawangan, Lombok",
      vendor_name: product.vendor?.nama_toko || "",
      price: basePrice,
      quantity: quantity,
      image: product.thumbnail_url || PRODUCT_IMAGES[0],
      addons: getSelectedAddonsData(),
      addon_ids: getSelectedAddonsData()
        .map((a: any) => a.id)
        .filter(Boolean),
      visitDate: bookingDate,
      checkIn: checkInDate,
      checkOut: checkOutDate,
    };

    localStorage.setItem(
      "divexplore_cart_direct",
      JSON.stringify([directItem]),
    );
    navigate("/checkout?type=direct");
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Header />
        <main
          className={styles.mainContent}
          style={{
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
          }}
        >
          <p>Memuat detail produk...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.container}>
        <Header />
        <main
          className={styles.mainContent}
          style={{
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
          }}
        >
          <p>Produk tidak ditemukan.</p>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/catalog")}
          >
            Kembali ke Katalog
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const category = product?.vendor?.kategori?.toLowerCase() || "";
  const isAkomodasi = category.includes("homestay");
  const isFotografi = category.includes("fotografi");
  const dynamicData = getDynamicFeatures() as any;

  // 🛠️ Inject Extra Category-Specific Policies (Transaction, Force Majeure, Environment)
  if (dynamicData) {
    dynamicData.policyPayment = "Semua pembayaran wajib dilunasi di muka secara aman menggunakan gerbang pembayaran Midtrans. E-Tiket atau voucher digital resmi diterbitkan instan oleh sistem segera setelah notifikasi transaksi lunas dari bank Anda diterima.";
    
    if (category.includes("homestay")) {
      dynamicData.policyExtraTitle = "Kebijakan Inventaris & Kerusakan";
      dynamicData.policyExtra = "Wisatawan bertanggung jawab penuh menjaga kebersihan dan keutuhan fasilitas kamar Bungalow. Segala bentuk kehilangan atau kerusakan fisik pada aset akomodasi akibat kelalaian tamu akan dikenakan kompensasi ganti rugi langsung sesuai tagihan pengelola.";
    } else if (category.includes("kuliner")) {
      dynamicData.policyExtraTitle = "Kebijakan Informasi Alergi Konsumen";
      dynamicData.policyExtra = "Bagi wisatawan yang memiliki pantangan atau riwayat alergi makanan yang parah (misal: seafood, kacang, gluten), diwajibkan untuk menginformasikan hal tersebut kepada staf restoran/pelayan SEBELUM hidangan mulai dimasak.";
    } else if (category.includes("fotografi")) {
      dynamicData.policyExtraTitle = "Kebijakan Cuaca & Ketentuan Drone";
      dynamicData.policyExtra = "Sesi pemotretan udara (drone cinematic) sangat dipengaruhi faktor kestabilan angin dan curah hujan lokal demi keselamatan publik. Apabila cuaca di lapangan hujan badai ekstrem, sesi akan dialihkan ke foto darat/indoor, atau refund khusus sebagian diproses.";
    } else {
      // Default Bahari / Boat / Snorkeling
      dynamicData.policyExtraTitle = "Kebijakan Force Majeure & Cuaca Buruk";
      dynamicData.policyExtra = "Keselamatan jiwa adalah prioritas nomor satu kami. Jika aktivitas terpaksa dibatalkan sepihak oleh vendor akibat ancaman cuaca buruk, gelombang tinggi, atau larangan melaut resmi dari Syahbandar Pelabuhan, wisatawan berhak penuh mengajukan refund khusus (dipotong biaya administrasi platform saja).";
      
      // Inject Eco-Tourism & No-Show rules to the visual Terms list!
      if (Array.isArray(dynamicData.terms)) {
        if (!dynamicData.terms.some((t: string) => t.includes("No-Show") || t.includes("keterlambatan"))) {
          dynamicData.terms.push("Keterlambatan kedatangan lebih dari 15 menit di dermaga titik kumpul tanpa konfirmasi dianggap 'No-Show' (tiket hangus, dana non-refundable).");
        }
        if (!dynamicData.terms.some((t: string) => t.includes("karang") || t.includes("penyu"))) {
          dynamicData.terms.push("Dilarang keras merusak terumbu karang, menaiki penyu laut, mengambil bintang laut, atau membuang sampah plastik (Eco-Tourism Policy Gili).");
        }
        if ((category.includes("bahari") || product.nama_produk.toLowerCase().includes("dive") || product.nama_produk.toLowerCase().includes("snorkeling")) && 
            !dynamicData.terms.some((t: string) => t.includes("epilepsi") || t.includes("hamil"))) {
          dynamicData.terms.push("Aktivitas laut berat tidak disarankan untuk wanita hamil, atau penyandang asma kronis, jantung, dan epilepsi.");
        }
      }
    }
  }

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.breadcrumb}>
        <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          Beranda
        </span>
        <span>&gt;</span>
        <span
          onClick={() => navigate("/catalog")}
          style={{ cursor: "pointer" }}
        >
          Katalog
        </span>
        <span>&gt;</span>
        <span>
          {(() => {
            const cat = product.vendor?.kategori?.toLowerCase() || "";
            const map: Record<string, string> = {
              aktivitas_tur: "Aktivitas Tur",
              homestay: "Akomodasi",
              kuliner: "Kuliner",
              fotografi: "Fotografi",
              peralatan: "Peralatan",
              bahari: "Aktivitas Bahari",
            };
            return (
              map[cat] ||
              cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ")
            );
          })()}
        </span>
        <span>&gt;</span>
        <span className={styles.active}>{product.nama_produk}</span>
      </div>

      <main className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <div className={styles.gallery}>
            <div className={styles.mainImageContainer}>
              <img
                src={activeImage}
                alt={product.nama_produk}
                className={styles.mainImage}
              />
              <div className={styles.tagsOverlay}>
                <span className={styles.tagBlue}>
                  {product.vendor?.kategori?.toUpperCase() || "PRODUK"}
                </span>
                <span className={styles.tagOrange}>TERVERIFIKASI</span>
              </div>

            </div>

            <div className={styles.thumbnails}>
              {[product.thumbnail_url, ...PRODUCT_IMAGES]
                .slice(0, 4)
                .filter(Boolean)
                .map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    className={`${styles.thumbnail} ${activeImage === img ? styles.active : ""}`}
                    alt={`Thumb ${index + 1}`}
                    onClick={() => setActiveImage(img)}
                  />
                ))}
            </div>
          </div>

          {product.inventories && (
            <div
              className={`${styles.stockBadge} ${
                product.inventories.reduce(
                  (acc: number, inv: any) => acc + inv.available_qty,
                  0,
                ) > 10
                  ? styles.stockAvailable
                  : product.inventories.reduce(
                        (acc: number, inv: any) => acc + inv.available_qty,
                        0,
                      ) > 0
                    ? styles.stockLimited
                    : styles.stockOut
              }`}
            >
              <Package size={14} />
              {(() => {
                const totalStock = product.inventories.reduce(
                  (acc: number, inv: any) => acc + inv.available_qty,
                  0,
                );
                if (totalStock <= 0) return "Maaf, Stok Habis";
                const label = isAkomodasi ? "kamar" : isFotografi ? "sesi" : "slot";
                return `Tersisa ${totalStock} ${label} tersedia`;
              })()}
            </div>
          )}

          <div className={styles.infoCards}>
            <div className={styles.infoCard}>
              <Clock className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>{dynamicData.durasi}</span>
              <span className={styles.infoLabel}>Durasi</span>
            </div>
            <div className={styles.infoCard}>
              <Users className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>{dynamicData.kapasitas}</span>
              <span className={styles.infoLabel}>Kapasitas</span>
            </div>
            <div className={styles.infoCard}>
              <Award className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>{dynamicData.level}</span>
              <span className={styles.infoLabel}>Level</span>
            </div>
            <div className={styles.infoCard}>
              <MapPin className={styles.infoIcon} size={24} />
              <span className={styles.infoValue}>
                {product.lokasi ||
                  product.vendor?.nama_toko ||
                  "Gili Trawangan"}
              </span>
              <span className={styles.infoLabel}>Lokasi</span>
            </div>
          </div>

          <div className={styles.dateSelectionCard}>
            <div className={styles.dateHeader}>
              <Calendar className={styles.dateIcon} size={20} />
              <span>
                {isAkomodasi
                  ? "Tentukan Waktu Menginap"
                  : "Pilih Tanggal Kunjungan"}
              </span>
            </div>

            <div className={styles.dateGrid}>
              {isAkomodasi ? (
                <>
                  <div className={styles.dateField}>
                    <label>Check-in</label>
                    <div className={styles.inputWrapper}>
                      <Clock className={styles.inputIconLeft} size={14} />
                      <input
                        type="date"
                        min={todayString}
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.dateField}>
                    <label>Check-out</label>
                    <div className={styles.inputWrapper}>
                      <Clock className={styles.inputIconLeft} size={14} />
                      <input
                        type="date"
                        min={
                          checkInDate || todayString
                        }
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.dateField}>
                  <label>Tanggal Kunjungan</label>
                  <div className={styles.inputWrapper}>
                    <Clock className={styles.inputIconLeft} size={14} />
                    <input
                      type="date"
                      min={todayString}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <p className={styles.dateHint}>
              * Ketersediaan slot akan dikonfirmasi otomatis saat pembayaran
            </p>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.bookingCard}>
            <div className={styles.bookingHeader}>
              <div className={styles.vendorInfo}>
                <span className={styles.vendorBadge}>
                  {product.vendor?.kategori || "VENDOR"}
                </span>
                <span className={styles.vendorLocation}>
                  {product.vendor?.nama_toko}
                </span>
              </div>
              <h1 className={styles.productTitle}>{product.nama_produk}</h1>

              <div className={styles.ratingRow}>
                <div className={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < Math.round(averageRating) ? "#f59e0b" : "none"}
                      color={
                        i < Math.round(averageRating) ? "#f59e0b" : "#cbd5e1"
                      }
                    />
                  ))}
                </div>
                <span className={styles.ratingScore}>
                  {averageRating.toFixed(1)}
                </span>
                <span className={styles.reviewCount}>
                  ({reviewCount} ulasan)
                </span>
              </div>

              <div className={styles.priceContainer}>
                <span className={styles.mainPrice}>
                  Rp {basePrice.toLocaleString("id-ID")}
                </span>
                <span className={styles.priceUnit}>
                  /{isAkomodasi ? "malam" : isFotografi ? "sesi" : "orang"}
                </span>
              </div>
            </div>

            <div className={styles.bookingForm}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Jumlah:</label>
                <div className={styles.qtySelector}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus size={16} />
                  </button>
                  <span className={styles.qtyValue}>{quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {product.crossSellingAsMain &&
                product.crossSellingAsMain.length > 0 && (
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      Tambahan Opsional:
                    </label>
                      {/* Addon Filter Tabs */}
                      <div className={styles.addonTabs}>
                        {(() => {
                          const cats: string[] = [];
                          product.crossSellingAsMain.forEach((a: any) => {
                            const c = a.addonProduct.vendor?.kategori || "lainnya";
                            if (!cats.includes(c)) cats.push(c);
                          });
                          return cats.map((cat) => (
                            <button
                              key={cat}
                              className={`${styles.addonTabBtn} ${activeAddonTab === cat ? styles.addonTabActive : ""}`}
                              onClick={() => setActiveAddonTab(cat)}
                            >
                              {cat.toUpperCase()}
                            </button>
                          ));
                        })()}
                      </div>

                      <div className={styles.addonsGrid}>
                        {product.crossSellingAsMain
                          .filter((a: any) => a.addonProduct.vendor?.kategori === activeAddonTab)
                          .map((addonObj: any) => {
                            const addon = addonObj.addonProduct;
                            const isChecked = selectedAddons.includes(addon.id);
                            const addonCat = addon.vendor?.kategori?.toLowerCase() || "";
                            const isAddonAkomodasi = addonCat.includes("homestay");
                            const currentAddonQty = addonQuantities[addon.id] || 1;

                            return (
                              <div
                                key={addon.id}
                                className={`${styles.addonCard} ${isChecked ? styles.addonCardActive : ""}`}
                                onClick={() => {
                                  if (!isChecked) {
                                    setSelectedAddons((prev) => [...prev, addon.id]);
                                    if (!addonQuantities[addon.id]) {
                                      setAddonQuantities((prev) => ({ ...prev, [addon.id]: 1 }));
                                    }
                                  }
                                }}
                              >
                                <div className={styles.addonImageWrapper}>
                                  <img
                                    src={addon.thumbnail_url || "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80"}
                                    alt={addon.nama_produk}
                                    className={styles.addonImg}
                                  />
                                  <div className={styles.addonOverlay}>
                                    {isChecked ? (
                                      <div className={styles.addonActiveControls} onClick={(e) => e.stopPropagation()}>
                                        <button
                                          className={styles.miniQtyBtn}
                                          onClick={() => setAddonQuantities(prev => ({
                                            ...prev,
                                            [addon.id]: Math.max(1, (prev[addon.id] || 1) - 1)
                                          }))}
                                        >
                                          <Minus size={12} />
                                        </button>
                                        <div className={styles.miniQtyDisplay}>
                                          <span className={styles.miniQtyNum}>{currentAddonQty}</span>
                                          <span className={styles.miniQtyUnit}>{isAddonAkomodasi ? "N" : "U"}</span>
                                        </div>
                                        <button
                                          className={styles.miniQtyBtn}
                                          onClick={() => setAddonQuantities(prev => ({
                                            ...prev,
                                            [addon.id]: (prev[addon.id] || 1) + 1
                                          }))}
                                        >
                                          <Plus size={12} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className={styles.addonAddIcon}>
                                        <Plus size={20} />
                                      </div>
                                    )}
                                  </div>
                                  {isChecked && (
                                    <button 
                                      className={styles.addonDeselect}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAddons(prev => prev.filter(id => id !== addon.id));
                                      }}
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                                <div className={styles.addonInfo}>
                                  <span className={styles.addonNameText}>{addon.nama_produk}</span>
                                  <span className={styles.addonPriceText}>+Rp {Number(addon.harga).toLocaleString("id-ID")}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                  </div>
                )}

              <div className={styles.totalRow}>
                <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                  <div className={styles.totalHeader}>
                    <span className={styles.totalLabel}>Total Pembayaran:</span>
                    <span className={styles.finalPrice}>
                      Rp {calculateTotal().toLocaleString("id-ID")}
                    </span>
                  </div>
                  
                  {/* Price Breakdown */}
                  <div className={styles.breakdown}>
                    <div className={styles.breakdownItem}>
                      {(() => {
                        const category = product.vendor?.kategori?.toLowerCase() || "";
                        let unit = "Pax";
                        if (category === "homestay") unit = "Malam";
                        else if (category === "kuliner") unit = "Porsi";
                        else if (category === "peralatan") unit = "Unit";
                        else if (category === "fotografi") unit = "Sesi";
                        
                        return (
                          <>
                            <span>{product.nama_produk} ({quantity} {unit})</span>
                            <span>Rp {(basePrice * quantity * (isAkomodasi ? calculateNights(checkInDate, checkOutDate) : 1)).toLocaleString("id-ID")}</span>
                          </>
                        );
                      })()}
                    </div>
                    {product.crossSellingAsMain && product.crossSellingAsMain.map((addonObj: any) => {
                      const addon = addonObj.addonProduct;
                      if (selectedAddons.includes(addon.id)) {
                        const addonQty = addonQuantities[addon.id] || 1;
                        const addonCat = addon.vendor?.kategori?.toLowerCase() || "";
                        const unit = addonCat.includes("homestay") ? "Malam" : "Unit";
                        return (
                          <div key={addon.id} className={styles.breakdownItem}>
                            <span>{addon.nama_produk} ({addonQty} {unit})</span>
                            <span>Rp {(Number(addon.harga) * addonQty).toLocaleString("id-ID")}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button className={styles.btnPrimary} onClick={handleAddToCart}>
                  <ShoppingCart size={18} />
                  Tambah ke Keranjang
                </button>
                <button
                  className={styles.btnSuccess}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate("/login");
                    } else {
                      handleBook();
                    }
                  }}
                >
                  <Zap size={18} />
                  Pesan Sekarang
                </button>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.footerFeature}>
                  <ShieldCheck size={14} color="#ef4444" />
                  Pembayaran Aman
                </div>
                <div className={styles.footerFeature}>
                  <Clock size={14} />
                  Refund 3-5 Hari Kerja
                </div>
                <div className={styles.footerFeature}>
                  <Star size={14} color="#f59e0b" />
                  Vendor Terverifikasi
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className={styles.tabsSection}>
        <div className={styles.tabsHeader}>
          <button
            className={`${styles.tabBtn} ${activeTab === "deskripsi" ? styles.active : ""}`}
            onClick={() => setActiveTab("deskripsi")}
          >
            <FileText size={16} /> Deskripsi
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "lokasi" ? styles.active : ""}`}
            onClick={() => setActiveTab("lokasi")}
          >
            <MapPin size={16} /> Lokasi & Peta
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "ulasan" ? styles.active : ""}`}
            onClick={() => setActiveTab("ulasan")}
          >
            <Star size={16} /> Ulasan
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "kebijakan" ? styles.active : ""}`}
            onClick={() => setActiveTab("kebijakan")}
          >
            <Scale size={16} /> Kebijakan
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "syarat" ? styles.active : ""}`}
            onClick={() => setActiveTab("syarat")}
          >
            <AlertCircle size={16} /> Syarat & Ketentuan
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === "deskripsi" && (
            <div className={styles.tabGrid}>
              <div className={styles.descriptionCol}>
                <h2 className={styles.sectionTitle}>
                  Tentang {product.nama_produk}
                </h2>
                <div className={styles.descText}>
                  {product.deskripsi ? (
                    <p>{product.deskripsi}</p>
                  ) : (product.nama_produk || "").toLowerCase().includes("hopping") ? (
                    <>
                      <p>Perjalanan keliling 3 pulau menggunakan Glass Bottom Boat. Termasuk singgah di spot patung bawah air (Bask Nest) dan area penyu.</p>
                      <p style={{marginTop: '10px'}}>Nikmati keindahan Gili Trawangan, Gili Meno, dan Gili Air dalam satu paket tur sharing yang seru dan ekonomis.</p>
                    </>
                  ) : (
                    <p>Jelajahi keindahan tersembunyi dengan paket wisata dari Divexplore 3D.</p>
                  )}
                </div>

                <div className={styles.inclusionGrid}>
                  <div className={styles.includedBox}>
                    <div className={styles.includedTitle}>
                      <CheckCircle2 size={20} color="#10b981" />
                      Apa yang Termasuk
                    </div>
                    <div className={styles.includedList}>
                      {dynamicData.included.map((item: string, idx: number) => (
                        <div key={idx} className={styles.includedItem}>
                          <CheckCircle2 size={14} color="#10b981" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.excludedBox}>
                    <div className={styles.includedTitle}>
                      <XCircle size={20} color="#ef4444" />
                      Tidak Termasuk
                    </div>
                    <div className={styles.includedList}>
                      {(dynamicData.excluded || []).map((item: string, idx: number) => (
                        <div key={idx} className={styles.includedItem}>
                          <XCircle size={14} color="#ef4444" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Recent Reviews */}
              <div className={styles.reviewsSidebar}>
                <div className={styles.quickReviewsHeader}>
                  <h3 className={styles.quickReviewsTitle}>
                    <Star size={18} color="#f59e0b" style={{marginRight: '8px', flexShrink: 0}} />
                    <span>Ulasan Terbaru</span>
                  </h3>
                  <span 
                    className={styles.viewAllReviewsLink}
                    onClick={() => setActiveTab("ulasan")}
                  >
                    Lihat Semua
                  </span>
                </div>
                
                {product.reviews && product.reviews.length > 0 ? (
                  <div className={styles.quickReviewsList}>
                    {product.reviews.slice(0, 3).map((rev: any) => (
                      <div key={rev.id} className={styles.quickReviewItem}>
                        <div className={styles.quickReviewHeader}>
                          <div className={styles.quickReviewerInfo}>
                            <div className={styles.miniAvatar}>
                              {rev.user?.nama_lengkap?.charAt(0) || "U"}
                            </div>
                            <span className={styles.quickReviewer}>{rev.user?.nama_lengkap || "Pengguna"}</span>
                          </div>
                          <div className={styles.quickRating}>
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={8} fill={i < (rev.rating || 5) ? "#f59e0b" : "none"} color={i < (rev.rating || 5) ? "#f59e0b" : "#cbd5e1"} />
                            ))}
                          </div>
                        </div>
                        <p className={styles.quickReviewText}>{rev.komentar}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noReviewsText}>Belum ada ulasan untuk produk ini.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "lokasi" && (
            <div className={styles.locationTab}>
              <div className={styles.locationHeader}>
                <h2 className={styles.sectionTitle}>Lokasi & Titik Kumpul</h2>
                <div className={styles.addressInfo}>
                  <MapPin size={16} color="#0ea5e9" />
                  <span>
                    {product.lokasi || product.vendor?.alamat_lengkap || "Lombok, Indonesia"}
                  </span>
                </div>
              </div>

              <div className={styles.mapWrapper}>
                <div ref={mapContainer} style={{ width: "100%", height: "100%", background: "#0f172a" }} />
              </div>
            </div>
          )}

          {activeTab === "ulasan" && (
            <div className={styles.reviewsTabContainer}>
              <div className={styles.reviewsHeader}>
                <h2 className={styles.sectionTitle}>
                  <Star
                    size={20}
                    color="#f59e0b"
                    style={{ display: "inline", marginRight: "8px" }}
                  />
                  Ulasan Pengunjung
                </h2>
              </div>
              
              {product.reviews && product.reviews.length > 0 ? (
                <div className={styles.reviewsGrid}>
                  {product.reviews.map((review: any) => (
                    <div key={review.id} className={styles.reviewCard}>
                      <div className={styles.reviewerInfo}>
                        <div className={styles.reviewerProfile}>
                          <div className={styles.miniAvatar} style={{width: '36px', height: '36px', fontSize: '15px'}}>
                            {review.user?.nama_lengkap?.charAt(0) || "U"}
                          </div>
                          <div className={styles.reviewerMeta}>
                            <div className={styles.reviewerName}>
                              {review.user?.nama_lengkap || "Pengguna"}
                            </div>
                            <div className={styles.quickRating} style={{marginTop: '2px'}}>
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} fill={i < (review.rating || 5) ? "#f59e0b" : "none"} color={i < (review.rating || 5) ? "#f59e0b" : "#cbd5e1"} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className={styles.reviewText}>{review.komentar}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noReviewsBox}>
                  <p className={styles.reviewText}>Belum ada ulasan untuk produk ini.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "kebijakan" && (
            <div className={styles.descriptionCol}>
              <h2 className={styles.sectionTitle}>Kebijakan Layanan & Ketentuan Refund</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px", width: "100%" }}>
                {/* 1. Aturan Pembatalan */}
                <div className={styles.policyCard}>
                  <div className={styles.policyItem}>
                    <History size={24} color="#0ea5e9" style={{ flexShrink: 0 }} />
                    <div>
                      <div className={styles.policyTitle}>Kebijakan Pembatalan & Refund</div>
                      <p className={styles.policyDesc}>
                        {dynamicData.policy || "Refund dana dipotong biaya layanan Midtrans & platform. Proses refund memakan waktu 3-5 hari kerja."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Kebijakan Pembayaran */}
                {dynamicData.policyPayment && (
                  <div className={styles.policyCard}>
                    <div className={styles.policyItem}>
                      <CreditCard size={24} color="#10b981" style={{ flexShrink: 0 }} />
                      <div>
                        <div className={styles.policyTitle}>Sistem & Keamanan Pembayaran</div>
                        <p className={styles.policyDesc}>{dynamicData.policyPayment}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Ketentuan Operasional Khusus */}
                {dynamicData.policyExtra && (
                  <div className={styles.policyCard}>
                    <div className={styles.policyItem}>
                      <CloudRain size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
                      <div>
                        <div className={styles.policyTitle}>{dynamicData.policyExtraTitle || "Ketentuan Keadaan Khusus"}</div>
                        <p className={styles.policyDesc}>{dynamicData.policyExtra}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "syarat" && (
            <div className={styles.descriptionCol}>
              <h2 className={styles.sectionTitle}>Syarat & Ketentuan</h2>
              <div className={styles.termsList}>
                {(dynamicData.terms || ["Peserta wajib dalam kondisi sehat jasmani dan rohani."]).map((term: string, idx: number) => (
                  <div key={idx} className={styles.termsItem}>
                    <p>{idx + 1}. {term}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedHeader}>
            <h2 className={styles.sectionTitle}>
              <ShoppingCart size={20} style={{display: 'inline', marginRight: '8px', verticalAlign: 'middle'}} />
              Rekomendasi Lainnya
            </h2>
            <span className={styles.viewAllLink} onClick={() => navigate('/catalog')} style={{cursor:'pointer'}}>
              Lihat Semua <ArrowRight size={14} style={{marginLeft: '4px', display: 'inline-block'}} />
            </span>
          </div>
          
          <div className={styles.relatedGrid}>
            {relatedProducts.map(rel => (
              <div key={rel.id} className={styles.relatedCard}>
                <div className={styles.relatedImageContainer} onClick={() => navigate(`/product/${rel.id}`)} style={{cursor: 'pointer'}}>
                  <img src={rel.thumbnail_url || PRODUCT_IMAGES[1]} alt={rel.nama_produk} className={styles.relatedImage} />
                  <span className={`${styles.relatedTag} ${styles.relatedTagBlue}`}>
                    {rel.vendor?.kategori?.toUpperCase() || 'UMKM'}
                  </span>
                </div>
                <div className={styles.relatedInfo}>
                  <h3 className={styles.relatedTitle} onClick={() => navigate(`/product/${rel.id}`)} style={{cursor: 'pointer'}}>
                    {rel.nama_produk}
                  </h3>
                  <div className={styles.relatedLocation}>
                    <Building size={10} /> {rel.vendor?.nama_toko || 'Vendor Terverifikasi'}
                  </div>
                  <div className={styles.relatedFooter}>
                    <div className={styles.relatedPrice}>
                      Rp {Number(rel.harga).toLocaleString('id-ID')}
                    </div>
                    <button className={styles.addBtn} onClick={() => navigate(`/product/${rel.id}`)}>Detail</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}