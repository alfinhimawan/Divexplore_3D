
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Hotspot3DPage from '../../features/dashboard/Hotspot3DPage';
import LoginPage from '../../features/auth/LoginPage';
import ProductDetailPage from '../../features/dashboard/ProductDetailPage';
import CartPage from '../../features/cart/CartPage';
import CatalogPage from '../../features/catalog/CatalogPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hotspot3DPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/product" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
      </Routes>
    </BrowserRouter>
  );
}
