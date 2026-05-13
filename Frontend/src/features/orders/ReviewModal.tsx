import React, { useState } from 'react';
import { Star, X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../utils/api';
import styles from './ReviewModal.module.css';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  productId: string;
  productName: string;
  onSuccess: () => void;
}

export default function ReviewModal({ isOpen, onClose, orderId, productId, productName, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      await api.post(`/api/reviews/${orderId}`, {
        product_id: productId,
        rating,
        komentar: comment
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
        setComment('');
        setRating(5);
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal mengirim ulasan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        {!success ? (
          <>
            <h2 className={styles.title}>Beri Ulasan</h2>
            <p className={styles.subtitle}>Bagaimana pengalaman Anda dengan <strong>{productName}</strong>?</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.ratingSection}>
                <p className={styles.label}>Rating Produk</p>
                <div className={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={styles.starBtn}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                    >
                      <Star 
                        size={32} 
                        fill={(hover || rating) >= star ? "#f59e0b" : "none"} 
                        color={(hover || rating) >= star ? "#f59e0b" : "#94a3b8"} 
                        className={styles.starIcon}
                      />
                    </button>
                  ))}
                </div>
                <span className={styles.ratingText}>
                  {rating === 5 ? 'Luar Biasa' : rating === 4 ? 'Sangat Baik' : rating === 3 ? 'Cukup' : rating === 2 ? 'Buruk' : rating === 1 ? 'Sangat Buruk' : 'Pilih Rating'}
                </span>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Komentar (Opsional)</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Ceritakan pengalaman Anda menggunakan produk ini..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                />
                <div className={styles.charCount}>{comment.length}/500</div>
              </div>

              {error && (
                <div className={styles.errorBox}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                className={styles.submitBtn} 
                disabled={loading || rating === 0}
              >
                {loading ? 'Mengirim...' : (
                  <>
                    <Send size={18} /> Kirim Ulasan
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={48} color="#10b981" />
            </div>
            <h2 className={styles.successTitle}>Ulasan Terkirim!</h2>
            <p className={styles.successDesc}>Terima kasih atas ulasan Anda. Masukan Anda sangat berarti bagi kami dan vendor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
