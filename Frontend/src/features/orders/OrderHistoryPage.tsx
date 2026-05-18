import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactPaginatePkg from "react-paginate";
const ReactPaginate: any = (ReactPaginatePkg as any).default || ReactPaginatePkg;
import {
  Calendar,
  Users,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Package,
  RefreshCw,
  Clock,
  XCircle,
  ShoppingBag,
  MapPin,
  Star,
} from "lucide-react";
import styles from "./OrderHistoryPage.module.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import { api } from "../../utils/api";
import ReviewModal from "./ReviewModal";

type Tab = "semua" | "pending" | "paid" | "canceled" | "cancelled" | "expired";

interface OrderItem {
  id: string;
  product_id: string;
  qty: number;
  harga_satuan: number;
  subtotal: number;
  product?: { nama_produk: string; thumbnail_url?: string; lokasi?: string };
  vendor?: { nama_toko: string; kategori?: string; alamat_lengkap?: string };
  metadata?: any;
}

interface Order {
  id: string;
  status: "pending" | "paid" | "canceled" | "cancelled" | "expired";
  total_pembayaran: number;
  createdAt: string;
  items: OrderItem[];
  paymentLogs?: { payment_type: string }[];
  reviews?: any[];
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: typeof Clock;
    color: string;
    bg: string;
    border: string;
  }
> = {
  pending: {
    label: "Menunggu Bayar",
    icon: Clock,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
  },
  paid: {
    label: "Lunas",
    icon: CheckCircle2,
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
  },
  canceled: {
    label: "Dibatalkan",
    icon: XCircle,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
  },
  cancelled: {
    label: "Dibatalkan",
    icon: XCircle,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
  },
  expired: {
    label: "Dibatalkan (Expired)",
    icon: XCircle,
    color: "#64748b",
    bg: "rgba(100,116,139,0.1)",
    border: "rgba(100,116,139,0.25)",
  },
};

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("semua");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<{
    id: string;
    productId: string;
    productName: string;
  } | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/api/orders/me");
        const ordersData = res.data?.orders || [];
        setOrders(ordersData);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          navigate("/login");
        } else {
          setError("Gagal memuat riwayat pesanan. Coba lagi.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [navigate]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "semua") return true;
    if (activeTab === "canceled") {
      return order.status === "canceled" || order.status === "cancelled";
    }
    return order.status === activeTab;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPrimaryItem = (order: Order) => {
    if (!order.items?.length) return null;
    // Cari item yang metadata-nya TIDAK punya parent_product
    const primary = order.items.find(i => !i.metadata?.parent_product);
    return primary || order.items[0];
  };

  const getProductImage = (order: Order): string => {
    const primary = getPrimaryItem(order);
    return primary?.product?.thumbnail_url || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80";
  };

  const getProductName = (order: Order): string => {
    const primary = getPrimaryItem(order);
    if (!primary) return "Paket Wisata";
    return primary.product?.nama_produk || "Produk";
  };

  const getVendorName = (order: Order): string => {
    const primary = getPrimaryItem(order);
    return primary?.vendor?.nama_toko || "Divexplore Vendor";
  };

  const getLocation = (order: Order): string => {
    const primary = getPrimaryItem(order);
    // Gunakan alamat vendor sebagai lokasi
    return primary?.vendor?.alamat_lengkap || "Indonesia";
  };

  const getTotalPax = (order: Order): number => {
    const primary = getPrimaryItem(order);
    return primary?.qty || 1;
  };

  const getQuantityLabel = (order: Order): string => {
    const primary = getPrimaryItem(order);
    if (!primary) return "Item";
    
    const cat = primary.vendor?.kategori?.toLowerCase() || "";
    const name = primary.product?.nama_produk?.toLowerCase() || "";

    if (cat.includes("homestay")) {
      if (name.includes("spa") || name.includes("massage")) return "Layanan";
      return "Kamar";
    }
    if (cat.includes("kuliner")) return "Porsi";
    if (cat.includes("peralatan")) return "Unit";
    
    return "Pax";
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getPaymentMethod = (order: Order): string => {
    // 1. Ambil semua log yang ada
    const logs = order.paymentLogs || [];

    // 2. Cari log yang paling "berisi" (punya payment_type yang bukan null)
    // Kita prioritaskan log yang punya tipe spesifik
    const validLog =
      logs.find((l) => l.payment_type && l.payment_type !== "null") || logs[0];

    // 3. Normalisasi string ke lowercase agar matching map aman
    const raw = (validLog?.payment_type || "").toLowerCase().trim();
    if (!raw || raw === "null") return "Online Payment";

    const map: Record<string, string> = {
      bank_transfer: "Transfer Bank",
      bca_va: "BCA Virtual Account",
      bni_va: "BNI Virtual Account",
      bri_va: "BRI Virtual Account",
      mandiri_bill: "Mandiri Virtual Account",
      echannel: "Mandiri Bill Payment", // Kode internal Midtrans untuk Mandiri
      permata_va: "Permata Virtual Account",
      gopay: "GoPay",
      shopeepay: "ShopeePay",
      qris: "QRIS",
      credit_card: "Kartu Kredit",
      cstore: "Minimarket",
    };

    return (
      map[raw] ??
      raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };
  const handleReview = (order: Order) => {
    const item = order.items?.[0];
    if (item) {
      setSelectedOrderForReview({
        id: order.id,
        productId: item.product_id,
        productName: item.product?.nama_produk || "Produk",
      });
      setIsReviewOpen(true);
    }
  };
  const handlePayNow = async (order: Order) => {
    try {
      // 1. Ambil Snap Token dari Backend untuk Order ini
      const res = await api.get(`/api/orders/${order.id}/snap-token`);
      const data = res.data?.data || res.data; // Handle nesting difference

      // Jika Backend menyuruh skip popup (karena sudah pilih metode)
      if (data.skip_popup) {
        localStorage.setItem(
          "divexplore_last_order_data",
          JSON.stringify(order),
        );
        navigate("/payment-status?status=pending&auto_pay=false");
        return;
      }

      const { snap_token } = data;
      if (!snap_token) {
        alert("Gagal mendapatkan token pembayaran.");
        return;
      }

      // 2. Simpan data agar halaman Pembayaran bisa menampilkan info yang benar
      localStorage.setItem("divexplore_last_snap_token", snap_token);
      localStorage.setItem("divexplore_last_order_data", JSON.stringify(order));

      // 3. Redirect ke halaman Pembayaran (Langkah 3)
      navigate("/payment-status?status=pending&auto_pay=true");
    } catch (err) {
      console.error("Error pay now:", err);
      alert("Terjadi kesalahan saat memulai pembayaran.");
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "semua", label: "Semua Pesanan" },
    { key: "pending", label: "Menunggu Bayar" },
    { key: "paid", label: "Lunas" },
    { key: "canceled", label: "Dibatalkan" },
    { key: "expired", label: "Kedaluwarsa" },
  ];

  const stats = {
    total: orders.length,
    paid: orders.filter((o) => o.status === "paid").length,
    pending: orders.filter((o) => o.status === "pending").length,
    canceled: orders.filter(
      (o) => o.status === "canceled" || o.status === "cancelled",
    ).length,
    expired: orders.filter((o) => o.status === "expired").length,
  };

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        {/* ── Hero Header ── */}
        <div className={styles.heroSection}>
          <div className={styles.heroLeft}>
            <div className={styles.breadcrumb}>
              <span onClick={() => navigate("/")} className={styles.bcLink}>
                Beranda
              </span>
              <ChevronRight size={14} className={styles.bcSep} />
              <span className={styles.bcActive}>Riwayat Pesanan</span>
            </div>
            <h1 className={styles.pageTitle}>Riwayat Pesanan</h1>
            <p className={styles.pageDesc}>
              Kelola dan pantau semua perjalanan wisata Anda
            </p>
          </div>
          <button
            className={styles.newOrderBtn}
            onClick={() => navigate("/catalog")}
          >
            <ShoppingBag size={16} />
            Pesan Baru
          </button>
        </div>

        {/* ── Stats Cards ── */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ background: "rgba(14,165,233,0.15)" }}
            >
              <Package size={20} color="#0ea5e9" />
            </div>
            <div>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total Pesanan</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              <CheckCircle2 size={20} color="#10b981" />
            </div>
            <div>
              <div className={styles.statValue} style={{ color: "#10b981" }}>
                {stats.paid}
              </div>
              <div className={styles.statLabel}>Lunas</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ background: "rgba(245,158,11,0.15)" }}
            >
              <Clock size={20} color="#f59e0b" />
            </div>
            <div>
              <div className={styles.statValue} style={{ color: "#f59e0b" }}>
                {stats.pending}
              </div>
              <div className={styles.statLabel}>Menunggu Bayar</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ background: "rgba(239,68,68,0.15)" }}
            >
              <XCircle size={20} color="#ef4444" />
            </div>
            <div>
              <div className={styles.statValue} style={{ color: "#ef4444" }}>
                {stats.canceled}
              </div>
              <div className={styles.statLabel}>Dibatalkan</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ background: "rgba(100,116,139,0.15)" }}
            >
              <XCircle size={20} color="#64748b" />
            </div>
            <div>
              <div className={styles.statValue} style={{ color: "#64748b" }}>
                {stats.expired}
              </div>
              <div className={styles.statLabel}>Kedaluwarsa</div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabsContainer}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key !== "semua" && (
                <span
                  className={`${styles.tabBadge} ${activeTab === tab.key ? styles.tabBadgeActive : ""}`}
                >
                  {tab.key === "canceled"
                    ? orders.filter(
                        (o) =>
                          o.status === "canceled" ||
                          o.status === "cancelled" ||
                          o.status === "expired",
                      ).length
                    : orders.filter((o) => o.status === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Orders List ── */}
        <div className={styles.ordersList}>
          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinnerWrap}>
                <RefreshCw size={28} className={styles.spinIcon} />
              </div>
              <p className={styles.emptyTitle}>Memuat pesanan...</p>
              <p className={styles.emptyDesc}>Mohon tunggu sebentar</p>
            </div>
          ) : error ? (
            <div className={styles.emptyState}>
              <div
                className={styles.spinnerWrap}
                style={{ background: "rgba(239,68,68,0.1)" }}
              >
                <XCircle size={28} color="#ef4444" />
              </div>
              <p className={styles.emptyTitle} style={{ color: "#ef4444" }}>
                Terjadi Kesalahan
              </p>
              <p className={styles.emptyDesc}>{error}</p>
              <button
                className={styles.btnPrimary}
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={14} /> Coba Lagi
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.spinnerWrap}>
                <Package size={28} color="#0ea5e9" />
              </div>
              <p className={styles.emptyTitle}>Belum Ada Pesanan</p>
              <p className={styles.emptyDesc}>
                {activeTab === "semua"
                  ? "Anda belum memiliki riwayat pesanan. Yuk mulai berwisata!"
                  : `Tidak ada pesanan dengan status "${TABS.find((t) => t.key === activeTab)?.label}".`}
              </p>
              <button
                className={styles.btnPrimary}
                onClick={() => navigate("/catalog")}
              >
                <ShoppingBag size={14} /> Jelajahi Destinasi
              </button>
            </div>
          ) : (
            currentOrders.map((order) => {
              const cfg =
                STATUS_CONFIG[order.status] || {
                  label: order.status.toUpperCase(),
                  icon: Package,
                  color: "#94a3b8",
                  bg: "rgba(148,163,184,0.1)",
                  border: "rgba(148,163,184,0.25)",
                };
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={order.id}
                  className={`
                    ${styles.orderCard} 
                    ${order.status === "paid" ? styles.orderCardPaid : ""} 
                    ${order.status === "canceled" ? styles.orderCardCanceled : ""}
                    ${order.status === "expired" ? styles.orderCardExpired : ""}
                  `}
                >
                  {/* Left accent bar */}
                  <div
                    className={styles.cardAccent}
                    style={{ background: cfg.color }}
                  />

                  {/* Thumbnail */}
                  <div className={styles.imgWrap}>
                    <img
                      src={getProductImage(order)}
                      alt={getProductName(order)}
                      className={styles.orderImg}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80";
                      }}
                    />
                  </div>

                  {/* Main Info */}
                  <div className={styles.cardBody}>
                    <div className={styles.orderMeta}>
                      <span className={styles.orderId}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={styles.orderTime}>
                        <Calendar size={11} /> {formatTime(order.createdAt)}
                      </span>
                      <div
                        className={styles.statusBadge}
                        style={{
                          color: cfg.color,
                          background: cfg.bg,
                          borderColor: cfg.border,
                        }}
                      >
                        <StatusIcon size={10} />
                        {cfg.label}
                      </div>
                    </div>

                    <h3 className={styles.orderTitle}>
                      {getProductName(order)}
                    </h3>
                    <p className={styles.orderVendor}>{getVendorName(order)}</p>

                    {/* Mini Addon List */}
                    {order.items.length > 1 && (
                      <div className={styles.miniAddonList}>
                        <div className={styles.miniAddonTitle}>Tambahan :</div>
                        {order.items.filter(i => i.metadata?.parent_product).map((addon, idx) => (
                          <div key={idx} className={styles.miniAddonItem}>
                            <span>+ {addon.product?.nama_produk} ({addon.qty} {addon.vendor?.kategori?.toLowerCase() === 'homestay' ? 'Malam' : 'Unit'})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={styles.orderTags}>
                      <span className={styles.tag}>
                        <MapPin size={11} /> {getLocation(order)}
                      </span>
                      <span className={styles.tag}>
                        <Users size={11} /> {getTotalPax(order)} {getQuantityLabel(order)}
                      </span>
                      <span className={styles.tag}>
                        <Calendar size={11} /> {formatDate(order.createdAt)}
                      </span>
                      <span className={styles.tag}>
                        <CreditCard size={11} /> {getPaymentMethod(order)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Price + Actions */}
                  <div className={styles.cardRight}>
                    <div className={styles.priceBlock}>
                      <span className={styles.priceLabel}>
                        Total Pembayaran
                      </span>
                      <span className={styles.priceValue}>
                        Rp{" "}
                        {Number(order.total_pembayaran).toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className={styles.actionButtons}>
                      {order.status === "paid" && (
                        <>
                          <div className={styles.paidBadge}>
                            <CheckCircle2 size={13} /> Pembayaran Diterima
                          </div>
                          {!order.reviews || order.reviews.length === 0 ? (
                            <button
                              className={styles.btnReview}
                              onClick={() => handleReview(order)}
                            >
                              <Star size={13} /> Beri Ulasan
                            </button>
                          ) : (
                            <div className={styles.reviewedBadge}>
                              <CheckCircle2 size={13} /> Ulasan Terkirim
                            </div>
                          )}
                        </>
                      )}
                      {order.status === "pending" && (
                        <button
                          className={styles.btnPayNow}
                          onClick={() => handlePayNow(order)}
                        >
                          <CreditCard size={13} /> Bayar Sekarang
                        </button>
                      )}
                      {order.status !== "pending" && (
                        <button
                          className={styles.btnReorder}
                          onClick={() => {
                            const productId = order.items?.[0]?.product_id;
                            if (productId) {
                              navigate(`/product/${productId}`);
                            } else {
                              navigate("/catalog");
                            }
                          }}
                        >
                          Pesan Lagi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <ReactPaginate
            breakLabel="..."
            nextLabel={<ChevronRight size={16} />}
            onPageChange={(e: { selected: number }) => {
              setCurrentPage(e.selected + 1);
              window.scrollTo({ top: 300, behavior: "smooth" });
            }}
            pageRangeDisplayed={3}
            marginPagesDisplayed={1}
            pageCount={totalPages}
            previousLabel={<ChevronLeft size={16} />}
            renderOnZeroPageCount={null}
            containerClassName={styles.pagination}
            pageClassName={styles.pageItem}
            pageLinkClassName={styles.pageBtn}
            activeLinkClassName={styles.pageActive}
            previousClassName={styles.pageItem}
            nextClassName={styles.pageItem}
            previousLinkClassName={styles.pageBtn}
            nextLinkClassName={styles.pageBtn}
            breakClassName={styles.pageItem}
            breakLinkClassName={styles.pageBtn}
            disabledClassName={styles.pageDisabled}
            forcePage={currentPage - 1}
          />
        )}
      </main>

      <Footer />

      {selectedOrderForReview && (
        <ReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          orderId={selectedOrderForReview.id}
          productId={selectedOrderForReview.productId}
          productName={selectedOrderForReview.productName}
          onSuccess={() => {
            // Optional: refresh orders to show review state
          }}
        />
      )}
    </div>
  );
}
