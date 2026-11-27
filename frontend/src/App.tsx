import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PlanoPage } from './pages/PlanoPage';
import { CatalogoPage } from './pages/CatalogoPage';
import { ChatPage } from './pages/ChatPage';
import { CarrinhoPage } from './pages/CarrinhoPage';
import { MaisPage } from './pages/MaisPage';
import { NutricionistaPage } from './pages/NutricionistaPage';
import { AdminPage } from './pages/AdminPage';
import type { Role } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: Role[] }> = ({
  children,
  roles,
}) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[#5F6368] dark:text-[#94A3B8]">
        Carregando MYMita...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />
                <Route path="/catalogo" element={<CatalogoPage />} />

                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute roles={['CLIENTE']}>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/plano"
                  element={
                    <ProtectedRoute roles={['CLIENTE']}>
                      <PlanoPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute roles={['CLIENTE']}>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/carrinho"
                  element={
                    <ProtectedRoute>
                      <CarrinhoPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/mais"
                  element={
                    <ProtectedRoute>
                      <MaisPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/nutricionista"
                  element={
                    <ProtectedRoute roles={['NUTRICIONISTA', 'ADMIN']}>
                      <NutricionistaPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roles={['ADMIN']}>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
