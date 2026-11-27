import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { api, ApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { NivelAtividade, ObjetivoNutricional, SexoBiologico } from '../types';

const RESTRICOES_OPCOES = [
  { id: 'sem_lactose', label: 'Sem Lactose' },
  { id: 'sem_gluten', label: 'Sem Glúten' },
  { id: 'low_carb', label: 'Low Carb' },
  { id: 'vegano', label: 'Vegano' },
];

const ALERGIAS_OPCOES = [
  { id: 'amendoim', label: 'Amendoim' },
  { id: 'castanhas', label: 'Castanhas' },
  { id: 'peixe', label: 'Peixe / Frutos do Mar' },
  { id: 'soja', label: 'Soja' },
  { id: 'ovo', label: 'Ovo' },
  { id: 'lactose', label: 'Lactose' },
  { id: 'gluten', label: 'Glúten' },
];

export const OnboardingPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [pesoKg, setPesoKg] = useState(75);
  const [alturaCm, setAlturaCm] = useState(175);
  const [idade, setIdade] = useState(29);
  const [sexo, setSexo] = useState<SexoBiologico>('MASCULINO');
  const [nivelAtividade, setNivelAtividade] = useState<NivelAtividade>('MODERADO');
  const [objetivo, setObjetivo] = useState<ObjetivoNutricional>('HIPERTROFIA');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [alergias, setAlergias] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPerfil()
      .then((p) => {
        if (p.pesoKg) setPesoKg(Number(p.pesoKg));
        if (p.alturaCm) setAlturaCm(p.alturaCm);
        if (p.idade) setIdade(p.idade);
        if (p.sexo) setSexo(p.sexo);
        if (p.nivelAtividade) setNivelAtividade(p.nivelAtividade);
        if (p.objetivo) setObjetivo(p.objetivo);
        if (p.restricoes) setRestricoes(p.restricoes);
        if (p.alergias) setAlergias(p.alergias);
      })
      .catch(() => {});
  }, []);

  const toggleItem = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
  };

  // Pré-visualização em tempo real do cálculo de TMB/GET (RF03)
  const fatores: Record<NivelAtividade, number> = {
    SEDENTARIO: 1.2,
    LEVE: 1.375,
    MODERADO: 1.55,
    INTENSO: 1.725,
    ATLETA: 1.9,
  };
  const tmb = Math.round(10 * pesoKg + 6.25 * alturaCm - 5 * idade + (sexo === 'MASCULINO' ? 5 : -161));
  const get = Math.round(tmb * fatores[nivelAtividade]);
  const metaKcal =
    objetivo === 'EMAGRECIMENTO' ? Math.max(1300, get - 400) : objetivo === 'HIPERTROFIA' ? get + 350 : get;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.salvarOnboarding({
        pesoKg,
        alturaCm,
        idade,
        sexo,
        nivelAtividade,
        objetivo,
        restricoes,
        alergias,
      });
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar perfil biométrico.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] dark:bg-[#143628] text-[#2E7D32] dark:text-emerald-300">
          <Sparkles className="w-3.5 h-3.5" /> Onboarding Biométrico & Clínico
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Configure seu perfil nutricional</h1>
        <p className="text-sm text-[#5F6368] dark:text-[#94A3B8] mt-1">
          Calculamos automaticamente sua TMB, GET e metas de macros, além de bloquear alergênicos em todas as recomendações da IA (RN02).
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mymita-card p-6 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="ob-peso" className="block text-sm font-semibold mb-1">
              Peso atual (kg)
            </label>
            <input
              id="ob-peso"
              type="number"
              step="0.1"
              min={30}
              max={300}
              value={pesoKg}
              onChange={(e) => setPesoKg(Number(e.target.value))}
              className="mymita-input"
              required
            />
          </div>
          <div>
            <label htmlFor="ob-altura" className="block text-sm font-semibold mb-1">
              Altura (cm)
            </label>
            <input
              id="ob-altura"
              type="number"
              min={100}
              max={250}
              value={alturaCm}
              onChange={(e) => setAlturaCm(Number(e.target.value))}
              className="mymita-input"
              required
            />
          </div>
          <div>
            <label htmlFor="ob-idade" className="block text-sm font-semibold mb-1">
              Idade (anos)
            </label>
            <input
              id="ob-idade"
              type="number"
              min={14}
              max={110}
              value={idade}
              onChange={(e) => setIdade(Number(e.target.value))}
              className="mymita-input"
              required
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="ob-sexo" className="block text-sm font-semibold mb-1">
              Sexo biológico
            </label>
            <select
              id="ob-sexo"
              value={sexo}
              onChange={(e) => setSexo(e.target.value as SexoBiologico)}
              className="mymita-input"
            >
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
            </select>
          </div>
          <div>
            <label htmlFor="ob-atv" className="block text-sm font-semibold mb-1">
              Nível de atividade
            </label>
            <select
              id="ob-atv"
              value={nivelAtividade}
              onChange={(e) => setNivelAtividade(e.target.value as NivelAtividade)}
              className="mymita-input"
            >
              <option value="SEDENTARIO">Sedentário</option>
              <option value="LEVE">Leve (1–2x/sem)</option>
              <option value="MODERADO">Moderado (3–5x/sem)</option>
              <option value="INTENSO">Intenso (6x/sem)</option>
              <option value="ATLETA">Atleta / 2 treinos/dia</option>
            </select>
          </div>
          <div>
            <label htmlFor="ob-obj" className="block text-sm font-semibold mb-1">
              Objetivo principal
            </label>
            <select
              id="ob-obj"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value as ObjetivoNutricional)}
              className="mymita-input"
            >
              <option value="EMAGRECIMENTO">Emagrecimento</option>
              <option value="MANUTENCAO">Manutenção / Saúde</option>
              <option value="HIPERTROFIA">Hipertrofia</option>
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold mb-2">Preferências e restrições alimentares</legend>
          <div className="flex flex-wrap gap-2">
            {RESTRICOES_OPCOES.map((opt) => {
              const active = restricoes.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleItem(restricoes, setRestricoes, opt.id)}
                  className={`min-h-[44px] px-4 rounded-xl text-sm font-medium border transition ${
                    active
                      ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                      : 'bg-[#F5F5F5] dark:bg-[#171D23] border-[#DCE1E7] dark:border-[#26323D]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold mb-1">
            Alergias severas (bloqueio estrito automático pela IA — RN02)
          </legend>
          <p className="text-xs text-[#5F6368] dark:text-[#94A3B8] mb-2">
            Pratos contendo qualquer item marcado abaixo nunca serão sugeridos pela IA.
          </p>
          <div className="flex flex-wrap gap-2">
            {ALERGIAS_OPCOES.map((opt) => {
              const active = alergias.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleItem(alergias, setAlergias, opt.id)}
                  className={`min-h-[44px] px-4 rounded-xl text-sm font-medium border transition ${
                    active
                      ? 'bg-[#E53935] text-white border-[#E53935]'
                      : 'bg-[#F5F5F5] dark:bg-[#171D23] border-[#DCE1E7] dark:border-[#26323D]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Preview ao vivo da TMB / GET / Meta */}
        <div className="p-4 rounded-2xl bg-[#E8F5E9] dark:bg-[#143628] border border-[#2E7D32]/25 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#2E7D32] dark:text-emerald-400" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#2E7D32] dark:text-emerald-300">
                Estimativa metabólica automática (Mifflin-St Jeor)
              </p>
              <p className="text-sm mt-0.5">
                TMB: <strong>{tmb} kcal</strong> • GET: <strong>{get} kcal</strong> • Meta diária sugerida:{' '}
                <strong className="text-[#2E7D32] dark:text-emerald-300">{metaKcal} kcal/dia</strong>
              </p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="mymita-btn-primary w-full">
          <CheckCircle2 className="w-5 h-5" />
          {loading ? 'Calculando metas e gerando cardápio...' : 'Salvar perfil e gerar meu plano com IA'}
        </button>
      </form>
    </div>
  );
};
