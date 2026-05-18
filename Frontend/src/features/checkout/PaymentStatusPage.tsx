import { useState, useEffect, useMemo, useLayoutEffect, useRef } from "react";
import Swal from "sweetalert2";
// import emailjs from '@emailjs/browser';
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthContext";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  ShoppingBag,
  Star,
  Shield,
  AlertTriangle,
  Wallet,
  Building,
  ArrowLeft,
  CreditCard,
  Eye,
} from "lucide-react";
import styles from "./PaymentStatusPage.module.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import { api } from "../../utils/api";

type StatusType = "pending" | "success" | "expired" | "cancelled";

type CartItem = {
  name: string;
  type: string;
  location: string;
  price: number;
  quantity: number;
  image: string;
  addons: { price: number }[];
};

// Countdown for pending VA payment (1 min demo)

export default function PaymentStatusPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const autoPay = searchParams.get("auto_pay") === "true";

  const [isSnapOpen, setIsSnapOpen] = useState(autoPay);
  const [isStatusFetched, setIsStatusFetched] = useState(false);
  const [liveResult, setLiveResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const pollingRef = useRef<any>(null);
  const clockOffsetRef = useRef<number>(0);

  const updateClockOffset = (serverTimeStr?: string) => {
    if (!serverTimeStr) return;
    const serverTimeMs = new Date(serverTimeStr).getTime();
    const clientTimeMs = Date.now();
    const offset = serverTimeMs - clientTimeMs;
    clockOffsetRef.current = offset;
    console.log("[Payment] Calculated clock offset (ms):", offset);
  };

  const updateLocalOrderTimeout = (timeoutAt?: string) => {
    if (!timeoutAt) return;
    try {
      const orderStr = localStorage.getItem("divexplore_last_order_data");
      if (orderStr) {
        const order = JSON.parse(orderStr);
        if (order.timeout_at !== timeoutAt) {
          order.timeout_at = timeoutAt;
          localStorage.setItem("divexplore_last_order_data", JSON.stringify(order));
          console.log("[Payment] Local order timeout_at updated from server:", timeoutAt);
        }
      }
    } catch (e) {}
  };

  // Ambil dari state atau fallback ke localStorage dengan pengaman
  const paymentResult = useMemo(() => {
    try {
      if (location.state?.paymentResult) return location.state.paymentResult;

      // PRIORITAS 1: Data Live dari Server (Tampilkan secepat mungkin!)
      if (liveResult) {
        return liveResult;
      }

      // PRIORITAS 2: Data tersimpan di browser (Cache)
      const saved = localStorage.getItem("divexplore_last_payment");
      if (saved) {
        const parsed = JSON.parse(saved);
        const lastOrderStr = localStorage.getItem("divexplore_last_order_data");

        if (lastOrderStr) {
          const lastOrder = JSON.parse(lastOrderStr);
          // Hanya gunakan cache JIKA ID-nya benar-benar cocok (UUID-nya sama)
          if (parsed.order_id && parsed.order_id.startsWith(lastOrder.id)) {
            return parsed;
          }
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  }, [location.state, liveResult]);

  const lastSnapToken = localStorage.getItem("divexplore_last_snap_token");

  // Helper to extract VA and Bank Name - SUPER AGGRESSIVE DETECTION
  const paymentDetails = useMemo(() => {
    if (!paymentResult) return null;

    let bankName = "Metode Pembayaran";
    let vaNo = "";
    let qrUrl = "";

    let bankLogo = "";

    const mapLogo = (bankCode: string) => {
      if (!bankCode) return "";
      const b = bankCode.toLowerCase();
      if (b === "bca")
        return "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg";
      if (b === "bni")
        return "https://cdn3.iconfinder.com/data/icons/banks-in-indonesia-logo-badge/100/BNI-512.png";
      if (b === "bri")
        return "https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_2020.svg";
      if (b === "mandiri" || b === "echannel")
        return "https://upload.wikimedia.org/wikipedia/commons/a/a8/Mandiri_logo.svg";
      if (b === "permata" || b === "permata_va")
        return "https://upload.wikimedia.org/wikipedia/commons/3/38/PermataBank_Logo_2024.svg";
      if (b === "cimb")
        return "https://upload.wikimedia.org/wikipedia/commons/3/38/CIMB_Niaga_logo.svg";
      if (b === "danamon")
        return "https://upload.wikimedia.org/wikipedia/commons/1/14/Bank_Danamon_logo.svg";
      if (b === "gopay")
        return "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg";
      if (b === "qris")
        return "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg";
      if (b === "shopeepay")
        return "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg";
      if (b === "alfamart")
        return "https://upload.wikimedia.org/wikipedia/commons/8/86/Alfamart_logo.svg";
      if (b === "indomaret")
        return "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Indomaret.svg/320px-Indomaret.svg.png";
      if (b === "visa")
        return "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg";
      if (b === "mastercard")
        return "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg";
      return "";
    };

    // DETEKSI JENIS BANK
    if (paymentResult.va_numbers && paymentResult.va_numbers.length > 0) {
      const va = paymentResult.va_numbers[0];
      bankName = `BANK ${va.bank.toUpperCase()}`;
      vaNo = va.va_number;
      bankLogo = mapLogo(va.bank);
    } else if (paymentResult.permata_va_number) {
      bankName = "BANK PERMATA";
      vaNo = paymentResult.permata_va_number;
      bankLogo = mapLogo("permata");
    } else if (paymentResult.bill_key || paymentResult.biller_code) {
      bankName = "BANK MANDIRI";
      const biller = paymentResult.biller_code || "70012";
      vaNo = `${biller} - ${paymentResult.bill_key}`;
      bankLogo = mapLogo("mandiri");
    } else if (
      paymentResult.payment_type === "gopay" ||
      paymentResult.payment_type === "qris" ||
      paymentResult.payment_type === "shopeepay"
    ) {
      bankName = paymentResult.payment_type.toUpperCase();
      const qrAction = paymentResult.actions?.find(
        (a: any) => a.name === "generate-qr-code",
      );
      qrUrl = qrAction?.url || "";
      vaNo = "Silakan Scan QR Code / Buka Aplikasi";
      bankLogo = mapLogo(paymentResult.payment_type);
    } else if (paymentResult.payment_type === "credit_card") {
      bankName = paymentResult.bank
        ? `KARTU KREDIT ${paymentResult.bank.toUpperCase()}`
        : "KARTU KREDIT";
      vaNo = paymentResult.masked_card
        ? `**** **** **** ${paymentResult.masked_card.split("-")[1] || paymentResult.masked_card.slice(-4)}`
        : "Pembayaran Sedang Diproses";
      bankLogo = mapLogo(paymentResult.card_type || "visa");
    } else if (paymentResult.payment_type === "cstore") {
      let storeName = paymentResult.store;
      if (!storeName && paymentResult.payment_code) {
        // Alfamart payment codes generated by Midtrans always start with "39"
        if (paymentResult.payment_code.startsWith("39")) {
          storeName = "alfamart";
        } else {
          storeName = "indomaret";
        }
      }
      bankName = storeName
        ? (storeName === "alfamart" ? "ALFA GROUP / ALFAMART" : storeName.toUpperCase())
        : "MINIMARKET";
      vaNo = paymentResult.payment_code;
      bankLogo = mapLogo(storeName);
    } else if (paymentResult.payment_code) {
      bankName = "KODE PEMBAYARAN";
      vaNo = paymentResult.payment_code;
    }

    // SEARCHING AGRESSIVE (Jika vaNo masih kosong)
    if (!vaNo) {
      vaNo =
        paymentResult.va_number ||
        paymentResult.va_no ||
        paymentResult.bill_key ||
        paymentResult.payment_code ||
        "";
      if (paymentResult.bank) {
        bankName = `BANK ${paymentResult.bank.toUpperCase()}`;
        bankLogo = mapLogo(paymentResult.bank);
      }
    }

    return { bankName, vaNo, qrUrl, bankLogo };
  }, [paymentResult]);

  const { user } = useAuth();

  // Calculate initial status synchronously to prevent UI flicker
  const initialStatus = useMemo<StatusType>(() => {
    const raw = searchParams.get("status");
    if (
      ["pending", "success", "expired", "cancelled"].includes(raw as string)
    ) {
      return raw as StatusType;
    }

    // PRIORITAS 1: Cek status transaksi asli dari server / cache
    if (paymentResult?.transaction_status) {
      const ts = paymentResult.transaction_status.toLowerCase();
      if (
        ts === "settlement" ||
        ts === "capture" ||
        ts === "success" ||
        ts === "paid"
      ) {
        return "success";
      }
      if (
        ts === "expire" ||
        ts === "cancel" ||
        ts === "deny" ||
        ts === "cancelled" ||
        ts === "expired"
      ) {
        return "expired";
      }
      if (ts === "pending") {
        return "pending";
      }
    }

    let expiryMs = 0;
    try {
      const orderStr = localStorage.getItem("divexplore_last_order_data");
      if (orderStr) {
        const order = JSON.parse(orderStr);
        if (order.timeout_at) expiryMs = new Date(order.timeout_at).getTime();
      }
    } catch (e) {}

    // Fallback ke expiry_time dari Midtrans jika data pesanan internal tidak ada
    if (expiryMs === 0 && paymentResult?.expiry_time) {
      expiryMs = new Date(
        paymentResult.expiry_time.replace(" ", "T"),
      ).getTime();
    }

    if (expiryMs > 0 && (Date.now() + clockOffsetRef.current) > expiryMs) {
      return "expired";
    }
    return "pending";
  }, [searchParams, paymentResult]);

  // Preview switcher (dev helper shown as tabs)
  const [previewStatus, setPreviewStatus] = useState<StatusType>(initialStatus);

  // Sinkronkan status live dari server ke state previewStatus secara otomatis
  useEffect(() => {
    setPreviewStatus(initialStatus);
  }, [initialStatus]);

  // VA countdown (pending only)
  const [vaSeconds, setVaSeconds] = useState(0);

  useEffect(() => {
    const calculateDiff = () => {
      // PRIORITAS UTAMA & KONSISTEN: Gunakan timeout_at dari pesanan internal (Single Source of Truth)
      let expiryMs = 0;

      try {
        const orderStr = localStorage.getItem("divexplore_last_order_data");
        if (orderStr) {
          const order = JSON.parse(orderStr);
          if (order.timeout_at) {
            expiryMs = new Date(order.timeout_at).getTime();
          }
        }
      } catch (e) {}

      // Fallback ke expiry_time dari Midtrans jika data pesanan internal tidak ada
      if (expiryMs === 0 && paymentResult?.expiry_time) {
        const expiryStr = paymentResult.expiry_time.replace(" ", "T");
        expiryMs = new Date(expiryStr).getTime();
      }

      if (expiryMs > 0) {
        const correctedNow = Date.now() + clockOffsetRef.current;
        const diff = Math.max(0, Math.floor((expiryMs - correctedNow) / 1000));
        setVaSeconds(diff);
        if (diff <= 0)
          setPreviewStatus((prev) => (prev !== "expired" ? "expired" : prev));
      } else {
        // Hanya jika benar-benar tidak ada data, hitung mundur 1 detik
        setVaSeconds((s) => (s > 0 ? s - 1 : 0));
      }
    };

    calculateDiff(); // Eksekusi langsung tanpa nunggu 1 detik
    const t = setInterval(calculateDiff, 1000);
    return () => clearInterval(t);
  }, [paymentResult]);

  // Ambil data pembayaran terbaru dari server (dengan Polling)
  useEffect(() => {
    const fetchStatus = async () => {
      const lastOrderStr = localStorage.getItem("divexplore_last_order_data");
      if (!lastOrderStr) {
        setIsStatusFetched(true);
        return;
      }

      try {
        const order = JSON.parse(lastOrderStr);

        // Cek ke Midtrans via Backend
        const res = await api.get(`/api/orders/${order.id}/payment-status`);
        const midtransData = res.data?.data || res.data;

        if (midtransData) {
          if (midtransData.server_time) {
            updateClockOffset(midtransData.server_time);
          }
          if (midtransData.timeout_at) {
            updateLocalOrderTimeout(midtransData.timeout_at);
          }
        }

        if (
          midtransData &&
          midtransData.payment_type &&
          midtransData.payment_type !== "null"
        ) {
          console.log(
            "[Payment] Server has payment data:",
            midtransData.payment_type,
          );
          
          let mergedData = { ...midtransData, internal_order_id: order.id };
          try {
            const saved = localStorage.getItem("divexplore_last_payment");
            if (saved) {
              const parsedSaved = JSON.parse(saved);
              if (parsedSaved.payment_type === midtransData.payment_type) {
                mergedData = { ...parsedSaved, ...midtransData, internal_order_id: order.id };
              }
            }
          } catch (e) {}

          setLiveResult(mergedData);
          localStorage.setItem(
            "divexplore_last_payment",
            JSON.stringify(mergedData),
          );
          // Data ditemukan, hentikan polling
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (e) {
        console.warn("[Payment] Polling error:", e);
      } finally {
        setIsStatusFetched(true);
      }
    };

    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // LOGIKA AUTO-TRIGGER SNAP MIDTRANS
  useEffect(() => {
    // Tunggu sampai status benar-benar terambil (isStatusFetched)
    if (autoPay && lastSnapToken && window.snap && isStatusFetched) {
      // Jika hasil fetch menunjukkan sudah ada metode (VA/QRIS), JANGAN buka popup
      const hasPaymentMethod =
        liveResult?.payment_type ||
        (liveResult?.va_numbers && liveResult.va_numbers.length > 0) ||
        liveResult?.permata_va_number ||
        liveResult?.bill_key;

      if (hasPaymentMethod && hasPaymentMethod !== "null") {
        console.log(
          "[Payment] Skipping popup - method already exists:",
          hasPaymentMethod,
        );
        setIsSnapOpen(false);
        return;
      }

      console.log("[Payment] Opening Midtrans Snap Popup...");
      setIsSnapOpen(true);
      // Hapus auto_pay dari URL segera agar jika halaman direfresh, pop-up tidak terbuka otomatis lagi
      navigate("/payment-status?status=pending", { replace: true });
      window.snap.pay(lastSnapToken, {
        onSuccess: (result: any) => {
          console.log("[Payment] Success:", result);
          // HENTIKAN polling agar tidak menimpa data
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          localStorage.setItem(
            "divexplore_last_payment",
            JSON.stringify(result),
          );
          localStorage.removeItem("divexplore_last_snap_token");
          setLiveResult(result);
          setIsSnapOpen(false);
          setPreviewStatus("success");
        },
        onPending: (result: any) => {
          console.log("[Payment] Pending (user picked method):", result);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          localStorage.setItem(
            "divexplore_last_payment",
            JSON.stringify(result),
          );
          // JANGAN hapus token agar user bisa membukanya kembali jika menutup popup
          setLiveResult(result);
          setIsSnapOpen(false);
          setPreviewStatus("pending");
          // Hapus auto_pay dari URL agar refresh tidak buka popup lagi
          navigate("/payment-status?status=pending", { replace: true });
        },
        onError: (result: any) => {
          console.log("[Payment] Error:", result);
          setIsSnapOpen(false);
          localStorage.removeItem("divexplore_last_snap_token");
          alert("Pembayaran gagal!");
        },
        onClose: () => {
          console.log("[Payment] Popup closed by user");
          setIsSnapOpen(false);
          setPreviewStatus("pending");
        },
      });
    }
  }, [autoPay, lastSnapToken, navigate, isStatusFetched, liveResult]);

  const vaHrs = String(Math.floor(vaSeconds / 3600)).padStart(2, "0");
  const vaMin = String(Math.floor((vaSeconds % 3600) / 60)).padStart(2, "0");
  const vaSec = String(vaSeconds % 60).padStart(2, "0");

  const [copied, setCopied] = useState(false);
  const hasChosenMethod = !!(
    paymentDetails?.vaNo ||
    paymentDetails?.qrUrl ||
    (liveResult?.payment_type && liveResult?.payment_type !== "null")
  );

  const vaNumber =
    paymentDetails?.vaNo ||
    (isChecking
      ? "Menyinkronkan..."
      : hasChosenMethod
        ? "Tersedia"
        : "Belum Dipilih");
  const bankLabel =
    paymentDetails?.bankName ||
    (isChecking
      ? "Mengecek..."
      : hasChosenMethod
        ? "Online Payment"
        : "Metode Pembayaran");

  // Ambil ID pesanan dengan fallback super teliti
  const orderId = useMemo(() => {
    if (paymentResult?.order_id) return paymentResult.order_id;
    if (liveResult?.order_id) return liveResult.order_id;
    if (liveResult?.internal_order_id) return liveResult.internal_order_id;

    const saved = localStorage.getItem("divexplore_last_order_data");
    if (saved) return JSON.parse(saved).id;

    return "Memuat ID Pesanan...";
  }, [paymentResult, liveResult]);

  // Read cart data
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useLayoutEffect(() => {
    // Utamakan ambil dari data pesanan terakhir yang baru dibuat
    const lastOrder = localStorage.getItem("divexplore_last_order_data");
    const savedCart = localStorage.getItem("divexplore_cart");

    if (lastOrder) {
      try {
        const order = JSON.parse(lastOrder);
        if (order && typeof order === "object") {
          // Transform data order backend ke format UI CartItem jika perlu
          const items =
            order.items?.map((it: any) => ({
              name: it.product?.nama_produk || "Produk",
              type: it.product?.vendor?.kategori || "Destinasi",
              location: it.product?.lokasi || "Indonesia",
              price: Number(it.harga_per_unit || it.harga_satuan || 0),
              quantity: it.qty || 1,
              image: it.product?.thumbnail_url || "",
              addons: it.addons || [],
            })) || [];
          if (items.length > 0) {
            setCartItems(items);
            return; // Berhasil ambil dari order
          }
        }
      } catch (e) {
        console.error("Gagal parse last order:", e);
      }
    }

    // Fallback ke keranjang jika order data bermasalah
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      } catch (error) {
        console.error("Failed to parse cart data:", error);
      }
    }
  }, []);

  const firstItem = useMemo(
    () =>
      cartItems[0] || {
        name: "Gili Trawangan Snorkeling Experience",
        type: "Snorkeling",
        location: "Gili Trawangan, Lombok",
        price: 350000,
        quantity: 2,
        image:
          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80",
        addons: [],
      },
    [cartItems],
  );

  const addonTotal = useMemo(
    () =>
      (firstItem.addons || []).reduce(
        (s: number, a: { price: number }) => s + a.price * firstItem.quantity,
        0,
      ),
    [firstItem],
  );
  const subtotal = useMemo(
    () => firstItem.price * firstItem.quantity + addonTotal,
    [firstItem.price, firstItem.quantity, addonTotal],
  );
  const taxes = useMemo(() => subtotal * 0.11, [subtotal]);
  const total = useMemo(() => subtotal + taxes, [subtotal, taxes]);

  // DATA ORDER ASLI DARI DATABASE (DITERIMA SETELAH CHECKOUT)
  const actualOrder = useMemo(() => {
    try {
      const orderStr = localStorage.getItem("divexplore_last_order_data");
      return orderStr ? JSON.parse(orderStr) : null;
    } catch (e) {
      return null;
    }
  }, []);

  // Email Notification State
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [isPopupClosing, setIsPopupClosing] = useState(false);

  useEffect(() => {
    if (previewStatus === "success" && !isEmailSent) {
      const savedCustomer = localStorage.getItem("divexplore_customer");
      const customer = savedCustomer
        ? JSON.parse(savedCustomer)
        : { email: user?.email, name: user?.nama_lengkap };

      // Send Actual Email via EmailJS
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        // eslint-disable-next-line
        setIsEmailSent(true);
        setShowEmailPopup(true);
        setIsPopupClosing(false);
        console.log(
          "EmailJS settings found, but actual send is currently commented out for demo.",
        );
      } else {
        // Fallback simulasi jika .env belum diisi
        setTimeout(() => {
          setIsEmailSent(true);
          setShowEmailPopup(true);
          setIsPopupClosing(false);
          console.log("Simulated Email sent to:", customer.email);
        }, 1500);
      }
    }
  }, [previewStatus, isEmailSent, user?.email, user?.nama_lengkap]);

  useEffect(() => {
    if (!showEmailPopup) return;
    const timer = setTimeout(() => setIsPopupClosing(true), 5000);
    return () => clearTimeout(timer);
  }, [showEmailPopup]);

  useEffect(() => {
    if (!isPopupClosing) return;
    const timer = setTimeout(() => {
      setShowEmailPopup(false);
      setIsPopupClosing(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [isPopupClosing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(vaNumber.replace(/\s/g, ""));
    setCopied(true);
    Swal.fire({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      icon: "success",
      title: "Nomor VA Tersalin",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckStatus = async () => {
    if (!hasChosenMethod) {
      Swal.fire({
        title: "Metode Pembayaran Belum Dipilih",
        text: "Silakan pilih metode pembayaran Anda terlebih dahulu menggunakan tombol 'Pilih Metode Pembayaran'.",
        icon: "warning",
        confirmButtonText: "Pilih Sekarang",
        confirmButtonColor: "#f59e0b",
      }).then((result) => {
        if (result.isConfirmed) {
          handleReopenSnap(false);
        }
      });
      return;
    }

    Swal.fire({
      title: "Menyinkronkan...",
      text: "Mengecek status pembayaran Anda ke Midtrans",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setIsChecking(true);

    try {
      const lastOrderStr = localStorage.getItem("divexplore_last_order_data");
      if (!lastOrderStr) {
        Swal.fire("Error", "Data pesanan tidak ditemukan di browser.", "error");
        setIsChecking(false);
        return;
      }

      const order = JSON.parse(lastOrderStr);

      // Panggil API status pembayaran asli (Sinkronisasi Midtrans -> Supabase)
      const res = await api.get(`/api/orders/${order.id}/payment-status`);

      // Deteksi struktur data secara cerdas (Axios interceptor friendly)
      const midtransData = res.data?.data || res.data;

      // Jika benar-benar tidak ada data atau status_code 404 asli dari Midtrans tanpa fallback
      if (
        !midtransData ||
        (midtransData.status_code === "404" && !midtransData.is_fallback)
      ) {
        Swal.fire(
          "Info",
          "Transaksi belum terdaftar di Midtrans. Silakan selesaikan pembayaran di pop-up.",
          "info",
        );
        setIsChecking(false);
        return;
      }

      // Update state live dengan data VALID dari server
      setLiveResult({ ...midtransData, internal_order_id: order.id });
      const currentStatus = midtransData.transaction_status?.toLowerCase();

      if (
        currentStatus === "settlement" ||
        currentStatus === "capture" ||
        currentStatus === "success" ||
        currentStatus === "paid"
      ) {
        Swal.fire({
          title: "Berhasil!",
          text: "Pembayaran Anda telah kami terima.",
          icon: "success",
          confirmButtonText: "Lanjutkan",
          confirmButtonColor: "#10b981",
        }).then(() => {
          setPreviewStatus("success");
        });
      } else if (currentStatus === "pending") {
        setPreviewStatus("pending");
        Swal.fire({
          title: "Menunggu Pembayaran",
          text: "Kami belum menerima pembayaran Anda. Silakan selesaikan transaksi sesuai instruksi.",
          icon: "warning",
          confirmButtonText: "Mengerti",
          confirmButtonColor: "#f59e0b",
        });
      } else if (
        currentStatus === "expire" ||
        currentStatus === "cancel" ||
        currentStatus === "deny" ||
        currentStatus === "cancelled" ||
        currentStatus === "expired"
      ) {
        setPreviewStatus("expired");
        Swal.fire(
          "Transaksi Gagal",
          `Status: ${(currentStatus || "").toUpperCase()}`,
          "error",
        );
      } else {
        Swal.fire(
          "Info",
          `Status Pembayaran: ${(currentStatus || "").toUpperCase()}`,
          "info",
        );
      }
    } catch (e: any) {
      console.error("[Payment] Sync Error:", e);
      const errorMsg =
        e.response?.data?.message || e.message || "Gagal menghubungi server";
      Swal.fire("Gagal Sinkron", errorMsg, "error");
    } finally {
      setIsChecking(false);
    }
  };

  const handleReopenSnap = async (force: boolean = false) => {
    let token = force ? null : lastSnapToken;

    // Jika token tidak ada di localStorage, atau jika dipaksa ganti metode, ambil secara dinamis dari backend!
    if (!token) {
      try {
        Swal.fire({
          title: force ? "Menyiapkan Metode Baru..." : "Memuat Pembayaran...",
          text: "Sedang menghubungi Midtrans...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const savedOrderId = orderId;
        if (!savedOrderId) throw new Error("ID Pesanan tidak ditemukan.");

        // Bersihkan ID jika berupa Midtrans Order ID (UUID-Timestamp) agar menjadi UUID murni
        const cleanOrderId = savedOrderId.includes("-") && savedOrderId.length > 36
          ? savedOrderId.substring(0, 36)
          : savedOrderId;

        const response = await api.get(`/api/orders/${cleanOrderId}/snap-token${force ? "?force=true" : ""}`);
        const responseData = response.data?.data || response.data;
        token = responseData?.snap_token;

        if (responseData) {
          if (responseData.server_time) {
            updateClockOffset(responseData.server_time);
          }
          if (responseData.timeout_at) {
            updateLocalOrderTimeout(responseData.timeout_at);
          }
        }

        if (token) {
          localStorage.setItem("divexplore_last_snap_token", token);

          Swal.close();
        } else {
          throw new Error("Gagal mengambil token pembayaran dari server.");
        }
      } catch (err: any) {
        console.error("[Payment] Fetch Snap Token Error:", err);
        Swal.fire(
          "Gagal Memuat",
          err.response?.data?.message || err.message || "Gagal mengambil token dari server",
          "error"
        );
        return;
      }
    }

    if (token && window.snap) {
      console.log("[Payment] Reopening Midtrans Snap Popup...");
      setIsSnapOpen(true);
      window.snap.pay(token, {
        onSuccess: (result: any) => {
          console.log("[Payment] Success:", result);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          localStorage.setItem(
            "divexplore_last_payment",
            JSON.stringify(result),
          );
          localStorage.removeItem("divexplore_last_snap_token");
          setLiveResult(result);
          setIsSnapOpen(false);
          setPreviewStatus("success");
        },
        onPending: (result: any) => {
          console.log("[Payment] Pending (user picked method):", result);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          localStorage.setItem(
            "divexplore_last_payment",
            JSON.stringify(result),
          );
          // JANGAN hapus token agar user bisa membukanya kembali jika menutup popup
          setLiveResult(result);
          setIsSnapOpen(false);
          setPreviewStatus("pending");
          // Hapus auto_pay dari URL agar refresh tidak buka popup lagi
          navigate("/payment-status?status=pending", { replace: true });
        },
        onError: (result: any) => {
          console.log("[Payment] Error:", result);
          setIsSnapOpen(false);
          localStorage.removeItem("divexplore_last_snap_token");
          Swal.fire("Pembayaran Gagal", "Transaksi Anda dibatalkan atau ditolak.", "error");
        },
        onClose: () => {
          console.log("[Payment] Popup closed by user");
          setIsSnapOpen(false);
          setPreviewStatus("pending");
        },
      });
    } else {
      Swal.fire(
        "Token Tidak Ditemukan",
        "Silakan lakukan pemesanan ulang melalui riwayat pesanan jika token kedaluwarsa.",
        "warning"
      );
    }
  };

  const handleCancelOrder = async () => {
    const result = await Swal.fire({
      title: "Batalkan Pesanan?",
      text: "Tindakan ini tidak dapat dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Batalkan!",
      cancelButtonText: "Kembali",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Membatalkan...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const lastOrderStr = localStorage.getItem("divexplore_last_order_data");
        if (!lastOrderStr) throw new Error("Data pesanan tidak ditemukan.");

        const order = JSON.parse(lastOrderStr);
        await api.post(`/api/orders/${order.id}/cancel`);

        // Bersihkan cache agar tidak muncul pop-up lagi
        localStorage.removeItem("divexplore_last_payment");
        localStorage.removeItem("divexplore_last_order_data");
        localStorage.removeItem("divexplore_last_snap_token");

        await Swal.fire({
          title: "Dibatalkan",
          text: "Pesanan Anda telah berhasil dibatalkan.",
          icon: "success",
        });

        navigate("/orders");
      } catch (e: any) {
        console.error("[Payment] Cancel Error:", e);
        Swal.fire(
          "Gagal",
          e.response?.data?.message || "Gagal membatalkan pesanan.",
          "error",
        );
      }
    }
  };

  return (
    <div className={styles.container}>
      {showEmailPopup && previewStatus === "success" && (
        <div
          className={`${styles.emailNotifPopup} ${isPopupClosing ? styles.hideEmailNotifPopup : ""}`}
        >
          Email konfirmasi pembayaran berhasil dikirim!
        </div>
      )}
      {/* Header */}
      <Header />

      {/* Steps - Hanya muncul jika snap sudah tertutup */}
      {!isSnapOpen && (
        <div className={styles.stepsBar}>
          <div className={styles.step}>
            <div className={`${styles.stepCircle} ${styles.stepDone}`}>
              <CheckCircle2 size={16} />
            </div>
            <span className={styles.stepLabel}>Rencana Perjalanan</span>
          </div>
          <div className={`${styles.stepLine} ${styles.stepLineDone}`} />
          <div className={styles.step}>
            <div className={`${styles.stepCircle} ${styles.stepDone}`}>
              <CheckCircle2 size={16} />
            </div>
            <span className={styles.stepLabel}>Checkout</span>
          </div>
          <div
            className={`${styles.stepLine} ${previewStatus === "success" ? styles.stepLineDone : ""}`}
          />
          <div className={styles.step}>
            <div
              className={`${styles.stepCircle} ${
                previewStatus === "success"
                  ? styles.stepDone
                  : previewStatus === "pending"
                    ? styles.stepActive
                    : styles.stepExpired
              }`}
            >
              {previewStatus === "success" ? (
                <CheckCircle2 size={16} />
              ) : previewStatus === "expired" ? (
                <XCircle size={16} />
              ) : (
                "3"
              )}
            </div>
            <span
              className={`${styles.stepLabel} ${previewStatus === "success" ? styles.stepLabelDone : previewStatus === "pending" ? styles.stepLabelActive : styles.stepLabelExpired}`}
            >
              Pembayaran
            </span>
          </div>
        </div>
      )}

      {/* Main Card Area */}
      <main className={styles.main}>
        {/* Loading Overlay saat Snap Terbuka */}
        {isSnapOpen && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinnerWrap}>
              <RefreshCw
                size={40}
                className={styles.spinIcon}
                color="#0ea5e9"
              />
            </div>
            <p>Menyiapkan Pembayaran Aman...</p>
          </div>
        )}

        {/* Konten Utama - Hanya muncul jika snap sudah tertutup DAN status sudah siap */}
        {!isSnapOpen && isStatusFetched ? (
          <>
            {/* ── PENDING ── */}
            {previewStatus === "pending" && (
              <div className={`${styles.statusCard} ${styles.pendingCard}`}>
                <div className={styles.statusIcon}>
                  <div className={styles.pendingIconCircle}>
                    <Clock size={36} color="#f59e0b" />
                  </div>
                </div>
                <div
                  className={`${styles.countdownBadge} ${vaSeconds < 3600 ? styles.urgentBadge : ""}`}
                  style={{ marginBottom: "12px" }}
                >
                  <AlertTriangle size={14} />
                  Selesaikan dalam: {vaHrs}:{vaMin}:{vaSec}
                </div>

                <h1 className={styles.statusTitle}>Menunggu Pembayaran</h1>
                <p className={styles.orderId}>Order ID: {orderId}</p>

                <div
                  style={{
                    width: "100%",
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "16px",
                    overflow: "hidden",
                    margin: "16px 0 24px",
                  }}
                >
                  {/* Total Tagihan */}
                  <div
                    style={{
                      padding: "20px",
                      borderBottom: "1px solid #334155",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ textAlign: "left" }}>
                      <p
                        style={{
                          margin: "0 0 6px",
                          fontSize: "13px",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Wallet size={14} /> Total Pembayaran
                      </p>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "24px",
                          fontWeight: 800,
                          color: "#ffffff",
                        }}
                      >
                        Rp{" "}
                        {Math.round(
                          Number(
                            actualOrder?.total_pembayaran ||
                              paymentResult?.gross_amount ||
                              liveResult?.gross_amount ||
                              total,
                          ),
                        ).toLocaleString("id-ID")}
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          Math.round(
                            Number(
                              actualOrder?.total_pembayaran ||
                                paymentResult?.gross_amount ||
                                liveResult?.gross_amount ||
                                total,
                            ),
                          ).toString(),
                        );
                        Swal.fire({
                          toast: true,
                          position: "top-end",
                          showConfirmButton: false,
                          timer: 1500,
                          icon: "success",
                          title: "Tersalin",
                        });
                      }}
                      style={{
                        background: "rgba(14,165,233,0.1)",
                        color: "#0ea5e9",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Copy size={14} /> Salin
                    </button>
                  </div>

                  {/* Metode Pembayaran & VA */}
                  <div
                    style={{
                      padding: "20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ textAlign: "left" }}>
                      <p
                        style={{
                          margin: "0 0 6px",
                          fontSize: "13px",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {paymentDetails?.bankLogo ? (
                          <img
                            src={paymentDetails.bankLogo}
                            alt={bankLabel}
                            style={{ height: "14px", objectFit: "contain" }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = document.createElement("span");
                              fallback.innerHTML =
                                '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 20v-7.826a4 4 0 0 0-1.253-2.908l-7.373-6.968a2 2 0 0 0-2.748 0L3.253 9.266A4 4 0 0 0 2 12.174V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/><path d="M9 22v-4h6v4"/></svg>';
                              e.currentTarget.parentNode?.insertBefore(
                                fallback,
                                e.currentTarget,
                              );
                            }}
                          />
                        ) : (
                          <Building size={14} />
                        )}
                        {bankLabel}
                      </p>
                      {paymentDetails?.qrUrl ? (
                        <div style={{ marginTop: "10px" }}>
                          <img
                            src={paymentDetails.qrUrl}
                            alt="QRIS"
                            style={{
                              width: "180px",
                              height: "180px",
                              borderRadius: "10px",
                              background: "white",
                              padding: "10px",
                            }}
                          />
                        </div>
                      ) : (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "20px",
                            fontWeight: 700,
                            letterSpacing: "1px",
                            color: "white",
                            fontFamily: "monospace",
                          }}
                        >
                          {vaNumber}
                        </p>
                      )}
                    </div>
                    {!paymentDetails?.qrUrl && hasChosenMethod && (
                      <button
                        onClick={handleCopy}
                        style={{
                          background: "rgba(14,165,233,0.1)",
                          color: "#0ea5e9",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontWeight: 600,
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Copy size={14} /> {copied ? "Disalin" : "Salin"}
                      </button>
                    )}
                  </div>
                </div>

                {!hasChosenMethod ? (
                  <>
                    <button
                      className={styles.primaryBtn}
                      onClick={handleCheckStatus}
                      disabled={isChecking}
                      style={{ marginBottom: "12px" }}
                    >
                      <RefreshCw
                        size={16}
                        className={isChecking ? styles.spin : ""}
                      />
                      {isChecking ? "Mengecek Status..." : "Cek Status Pembayaran"}
                    </button>

                    <button
                      className={styles.changeMethodBtn}
                      onClick={() => handleReopenSnap(false)}
                      style={{ marginBottom: "12px" }}
                    >
                      <Wallet size={14} />
                      Pilih Metode Pembayaran
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={styles.primaryBtn}
                      onClick={handleCheckStatus}
                      disabled={isChecking}
                    >
                      <RefreshCw
                        size={16}
                        className={isChecking ? styles.spin : ""}
                      />
                      {isChecking ? "Mengecek Status..." : "Cek Status Pembayaran"}
                    </button>

                    <button
                      className={styles.instructionBtn}
                      onClick={() => handleReopenSnap(false)}
                    >
                      <Eye size={14} />
                      Lihat Instruksi Pembayaran
                    </button>

                    <button
                      className={styles.changeMethodBtn}
                      onClick={() => handleReopenSnap(true)}
                    >
                      <CreditCard size={14} />
                      Ganti Metode Pembayaran
                    </button>
                  </>
                )}

                <button className={styles.cancelBtn} onClick={handleCancelOrder}>
                  Batalkan Pesanan
                </button>

                <div className={styles.secureNote}>
                  <Shield size={14} color="#10b981" />
                  <span>Transaksi aman & terenkripsi</span>
                </div>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {previewStatus === "success" && (
              <div className={`${styles.statusCard} ${styles.successCard}`}>
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      width: "88px",
                      height: "88px",
                      borderRadius: "50%",
                      background: "rgba(16, 185, 129, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        background: "#10b981",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)",
                      }}
                    >
                      <CheckCircle2 size={36} color="#ffffff" />
                    </div>
                  </div>
                </div>

                <h1
                  className={styles.statusTitle}
                  style={{ marginBottom: "8px", fontSize: "24px" }}
                >
                  Pembayaran Berhasil!
                </h1>
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  Total Pembayaran
                </p>
                <h2
                  style={{
                    fontSize: "36px",
                    fontWeight: 800,
                    color: "#f8fafc",
                    margin: "0 0 20px 0",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Rp{" "}
                  {Math.round(
                    Number(actualOrder?.total_pembayaran || total),
                  ).toLocaleString("id-ID")}
                </h2>

                <div
                  className={styles.pointsBadge}
                  style={{
                    margin: "0 auto 32px auto",
                    padding: "6px 16px",
                    fontSize: "13px",
                  }}
                >
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  Dapat +350 Poin
                </div>

                {/* Receipt Box */}
                <div
                  style={{
                    background: "#1e293b",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "32px",
                    textAlign: "left",
                    border: "1px solid #334155",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                      fontSize: "13px",
                      gap: "16px",
                    }}
                  >
                    <span style={{ color: "#94a3b8", flexShrink: 0 }}>
                      Order ID
                    </span>
                    <span
                      style={{
                        color: "#f8fafc",
                        fontWeight: 600,
                        textAlign: "right",
                        wordBreak: "break-all",
                      }}
                    >
                      {orderId}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                      fontSize: "13px",
                      gap: "16px",
                    }}
                  >
                    <span style={{ color: "#94a3b8", flexShrink: 0 }}>
                      Nama Pemesan
                    </span>
                    <span
                      style={{
                        color: "#f8fafc",
                        fontWeight: 600,
                        textAlign: "right",
                        wordBreak: "break-all",
                      }}
                    >
                      {actualOrder?.user_info?.nama ||
                        JSON.parse(
                          localStorage.getItem("divexplore_customer") || "{}",
                        ).name ||
                        user?.nama_lengkap ||
                        "Guest"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#94a3b8" }}>Metode Pembayaran</span>
                    <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                      {paymentDetails?.bankName || "Terdeteksi Otomatis"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "20px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#94a3b8" }}>Waktu Transaksi</span>
                    <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                      {new Date().toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div
                    style={{
                      borderTop: "1px dashed #334155",
                      margin: "0 -20px 20px -20px",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "-10px",
                        left: "-10px",
                        width: "20px",
                        height: "20px",
                        background: "#0f172a",
                        borderRadius: "50%",
                        borderRight: "1px solid #334155",
                      }}
                    ></div>
                    <div
                      style={{
                        position: "absolute",
                        top: "-10px",
                        right: "-10px",
                        width: "20px",
                        height: "20px",
                        background: "#0f172a",
                        borderRadius: "50%",
                        borderLeft: "1px solid #334155",
                      }}
                    ></div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: "12px",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontWeight: 600,
                      }}
                    >
                      Detail Pembelian
                    </p>

                    {(() => {
                      const items = actualOrder?.items || cartItems || [];
                      if (items.length === 0) {
                        return (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <img
                              src={firstItem.image}
                              alt="Item"
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "8px",
                                objectFit: "cover",
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#f8fafc",
                                }}
                              >
                                {firstItem.name}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "11px",
                                  color: "#94a3b8",
                                }}
                              >
                                {firstItem.quantity}x • Rp{" "}
                                {firstItem.price.toLocaleString("id-ID")}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return items.map((item: any, idx: number) => {
                        const price = item.price || item.harga || 0;
                        const quantity = item.quantity || item.qty || 1;
                        return (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              paddingBottom:
                                idx < items.length - 1 ? "12px" : 0,
                              borderBottom:
                                idx < items.length - 1
                                  ? "1px dashed #334155"
                                  : "none",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "12px",
                              }}
                            >
                              <img
                                src={
                                  item.image ||
                                  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80"
                                }
                                alt={item.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src =
                                    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80";
                                }}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "8px",
                                  objectFit: "cover",
                                  flexShrink: 0,
                                  marginTop: "2px",
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    color: "#f8fafc",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {item.name || item.product?.nama_produk}
                                </p>
                                <p
                                  style={{
                                    margin: "2px 0 0",
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                  }}
                                >
                                  {quantity}x • Rp{" "}
                                  {Number(price).toLocaleString("id-ID")}
                                </p>
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#e2e8f0",
                                  flexShrink: 0,
                                  marginTop: "2px",
                                }}
                              >
                                Rp {(price * quantity).toLocaleString("id-ID")}
                              </div>
                            </div>

                            {/* Render Addons in Detail */}
                            {item.addons && item.addons.length > 0 && (
                              <div
                                style={{
                                  paddingLeft: "52px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
                                }}
                              >
                                {item.addons.map(
                                  (addon: any, addIdx: number) => {
                                    const addonPrice =
                                      addon.price || addon.harga || 0;
                                    const addonQty = addon.quantity || quantity;
                                    return (
                                      <div
                                        key={addIdx}
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          fontSize: "11px",
                                          color: "#94a3b8",
                                        }}
                                      >
                                        <span>
                                          + {addon.name || addon.nama_addon} (
                                          {addonQty}x)
                                        </span>
                                        <span>
                                          Rp{" "}
                                          {(
                                            addonPrice * addonQty
                                          ).toLocaleString("id-ID")}
                                        </span>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div
                  style={{ display: "flex", gap: "12px", flexDirection: "row" }}
                >
                  <button
                    className={styles.ghostBtnSuccess}
                    onClick={() => navigate("/")}
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      padding: "10px 16px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <ArrowLeft size={16} />
                    Kembali
                  </button>
                  <button
                    className={styles.primaryBtnSuccess}
                    onClick={() => navigate("/orders")}
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      padding: "10px 16px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <ShoppingBag size={16} />
                    Lihat Pesanan
                  </button>
                </div>
              </div>
            )}

            {/* ── EXPIRED / CANCELLED ── */}
            {(previewStatus === "expired" || previewStatus === "cancelled") && (
              <div className={`${styles.statusCard} ${styles.expiredCard}`}>
                <div className={styles.statusIcon}>
                  <div className={styles.expiredIconCircle}>
                    <XCircle size={40} color="#ef4444" />
                  </div>
                </div>
                <h1 className={styles.statusTitle}>
                  {previewStatus === "expired"
                    ? "Waktu Pembayaran Habis"
                    : "Pesanan Dibatalkan"}
                </h1>
                <p className={styles.orderId} style={{ marginBottom: "12px" }}>
                  Order ID: {orderId}
                </p>

                <p className={styles.expiredDesc}>
                  {previewStatus === "expired"
                    ? "Pembayaran Anda belum kami terima karena melebihi batas waktu 15 menit."
                    : "Pesanan ini telah dibatalkan oleh Anda atau sistem otomatis."}
                </p>

                {/* Voided Receipt UX */}
                <div
                  style={{
                    width: "100%",
                    background: "rgba(30, 41, 59, 0.5)",
                    border: "1px dashed #334155",
                    borderRadius: "16px",
                    padding: "16px",
                    marginBottom: "24px",
                    opacity: 0.8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <img
                      src={firstItem.image}
                      alt="Order"
                      style={{
                        width: "56px",
                        height: "52px",
                        borderRadius: "10px",
                        objectFit: "cover",
                        filter: "grayscale(100%) opacity(70%)",
                      }}
                    />
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          textDecoration: "line-through",
                        }}
                      >
                        {actualOrder?.orderItems?.[0]?.product?.nama_produk ||
                          actualOrder?.items?.[0]?.name ||
                          firstItem.name}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#64748b",
                        }}
                      >
                        Rp{" "}
                        {Math.round(
                          Number(actualOrder?.total_pembayaran || total),
                        ).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      {previewStatus === "expired"
                        ? "KEDALUWARSA"
                        : "DIBATALKAN"}
                    </div>
                  </div>
                </div>

                <button
                  className={styles.primaryBtn}
                  onClick={() => navigate("/catalog")}
                >
                  <RefreshCw size={15} style={{ marginRight: "4px" }} />
                  Pesan Kembali
                </button>
                <button
                  className={styles.ghostBtn}
                  onClick={() => navigate("/orders")}
                >
                  <ShoppingBag size={15} />
                  Lihat Riwayat Pesanan
                </button>
              </div>
            )}
          </>
        ) : (
          !isSnapOpen && (
            <div className={styles.loadingOverlay}>
              <RefreshCw
                size={30}
                className={styles.spinIcon}
                color="#0ea5e9"
              />
              <p>Sinkronisasi data pembayaran...</p>
            </div>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
