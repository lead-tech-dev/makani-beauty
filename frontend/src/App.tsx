import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { initGtm } from "./lib/gtm";
import { trackPageView } from "./lib/analytics";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { CookieConsentProvider } from "./context/CookieConsentContext";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import CartDrawer from "./components/CartDrawer/CartDrawer";
import CookieBanner from "./components/CookieBanner/CookieBanner";
import WhatsAppButton from "./components/WhatsAppButton/WhatsAppButton";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Home from "./pages/Home";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Brands from "./pages/Brands";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import Account from "./pages/Account";
import AccountProfile from "./pages/AccountProfile";
import Addresses from "./pages/Addresses";
import Favorites from "./pages/Favorites";
import CheckoutLayout from "./pages/checkout/CheckoutLayout";
import CheckoutCart from "./pages/checkout/CheckoutCart";
import CheckoutShipping from "./pages/checkout/CheckoutShipping";
import CheckoutPayment from "./pages/checkout/CheckoutPayment";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderPayment from "./pages/OrderPayment";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import LegalPage from "./pages/legal/LegalPage";
import Faq from "./pages/legal/Faq";
import SousTraitants from "./pages/legal/SousTraitants";
import SearchResults from "./pages/SearchResults";
import NewsletterConfirm from "./pages/NewsletterConfirm";
import NewsletterUnsubscribe from "./pages/NewsletterUnsubscribe";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminProductWizard from "./pages/admin/AdminProductWizard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminReturns from "./pages/admin/AdminReturns";
import AdminReturnDetail from "./pages/admin/AdminReturnDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import AdminShippingZones from "./pages/admin/AdminShippingZones";
import AdminLegalPages from "./pages/admin/AdminLegalPages";
import AdminLegalPageEdit from "./pages/admin/AdminLegalPageEdit";
import AdminSubProcessors from "./pages/admin/AdminSubProcessors";
import AdminDeletionRequests from "./pages/admin/AdminDeletionRequests";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

const Shell = () => {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => { initGtm(); }, []);
  useEffect(() => {
    trackPageView(pathname, document.title);
  }, [pathname]);

  return (
    <>
      {!isAdmin && <Header />}
      {!isAdmin && <CartDrawer />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:slug" element={<CollectionDetail />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cgv" element={<LegalPage slug="cgv" />} />
          <Route path="/mentions-legales" element={<LegalPage slug="mentions-legales" />} />
          <Route path="/confidentialite" element={<LegalPage slug="confidentialite" />} />
          <Route path="/livraison-retours" element={<LegalPage slug="livraison-retours" />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/sous-traitants" element={<SousTraitants />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/newsletter/confirm" element={<NewsletterConfirm />} />
          <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          >
            <Route index element={<AccountProfile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="favorites" element={<Favorites />} />
          </Route>
          <Route
            path="/account/orders/:id/pay"
            element={
              <ProtectedRoute>
                <OrderPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CheckoutCart />} />
            <Route path="cart" element={<CheckoutCart />} />
            <Route path="shipping" element={<CheckoutShipping />} />
            <Route path="payment" element={<CheckoutPayment />} />
          </Route>
          <Route
            path="/order-confirmation/:id"
            element={
              <ProtectedRoute>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductWizard />} />
            <Route path="products/:id" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="returns" element={<AdminReturns />} />
            <Route path="returns/:id" element={<AdminReturnDetail />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="promo-codes" element={<AdminPromoCodes />} />
            <Route path="shipping-zones" element={<AdminShippingZones />} />
            <Route path="legal-pages" element={<AdminLegalPages />} />
            <Route path="legal-pages/:slug" element={<AdminLegalPageEdit />} />
            <Route path="sub-processors" element={<AdminSubProcessors />} />
            <Route path="deletion-requests" element={<AdminDeletionRequests />} />
          </Route>
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <CookieBanner />}
      {!isAdmin && <WhatsAppButton />}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <CookieConsentProvider>
              <ScrollToTop />
              <Shell />
            </CookieConsentProvider>
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
