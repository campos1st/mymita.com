import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';
import type { Role } from '../types';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [role, setRole] = useState<Role>('CLIENTE');
  const [crn, setCrn] = useState('');
  const [consentimentoLgpd, setConsentimentoLgpd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!consentimentoLgpd) {
      setError('Você precisa aceitar o Termo de Consentimento da LGPD para criar sua conta.');
      return;
    }
    setLoading(true);
    try {
      const user = await register({
        nome,
        email,
        senha,
        cpf,
        telefone,
        role,
        crn: role === 'NUTRICIONISTA' ? crn : undefined,
        consentimentoLgpd,
      });
      if (user.role === 'NUTRICIONISTA') navigate('/nutricionista');
      else navigate('/onboarding');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_CONFIRMATION_REQUIRED') {
        setSuccessMsg(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : 'Erro ao criar conta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-6">
      <div className="mymita-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold">Criar sua conta</h1>
          <p className="text-sm text-[#5F6368] dark:text-[#94A3B8]">
            Comece seu plano alimentar personalizado com IA e nutricionista.
          </p>
        </div>

        {successMsg && (
          <div
            role="status"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#E8F5E9] dark:bg-[#143628] border border-[#2E7D32]/30 text-sm text-[#1B5E20] dark:text-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset>
            <legend className="text-sm font-semibold mb-2">Tipo de perfil</legend>
            <div className="grid grid-cols-2 gap-3">
              {(['CLIENTE', 'NUTRICIONISTA'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  aria-pressed={role === r}
                  className={`min-h-[44px] rounded-xl border text-sm font-semibold transition ${
                    role === r
                      ? 'border-[#E53935] bg-[#E53935]/10 text-[#E53935]'
                      : 'border-[#DCE1E7] dark:border-[#2B3744] hover:bg-[#F5F5F5] dark:hover:bg-[#171D23]'
                  }`}
                >
                  {r === 'CLIENTE' ? 'Assinante / Cliente' : 'Nutricionista (CRN)'}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="reg-nome" className="block text-sm font-semibold mb-1">
              Nome completo
            </label>
            <input
              id="reg-nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vincent van Gogh de Souza"
              className="mymita-input"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold mb-1">
                E-mail
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@dominio.com"
                className="mymita-input"
              />
            </div>
            <div>
              <label htmlFor="reg-senha" className="block text-sm font-semibold mb-1">
                Senha (mín. 6 caracteres)
              </label>
              <input
                id="reg-senha"
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Crie uma senha forte"
                className="mymita-input"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-cpf" className="block text-sm font-semibold mb-1">
                CPF
              </label>
              <input
                id="reg-cpf"
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="mymita-input"
              />
            </div>
            <div>
              <label htmlFor="reg-tel" className="block text-sm font-semibold mb-1">
                Telefone / WhatsApp
              </label>
              <input
                id="reg-tel"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(61) 99999-9999"
                className="mymita-input"
              />
            </div>
          </div>

          {role === 'NUTRICIONISTA' && (
            <div>
              <label htmlFor="reg-crn" className="block text-sm font-semibold mb-1">
                Registro Profissional (CRN)
              </label>
              <input
                id="reg-crn"
                type="text"
                required
                value={crn}
                onChange={(e) => setCrn(e.target.value)}
                placeholder="Ex: CRN-1 14820"
                className="mymita-input"
              />
            </div>
          )}

          {/* Termo de Consentimento Explícito LGPD (RF01 / RNF04) */}
          <div className="p-3.5 rounded-xl bg-[#F5F5F5] dark:bg-[#171D23] border border-[#E0E4E8] dark:border-[#26323D]">
            <label htmlFor="reg-lgpd" className="flex items-start gap-3 cursor-pointer text-xs leading-relaxed">
              <input
                id="reg-lgpd"
                type="checkbox"
                checked={consentimentoLgpd}
                onChange={(e) => setConsentimentoLgpd(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded accent-[#2E7D32] shrink-0"
              />
              <span>
                <strong className="inline-flex items-center gap-1 text-[#2E7D32] dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Consentimento LGPD (Lei nº 13.709/2018):
                </strong>{' '}
                Autorizo o tratamento dos meus dados pessoais e biométricos exclusivamente para cálculo nutricional, recomendação de cardápios e entregas. Posso consultar, editar ou excluir minha conta definitivamente a qualquer momento.
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="mymita-btn-primary w-full">
            {loading ? 'Criando conta...' : 'Criar conta e continuar'}
          </button>
        </form>

        <p className="text-center text-sm text-[#5F6368] dark:text-[#94A3B8]">
          Já possui conta?{' '}
          <Link to="/login" className="font-semibold text-[#E53935] hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
};
