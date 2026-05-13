import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Hotspot3DPage from '../../features/dashboard/Hotspot3DPage';
import LoginPage from '../../features/auth/LoginPage';
import ProductDetailPage from '../../features/dashboard/ProductDetailPage';
import CartPage from '../../features/cart/CartPage';
import CatalogPage from '../../features/catalog/CatalogPage';
import CheckoutPage from '../../features/checkout/CheckoutPage';
import PaymentStatusPage from '../../features/checkout/PaymentStatusPage';
import OrderHistoryPage from '../../features/orders/OrderHistoryPage';
import RejectedOrderPage from '../../features/orders/RejectedOrderPage';
import ReviewPage from '../../features/orders/ReviewPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hotspot3DPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment-status" element={<PaymentStatusPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/rejected-order" element={<RejectedOrderPage />} />
        <Route path="/review" element={<ReviewPage />} />
      </Routes>
    </BrowserRouter>
  );
}
