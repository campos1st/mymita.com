import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  ChefHat,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  ShoppingCart,
  Stethoscope,
  Sun,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { Logo } from './Logo';
import { MilaAssistantWidget } from './MilaAssistantWidget';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems: NavItem[] = (() => {
    if (user?.role === 'NUTRICIONISTA') {
      return [
        { to: '/nutricionista', label: 'Pacientes', icon: Stethoscope },
        { to: '/catalogo', label: 'Catálogo', icon: UtensilsCrossed },
        { to: '/mais', label: 'Perfil', icon: LayoutGrid },
      ];
    }
    if (user?.role === 'ADMIN') {
      return [
        { to: '/admin', label: 'Cozinha', icon: ChefHat },
        { to: '/catalogo', label: 'Catálogo', icon: UtensilsCrossed },
        { to: '/mais', label: 'Perfil', icon: LayoutGrid },
      ];
    }
    return [
      { to: '/', label: 'Início', icon: Home },
      { to: '/plano', label: 'Plano', icon: CalendarDays },
      { to: '/chat', label: 'Mila', icon: MessageCircle },
      { to: '/carrinho', label: 'Carrinho', icon: ShoppingCart, badge: totalItems },
      { to: '/mais', label: 'Mais', icon: LayoutGrid },
    ];
  })();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#101418] text-[#202124] dark:text-[#F1F5F9]">
      {/* WCAG 2.1 AA — Skip link para navegação por teclado */}
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#E53935] focus:text-white focus:font-semibold"
      >
        Pular para o conteúdo principal
      </a>

      {/* Desktop Sidebar fixa à esquerda (fiel às telas desktop do protótipo pp. 25–28) */}
      <aside
        aria-label="Navegação principal lateral"
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-24 xl:w-28 bg-white dark:bg-[#171D23] border-r border-[#E8ECEF] dark:border-[#26323D] z-30 items-center py-5 justify-between"
      >
        <div className="flex flex-col items-center w-full gap-6">
          <Link
            to={user?.role === 'NUTRICIONISTA' ? '/nutricionista' : user?.role === 'ADMIN' ? '/admin' : '/'}
            className="px-2 py-1"
            aria-label="Página inicial MYMita"
          >
            <Logo size="sm" />
          </Link>

          <nav className="flex flex-col items-center gap-2 w-full px-2" aria-label="Menu lateral">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`relative w-full min-h-[56px] flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium transition ${
                    active
                      ? 'text-[#E53935] bg-[#E53935]/10 dark:bg-[#E53935]/15'
                      : 'text-[#5F6368] dark:text-[#94A3B8] hover:bg-[#F5F5F5] dark:hover:bg-[#1C252D]'
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#E53935]"
                    />
                  )}
                  <span className="relative">
                    <Icon className="w-5 h-5" />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E53935] text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[#5F6368] dark:text-[#94A3B8] hover:bg-[#F5F5F5] dark:hover:bg-[#1C252D]"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sair da conta"
              title="Sair"
              className="w-11 h-11 rounded-xl flex items-center justify-center text-[#5F6368] dark:text-[#94A3B8] hover:text-[#E53935] hover:bg-[#E53935]/10"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Wrapper principal */}
      <div className="flex-1 flex flex-col lg:pl-24 xl:pl-28">
        {/* Top Header (fiel ao cabeçalho das telas mobile/desktop do protótipo) */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 dark:bg-[#171D23]/95 backdrop-blur border-b border-[#E8ECEF] dark:border-[#26323D] px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu de navegação"
              className="lg:hidden w-11 h-11 rounded-xl flex items-center justify-center hover:bg-[#F5F5F5] dark:hover:bg-[#1C252D]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2" aria-label="MYMita Início">
              <Logo size="md" />
            </Link>
            <Link
              to="/catalogo"
              className="hidden md:inline-flex items-center gap-1.5 ml-4 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F5F5F5] dark:bg-[#1C252D] text-[#5F6368] dark:text-[#94A3B8] hover:text-[#E53935] transition"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              Catálogo & Planos
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-[#5F6368] dark:text-[#94A3B8] hover:bg-[#F5F5F5] dark:hover:bg-[#1C252D]"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                <Link
                  to="/mais"
                  aria-label="Notificações e status dos pedidos"
                  className="relative w-11 h-11 rounded-xl flex items-center justify-center text-[#5F6368] dark:text-[#94A3B8] hover:bg-[#F5F5F5] dark:hover:bg-[#1C252D]"
                >
                  <Bell className="w-5 h-5" />
                  <span
                    aria-hidden="true"
                    className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#E53935]"
                  />
                </Link>
                <Link
                  to="/mais"
                  className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-[#F5F5F5] dark:hover:bg-[#1C252D] transition"
                  aria-label={`Perfil de ${user.nome}`}
                >
                  <img
                    src={
                      user.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=E53935&color=fff`
                    }
                    alt={`Foto de perfil de ${user.nome}`}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-[#E53935]/30"
                  />
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-sm font-semibold truncate max-w-[140px]">
                      {user.nome.split(' ')[0]}
                    </p>
                    <p className="text-[11px] text-[#5F6368] dark:text-[#94A3B8]">
                      {user.role === 'NUTRICIONISTA'
                        ? user.crn || 'Nutricionista'
                        : user.role === 'ADMIN'
                          ? 'Admin / Cozinha'
                          : 'Assinante'}
                    </p>
                  </div>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="mymita-btn-secondary text-sm">
                  Entrar
                </Link>
                <Link to="/cadastro" className="mymita-btn-primary text-sm">
                  Começar
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Drawer mobile complementar */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#171D23] h-full p-5 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Logo size="md" />
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Fechar menu"
                    className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-[#F5F5F5] dark:hover:bg-[#1C252D]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex flex-col gap-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center gap-3 min-h-[44px] px-4 py-2.5 rounded-xl font-medium ${
                          isActive(item.to)
                            ? 'bg-[#E53935]/10 text-[#E53935]'
                            : 'hover:bg-[#F5F5F5] dark:hover:bg-[#1C252D]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  <Link
                    to="/catalogo"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 min-h-[44px] px-4 py-2.5 rounded-xl font-medium hover:bg-[#F5F5F5] dark:hover:bg-[#1C252D]"
                  >
                    <UtensilsCrossed className="w-5 h-5" />
                    <span>Catálogo & Planos</span>
                  </Link>
                </nav>
              </div>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    handleLogout();
                  }}
                  className="mymita-btn-secondary w-full text-[#E53935]"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da conta
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo principal */}
        <main
          id="conteudo-principal"
          className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-6 pb-24 lg:pb-10"
        >
          {children}
        </main>

        {/* Assistente 3D Mila flutuante no canto inferior direito */}
        <MilaAssistantWidget />

        {/* Bottom Tab Bar mobile (< 768px / < 1024px) fiel às telas mobile do protótipo */}
        <nav
          aria-label="Navegação inferior"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-[#171D23]/95 backdrop-blur border-t border-[#E8ECEF] dark:border-[#26323D] px-2 py-1.5"
        >
          <ul className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <li key={item.to} className="flex-1">
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center justify-center min-h-[48px] gap-0.5 text-[11px] font-medium rounded-xl transition ${
                      active ? 'text-[#E53935]' : 'text-[#5F6368] dark:text-[#94A3B8]'
                    }`}
                  >
                    <span className="relative">
                      <Icon className="w-5 h-5" />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E53935] text-white text-[10px] font-bold flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};
