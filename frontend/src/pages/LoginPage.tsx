import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes('@')) {
      setError('Por favor, insira um e-mail válido no formato nome@dominio.com');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, senha);
      if (user.role === 'NUTRICIONISTA') navigate('/nutricionista');
      else if (user.role === 'ADMIN') navigate('/admin');
      else if (!user.onboardingConcluido) navigate('/onboarding');
      else navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="mymita-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <img
              src="/mila-avatar.jpg"
              alt="Mila assistente nutricional MYMita"
              className="w-16 h-16 rounded-full object-cover ring-4 ring-[#2E7D32]/20"
            />
          </div>
          <Logo size="lg" />
          <h1 className="text-2xl font-bold">Entrar na sua conta</h1>
          <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">
            Sua alimentação saudável no piloto automático com a Mila.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#5F6368] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@dominio.com"
                className="mymita-input pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-senha" className="block text-sm font-semibold mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#5F6368] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-senha"
                type="password"
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="mymita-input pl-10"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="mymita-btn-primary w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-[#5F6368] dark:text-[#94A3B8]">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-semibold text-[#E53935] hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
};
