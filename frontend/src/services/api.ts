import { supabase } from './supabaseClient';
import type {
  Assinatura,
  AuthResponse,
  CardapioItem,
  CardapioPlanejado,
  CategoriaMarmita,
  CepCobertura,
  DiaSemana,
  Endereco,
  EvolucaoBiometrica,
  FaixaCep,
  Marmita,
  MensagemChat,
  NivelAtividade,
  ObjetivoNutricional,
  PacienteResumo,
  Pedido,
  PerfilNutricional,
  Plano,
  RelatorioProducao,
  ResumoMacros,
  Role,
  SexoBiologico,
  StatusEntrega,
  TipoRefeicao,
  UserSummary,
} from '../types';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const TIPO_LABEL: Record<TipoRefeicao, string> = {
  CAFE_MANHA: 'Café da manhã',
  LANCHE_MANHA: 'Lanche da manhã',
  ALMOCO: 'Almoço',
  LANCHE_TARDE: 'Lanche da tarde',
  JANTAR: 'Jantar',
};

const TIPO_HORARIO: Record<TipoRefeicao, string> = {
  CAFE_MANHA: '07:00',
  LANCHE_MANHA: '10:00',
  ALMOCO: '12:30',
  LANCHE_TARDE: '16:00',
  JANTAR: '19:30',
};

const DIAS_ORDEM: DiaSemana[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
const TIPOS_ORDEM: TipoRefeicao[] = ['CAFE_MANHA', 'LANCHE_MANHA', 'ALMOCO', 'LANCHE_TARDE', 'JANTAR'];

function sanitize(text?: string | null): string {
  return (text || '').replace(/<[^>]*>/g, '').trim();
}

function mapMarmita(row: any): Marmita {
  return {
    id: Number(row.id_marmita),
    nome: row.nome,
    descricao: row.descricao,
    imagemUrl: row.imagem_url,
    altText: row.alt_text,
    categoria: row.categoria,
    tipoSugerido: row.tipo_sugerido || 'ALMOCO',
    pesoGramas: Number(row.peso_gramas ?? 350),
    tempoPreparoMin: Number(row.tempo_preparo_min ?? 5),
    ingredientes: row.ingredientes,
    alergenos: Array.isArray(row.alergenos) ? row.alergenos : [],
    kcal: Number(row.kcal),
    proteinaG: Number(row.proteina_g),
    carboG: Number(row.carbo_g),
    gorduraG: Number(row.gordura_g),
    fibraG: Number(row.fibra_g ?? 5),
    precoAvulso: Number(row.preco_avulso),
    disponivel: Boolean(row.disponivel),
  };
}

function mapPlano(row: any): Plano {
  return {
    id: Number(row.id_plano),
    nomePlano: row.nome_plano,
    descricao: row.descricao || '',
    frequencia: row.frequencia,
    qtdMarmitas: Number(row.qtd_marmitas),
    incluiConsultaNutri: Boolean(row.inclui_consulta_nutri),
    preco: Number(row.preco),
    destaque: Boolean(row.destaque),
    ativo: Boolean(row.ativo),
  };
}

function mapEndereco(row: any): Endereco {
  return {
    id: Number(row.id_endereco),
    apelido: row.apelido || undefined,
    logradouro: row.logradouro,
    numero: row.numero,
    complemento: row.complemento || undefined,
    bairro: row.bairro,
    cidade: row.cidade,
    uf: row.uf,
    cep: row.cep,
  };
}

function marmitaSeguraParaPerfil(m: Marmita, perfil?: { alergias: string[]; restricoes: string[] } | null): boolean {
  if (!perfil) return true;
  const bloqueados = new Set<string>(perfil.alergias.map((a) => a.toLowerCase()));
  for (const r of perfil.restricoes) {
    const n = r.toLowerCase();
    if (n.includes('lactose')) bloqueados.add('lactose');
    if (n.includes('gluten') || n.includes('glúten')) bloqueados.add('gluten');
    if (n.includes('amendoim')) bloqueados.add('amendoim');
    if (n.includes('castanha')) bloqueados.add('castanhas');
    if (n.includes('peixe') || n.includes('frutos_do_mar')) bloqueados.add('peixe');
    if (n.includes('soja')) bloqueados.add('soja');
    if (n.includes('ovo')) bloqueados.add('ovo');
  }
  if (perfil.restricoes.some((r) => r.toLowerCase() === 'vegano') && m.categoria !== 'VEGANA') {
    return false;
  }
  return !m.alergenos.some((a) => bloqueados.has(a.toLowerCase()));
}

function dentroDaJanela24h(dataEntrega: string, janelaHorario: string): boolean {
  const horaStr = janelaHorario?.slice(0, 5) || '12:00';
  const entrega = new Date(`${dataEntrega}T${horaStr}:00`);
  const limite = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return entrega.getTime() > limite.getTime();
}

function mondayIso(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  return mon.toISOString().split('T')[0];
}

async function requireAuthUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new ApiError('Sessão expirada. Faça login novamente.', 401, 'UNAUTHORIZED');
  }
  return data.user;
}

async function ensureUsuarioRow(authUser: { id: string; email?: string; user_metadata?: Record<string, any> }): Promise<UserSummary> {
  const { data: existing } = await supabase
    .from('usuario')
    .select('*')
    .eq('id_usuario', authUser.id)
    .maybeSingle();

  let row = existing;

  if (!row) {
    const meta = authUser.user_metadata || {};
    const requestedRole = meta.role === 'NUTRICIONISTA' ? 'NUTRICIONISTA' : 'CLIENTE';
    const nome = sanitize(meta.nome) || (authUser.email?.split('@')[0] || 'Usuário');

    const { data: inserted, error: insErr } = await supabase
      .from('usuario')
      .insert({
        id_usuario: authUser.id,
        nome,
        email: (authUser.email || '').toLowerCase(),
        cpf: sanitize(meta.cpf) || null,
        telefone: sanitize(meta.telefone) || null,
        role: requestedRole,
        crn: requestedRole === 'NUTRICIONISTA' ? sanitize(meta.crn) || null : null,
        consentimento_lgpd: true,
        data_consentimento_lgpd: new Date().toISOString(),
        ativo: true,
      })
      .select('*')
      .single();

    if (insErr) throw new ApiError(insErr.message, 400);
    row = inserted;

    if (requestedRole === 'CLIENTE') {
      await supabase.from('perfil_nutricional').insert({
        id_cliente: authUser.id,
        onboarding_concluido: false,
      });

      await supabase.from('mensagem_chat').insert({
        id_cliente: authUser.id,
        remetente_tipo: 'IA',
        conteudo: `Oi, ${nome.split(' ')[0]}! Eu sou a Mila, sua assistente nutricional do MYMita. Pode me perguntar sobre refeições, trocas no plano ou metas diárias!`,
      });
    }
  }

  let onboardingConcluido = row.role !== 'CLIENTE';
  if (row.role === 'CLIENTE') {
    const { data: perf } = await supabase
      .from('perfil_nutricional')
      .select('onboarding_concluido')
      .eq('id_cliente', row.id_usuario)
      .maybeSingle();
    onboardingConcluido = Boolean(perf?.onboarding_concluido);
  }

  return {
    id: row.id_usuario,
    nome: row.nome,
    email: row.email,
    cpf: row.cpf || undefined,
    telefone: row.telefone || undefined,
    avatarUrl: row.avatar_url || undefined,
    role: row.role as Role,
    crn: row.crn || undefined,
    consentimentoLgpd: Boolean(row.consentimento_lgpd),
    onboardingConcluido,
    dataCadastro: row.data_cadastro,
  };
}

async function buildCardapioResponse(cardapioRow: any): Promise<CardapioPlanejado> {
  const { data: rawItems, error } = await supabase
    .from('cardapio_item')
    .select('*, marmita(*)')
    .eq('id_cardapio', cardapioRow.id_cardapio);

  if (error) throw new ApiError(error.message, 400);

  const itens: CardapioItem[] = (rawItems || [])
    .map((i: any) => ({
      id: Number(i.id_item),
      diaSemana: i.dia_semana as DiaSemana,
      tipoRefeicao: i.tipo_refeicao as TipoRefeicao,
      tipoLabel: TIPO_LABEL[i.tipo_refeicao as TipoRefeicao] || i.tipo_refeicao,
      horarioSugerido: i.horario_sugerido || '12:30',
      consumido: Boolean(i.consumido),
      travadoNutri: Boolean(i.travado_nutri),
      marmita: mapMarmita(i.marmita),
    }))
    .sort((a, b) => {
      const dDiff = DIAS_ORDEM.indexOf(a.diaSemana) - DIAS_ORDEM.indexOf(b.diaSemana);
      if (dDiff !== 0) return dDiff;
      return TIPOS_ORDEM.indexOf(a.tipoRefeicao) - TIPOS_ORDEM.indexOf(b.tipoRefeicao);
    });

  const macrosPorDia = {} as Record<DiaSemana, ResumoMacros>;
  const macrosSemana: ResumoMacros = { kcal: 0, proteinaG: 0, carboG: 0, gorduraG: 0, fibraG: 0 };

  for (const d of DIAS_ORDEM) {
    const m: ResumoMacros = { kcal: 0, proteinaG: 0, carboG: 0, gorduraG: 0, fibraG: 0 };
    for (const it of itens) {
      if (it.diaSemana === d) {
        m.kcal += it.marmita.kcal;
        m.proteinaG += it.marmita.proteinaG;
        m.carboG += it.marmita.carboG;
        m.gorduraG += it.marmita.gorduraG;
        m.fibraG += it.marmita.fibraG;
      }
    }
    macrosPorDia[d] = m;
    macrosSemana.kcal += m.kcal;
    macrosSemana.proteinaG += m.proteinaG;
    macrosSemana.carboG += m.carboG;
    macrosSemana.gorduraG += m.gorduraG;
    macrosSemana.fibraG += m.fibraG;
  }

  return {
    id: Number(cardapioRow.id_cardapio),
    semanaReferencia: cardapioRow.semana_referencia,
    statusAprovacao: cardapioRow.status_aprovacao,
    orientacoesNutri: cardapioRow.orientacoes_nutri || undefined,
    itens,
    macrosPorDia,
    macrosSemana,
  };
}

async function mapPedidoRow(row: any): Promise<Pedido> {
  const podeAlterar =
    (row.status_entrega === 'AGUARDANDO_PAGAMENTO' || row.status_entrega === 'CONFIRMADO') &&
    dentroDaJanela24h(row.data_entrega, row.janela_horario);

  return {
    id: Number(row.id_pedido),
    clienteId: row.id_cliente,
    clienteNome: row.usuario?.nome || 'Assinante',
    assinaturaId: row.id_assinatura ? Number(row.id_assinatura) : undefined,
    endereco: mapEndereco(row.endereco),
    dataEntrega: row.data_entrega,
    janelaHorario: row.janela_horario,
    statusEntrega: row.status_entrega,
    formaPagamento: row.forma_pagamento,
    gatewayPaymentId: row.gateway_payment_id || undefined,
    valorFrete: Number(row.valor_frete),
    valorTotal: Number(row.valor_total),
    observacoes: row.observacoes || undefined,
    podeAlterarOuCancelar: podeAlterar,
    criadoEm: row.criado_em,
    itens: (row.pedido_item || []).map((pi: any) => ({
      id: Number(pi.id_pedido_item),
      marmitaId: Number(pi.id_marmita),
      marmitaNome: pi.marmita?.nome || 'Marmita',
      marmitaImagemUrl: pi.marmita?.imagem_url || '',
      quantidade: Number(pi.quantidade),
      precoUnitario: Number(pi.preco_unitario),
    })),
  };
}

function pontuarMarmitaParaMila(m: Marmita, q: string): number {
  let score = 0;
  const texto = `${m.nome} ${m.ingredientes} ${m.descricao}`.toLowerCase();
  if (q.includes('lanche') && (m.tipoSugerido === 'LANCHE_TARDE' || m.tipoSugerido === 'LANCHE_MANHA')) score += 10;
  if ((q.includes('café') || q.includes('cafe') || q.includes('manhã')) && m.tipoSugerido === 'CAFE_MANHA') score += 10;
  if ((q.includes('almoço') || q.includes('almoco')) && m.tipoSugerido === 'ALMOCO') score += 8;
  if (q.includes('jantar') && m.tipoSugerido === 'JANTAR') score += 9;
  if (q.includes('frango') && texto.includes('frango')) score += 8;
  if ((q.includes('salmão') || q.includes('salmao') || q.includes('peixe') || q.includes('tilápia')) && (texto.includes('salmão') || texto.includes('tilápia'))) score += 8;
  if ((q.includes('carne') || q.includes('patinho')) && (texto.includes('patinho') || texto.includes('carne'))) score += 8;
  if ((q.includes('vegano') || q.includes('vegana') || q.includes('planta')) && m.categoria === 'VEGANA') score += 10;
  if (q.includes('low carb') && m.categoria === 'LOW_CARB') score += 9;
  if ((q.includes('poucas calorias') || q.includes('leve') || q.includes('emagrec')) && m.kcal <= 360) score += 6;
  if ((q.includes('proteína') || q.includes('proteina') || q.includes('hipertrofia')) && m.proteinaG >= 32) score += 6;
  if (q.includes('arroz') && texto.includes('arroz')) score += 5;
  if ((q.includes('abóbora') || q.includes('abobora')) && texto.includes('abóbora')) score += 8;
  return score;
}

export const api = {
  // === AUTH & LGPD (Supabase Auth + public.usuario) ===
  async login(email: string, senha: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });
    if (error || !data.user || !data.session) {
      if (error?.message?.toLowerCase().includes('email not confirmed')) {
        throw new ApiError('Confirme seu e-mail no link enviado para sua caixa de entrada antes de entrar.', 401, 'EMAIL_NOT_CONFIRMED');
      }
      throw new ApiError('E-mail ou senha inválidos.', 401, 'UNAUTHORIZED');
    }
    const usuario = await ensureUsuarioRow(data.user);
    return { token: data.session.access_token, usuario };
  },

  async register(payload: Record<string, unknown>): Promise<AuthResponse> {
    const role: Role = payload.role === 'NUTRICIONISTA' ? 'NUTRICIONISTA' : 'CLIENTE';
    if (role === 'NUTRICIONISTA' && !String(payload.crn || '').trim()) {
      throw new ApiError('Nutricionistas devem informar o registro CRN válido.', 400, 'CRN_REQUIRED');
    }

    const { data, error } = await supabase.auth.signUp({
      email: String(payload.email || '').trim().toLowerCase(),
      password: String(payload.senha || ''),
      options: {
        data: {
          nome: sanitize(String(payload.nome || '')),
          cpf: sanitize(String(payload.cpf || '')),
          telefone: sanitize(String(payload.telefone || '')),
          role,
          crn: role === 'NUTRICIONISTA' ? sanitize(String(payload.crn || '')) : null,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        throw new ApiError('Já existe uma conta cadastrada com este e-mail.', 409, 'EMAIL_IN_USE');
      }
      throw new ApiError(error.message, 400);
    }

    if (!data.user) {
      throw new ApiError('Não foi possível criar a conta.', 400);
    }

    if (!data.session) {
      throw new ApiError(
        'Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login.',
        202,
        'EMAIL_CONFIRMATION_REQUIRED'
      );
    }

    const usuario = await ensureUsuarioRow(data.user);
    return { token: data.session.access_token, usuario };
  },

  async getMe(): Promise<UserSummary> {
    const authUser = await requireAuthUser();
    return ensureUsuarioRow(authUser);
  },

  async updateMe(payload: { nome: string; cpf?: string; telefone?: string }): Promise<UserSummary> {
    const authUser = await requireAuthUser();
    const { error } = await supabase
      .from('usuario')
      .update({
        nome: sanitize(payload.nome),
        cpf: sanitize(payload.cpf) || null,
        telefone: sanitize(payload.telefone) || null,
      })
      .eq('id_usuario', authUser.id);
    if (error) throw new ApiError(error.message, 400);
    return ensureUsuarioRow(authUser);
  },

  async deleteMeLgpd(): Promise<{ mensagem: string }> {
    const authUser = await requireAuthUser();
    const { error } = await supabase.from('usuario').delete().eq('id_usuario', authUser.id);
    if (error) throw new ApiError(error.message, 400);
    await supabase.auth.signOut();
    return { mensagem: 'Conta e dados pessoais excluídos definitivamente conforme a LGPD.' };
  },

  // === PERFIL & EVOLUÇÃO ===
  async getPerfil(): Promise<PerfilNutricional> {
    const authUser = await requireAuthUser();
    const usuario = await ensureUsuarioRow(authUser);

    let { data: row } = await supabase
      .from('perfil_nutricional')
      .select('*')
      .eq('id_cliente', authUser.id)
      .maybeSingle();

    if (!row) {
      const { data: created, error } = await supabase
        .from('perfil_nutricional')
        .insert({ id_cliente: authUser.id, onboarding_concluido: false })
        .select('*')
        .single();
      if (error) throw new ApiError(error.message, 400);
      row = created;
    }

    let nutriNome: string | undefined;
    let nutriCrn: string | undefined;
    if (row.id_nutricionista) {
      const { data: n } = await supabase
        .from('usuario')
        .select('nome, crn')
        .eq('id_usuario', row.id_nutricionista)
        .maybeSingle();
      nutriNome = n?.nome;
      nutriCrn = n?.crn || undefined;
    }

    return {
      id: Number(row.id_perfil),
      clienteId: row.id_cliente,
      clienteNome: usuario.nome,
      nutricionistaId: row.id_nutricionista || undefined,
      nutricionistaNome: nutriNome,
      nutricionistaCrn: nutriCrn,
      pesoKg: row.peso_kg != null ? Number(row.peso_kg) : undefined,
      alturaCm: row.altura_cm != null ? Number(row.altura_cm) : undefined,
      idade: row.idade != null ? Number(row.idade) : undefined,
      sexo: row.sexo || undefined,
      nivelAtividade: row.nivel_atividade || undefined,
      objetivo: row.objetivo || undefined,
      restricoes: Array.isArray(row.restricoes) ? row.restricoes : [],
      alergias: Array.isArray(row.alergias) ? row.alergias : [],
      tmbKcal: row.tmb_kcal != null ? Number(row.tmb_kcal) : undefined,
      getKcal: row.get_kcal != null ? Number(row.get_kcal) : undefined,
      metaKcal: row.meta_kcal != null ? Number(row.meta_kcal) : undefined,
      metaProteinaG: row.meta_proteina_g != null ? Number(row.meta_proteina_g) : undefined,
      metaCarboG: row.meta_carbo_g != null ? Number(row.meta_carbo_g) : undefined,
      metaGorduraG: row.meta_gordura_g != null ? Number(row.meta_gordura_g) : undefined,
      metaAguaLitros: row.meta_agua_litros != null ? Number(row.meta_agua_litros) : 2.5,
      metasDefinidasNutri: Boolean(row.metas_definidas_nutri),
      observacoesClinicas: row.observacoes_clinicas || undefined,
      onboardingConcluido: Boolean(row.onboarding_concluido),
    };
  },

  async salvarOnboarding(payload: Record<string, unknown>): Promise<PerfilNutricional> {
    const authUser = await requireAuthUser();
    const atual = await api.getPerfil();

    const peso = Number(payload.pesoKg);
    const altura = Number(payload.alturaCm);
    const idade = Number(payload.idade);
    const sexo = payload.sexo as SexoBiologico;
    const nivel = payload.nivelAtividade as NivelAtividade;
    const objetivo = payload.objetivo as ObjetivoNutricional;
    const restricoes = Array.isArray(payload.restricoes) ? (payload.restricoes as string[]) : [];
    const alergias = Array.isArray(payload.alergias) ? (payload.alergias as string[]) : [];

    const fatores: Record<NivelAtividade, number> = {
      SEDENTARIO: 1.2,
      LEVE: 1.375,
      MODERADO: 1.55,
      INTENSO: 1.725,
      ATLETA: 1.9,
    };

    const tmb = Math.round(10 * peso + 6.25 * altura - 5 * idade + (sexo === 'MASCULINO' ? 5 : -161));
    const get = Math.round(tmb * fatores[nivel]);

    const updateData: Record<string, unknown> = {
      peso_kg: peso,
      altura_cm: altura,
      idade,
      sexo,
      nivel_atividade: nivel,
      objetivo,
      restricoes,
      alergias,
      tmb_kcal: tmb,
      get_kcal: get,
      onboarding_concluido: true,
      atualizado_em: new Date().toISOString(),
    };

    // RN06: Não sobrescreve metas manuais se já definidas pelo nutricionista
    if (!atual.metasDefinidasNutri) {
      const metaKcal =
        objetivo === 'EMAGRECIMENTO' ? Math.max(1300, get - 400) : objetivo === 'HIPERTROFIA' ? get + 350 : get;
      const protKg = objetivo === 'HIPERTROFIA' ? 2.1 : objetivo === 'EMAGRECIMENTO' ? 2.0 : 1.7;
      const metaProt = Math.round(peso * protKg);
      const metaGord = Math.round((metaKcal * 0.25) / 9);
      const metaCarb = Math.round(Math.max(200, metaKcal - metaProt * 4 - metaGord * 9) / 4);
      const metaAgua = Number((peso * 0.035).toFixed(2));

      updateData.meta_kcal = metaKcal;
      updateData.meta_proteina_g = metaProt;
      updateData.meta_carbo_g = metaCarb;
      updateData.meta_gordura_g = metaGord;
      updateData.meta_agua_litros = metaAgua;
    }

    const { error } = await supabase
      .from('perfil_nutricional')
      .update(updateData)
      .eq('id_cliente', authUser.id);
    if (error) throw new ApiError(error.message, 400);

    // Registra check-in inicial se não existir nenhum
    const { data: evs } = await supabase
      .from('evolucao_biometrica')
      .select('id_evolucao')
      .eq('id_cliente', authUser.id)
      .limit(1);

    if (!evs || evs.length === 0) {
      await supabase.from('evolucao_biometrica').insert({
        id_cliente: authUser.id,
        data_registro: new Date().toISOString().split('T')[0],
        peso_kg: peso,
        agua_litros: Number((peso * 0.035).toFixed(2)),
        notas_paciente: 'Check-in inicial do onboarding biométrico.',
      });
    }

    await api.gerarCardapioIa();
    return api.getPerfil();
  },

  async listarEvolucao(): Promise<EvolucaoBiometrica[]> {
    const authUser = await requireAuthUser();
    const { data, error } = await supabase
      .from('evolucao_biometrica')
      .select('*')
      .eq('id_cliente', authUser.id)
      .order('data_registro', { ascending: true });
    if (error) throw new ApiError(error.message, 400);

    return (data || []).map((row: any) => ({
      id: Number(row.id_evolucao),
      dataRegistro: row.data_registro,
      pesoKg: Number(row.peso_kg),
      percentualGordura: row.percentual_gordura != null ? Number(row.percentual_gordura) : undefined,
      aguaLitros: row.agua_litros != null ? Number(row.agua_litros) : undefined,
      notasPaciente: row.notas_paciente || undefined,
      feedbackNutri: row.feedback_nutri || undefined,
    }));
  },

  async registrarCheckIn(payload: Record<string, unknown>): Promise<EvolucaoBiometrica> {
    const authUser = await requireAuthUser();
    const { data, error } = await supabase
      .from('evolucao_biometrica')
      .insert({
        id_cliente: authUser.id,
        data_registro: new Date().toISOString().split('T')[0],
        peso_kg: Number(payload.pesoKg),
        percentual_gordura: payload.percentualGordura != null ? Number(payload.percentualGordura) : null,
        agua_litros: payload.aguaLitros != null ? Number(payload.aguaLitros) : null,
        notas_paciente: sanitize(String(payload.notasPaciente || '')) || null,
      })
      .select('*')
      .single();
    if (error) throw new ApiError(error.message, 400);

    await supabase
      .from('perfil_nutricional')
      .update({ peso_kg: Number(payload.pesoKg), atualizado_em: new Date().toISOString() })
      .eq('id_cliente', authUser.id);

    return {
      id: Number(data.id_evolucao),
      dataRegistro: data.data_registro,
      pesoKg: Number(data.peso_kg),
      percentualGordura: data.percentual_gordura != null ? Number(data.percentual_gordura) : undefined,
      aguaLitros: data.agua_litros != null ? Number(data.agua_litros) : undefined,
      notasPaciente: data.notas_paciente || undefined,
      feedbackNutri: data.feedback_nutri || undefined,
    };
  },

  // === CATÁLOGO & PLANOS ===
  async listarMarmitas(params?: {
    categoria?: string;
    kcalMax?: number;
    busca?: string;
    filtrarAlergenos?: boolean;
  }): Promise<Marmita[]> {
    let query = supabase.from('marmita').select('*').eq('disponivel', true).order('id_marmita', { ascending: true });
    if (params?.categoria) query = query.eq('categoria', params.categoria);
    if (params?.kcalMax) query = query.lte('kcal', params.kcalMax);

    const { data, error } = await query;
    if (error) throw new ApiError(error.message, 400);

    let list = (data || []).map(mapMarmita);

    if (params?.busca) {
      const q = params.busca.toLowerCase();
      list = list.filter(
        (m) =>
          m.nome.toLowerCase().includes(q) ||
          m.ingredientes.toLowerCase().includes(q) ||
          m.descricao.toLowerCase().includes(q)
      );
    }

    if (params?.filtrarAlergenos) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const perfil = await api.getPerfil().catch(() => null);
        if (perfil) {
          list = list.filter((m) => marmitaSeguraParaPerfil(m, perfil));
        }
      }
    }

    return list;
  },

  async listarPlanos(): Promise<Plano[]> {
    const { data, error } = await supabase
      .from('plano')
      .select('*')
      .eq('ativo', true)
      .order('preco', { ascending: true });
    if (error) throw new ApiError(error.message, 400);
    return (data || []).map(mapPlano);
  },

  // === CARDÁPIO SEMANAL (RN02 + RN06 + RF10) ===
  async getCardapioAtual(): Promise<CardapioPlanejado> {
    const authUser = await requireAuthUser();
    const { data: existing } = await supabase
      .from('cardapio_planejado')
      .select('*')
      .eq('id_cliente', authUser.id)
      .order('semana_referencia', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existing) {
      return api.gerarCardapioIa();
    }
    return buildCardapioResponse(existing);
  },

  async gerarCardapioIa(): Promise<CardapioPlanejado> {
    const authUser = await requireAuthUser();
    const perfil = await api.getPerfil();
    const seguras = await api.listarMarmitas({ filtrarAlergenos: true });
    if (seguras.length === 0) {
      throw new ApiError('Nenhuma marmita compatível com suas restrições alimentares.', 422);
    }

    let { data: cardapio } = await supabase
      .from('cardapio_planejado')
      .select('*')
      .eq('id_cliente', authUser.id)
      .order('semana_referencia', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cardapio) {
      const { data: created, error } = await supabase
        .from('cardapio_planejado')
        .insert({
          id_cliente: authUser.id,
          semana_referencia: mondayIso(),
          status_aprovacao: 'GERADO_IA',
        })
        .select('*')
        .single();
      if (error) throw new ApiError(error.message, 400);
      cardapio = created;
    }

    // Preserva itens travados pelo nutricionista (RN06)
    const { data: travados } = await supabase
      .from('cardapio_item')
      .select('dia_semana, tipo_refeicao')
      .eq('id_cardapio', cardapio.id_cardapio)
      .eq('travado_nutri', true);

    const travadosSet = new Set((travados || []).map((t: any) => `${t.dia_semana}_${t.tipo_refeicao}`));

    await supabase
      .from('cardapio_item')
      .delete()
      .eq('id_cardapio', cardapio.id_cardapio)
      .eq('travado_nutri', false);

    const cafes = seguras.filter((m) => m.tipoSugerido === 'CAFE_MANHA');
    const lanches = seguras.filter((m) => m.tipoSugerido === 'LANCHE_MANHA' || m.tipoSugerido === 'LANCHE_TARDE');
    const principais = seguras.filter((m) => m.tipoSugerido === 'ALMOCO' || m.tipoSugerido === 'JANTAR');

    const novosItens: Record<string, unknown>[] = [];
    let idx = 0;
    for (const dia of DIAS_ORDEM) {
      for (const tipo of TIPOS_ORDEM) {
        if (travadosSet.has(`${dia}_${tipo}`)) continue;
        let pool =
          tipo === 'CAFE_MANHA'
            ? cafes
            : tipo === 'LANCHE_MANHA' || tipo === 'LANCHE_TARDE'
              ? lanches
              : principais;
        if (pool.length === 0) pool = seguras;
        const escolhida = pool[idx++ % pool.length];
        novosItens.push({
          id_cardapio: cardapio.id_cardapio,
          id_marmita: escolhida.id,
          dia_semana: dia,
          tipo_refeicao: tipo,
          horario_sugerido: TIPO_HORARIO[tipo],
          consumido: false,
          travado_nutri: false,
        });
      }
    }

    if (novosItens.length > 0) {
      const { error: insErr } = await supabase.from('cardapio_item').insert(novosItens);
      if (insErr) throw new ApiError(insErr.message, 400);
    }

    void perfil;
    return buildCardapioResponse(cardapio);
  },

  async trocarPrato(itemId: number, novaMarmitaId: number): Promise<CardapioPlanejado> {
    const authUser = await requireAuthUser();
    const usuario = await ensureUsuarioRow(authUser);

    const { data: item, error: itErr } = await supabase
      .from('cardapio_item')
      .select('*, cardapio_planejado(*)')
      .eq('id_item', itemId)
      .single();
    if (itErr || !item) throw new ApiError('Refeição não encontrada.', 404);

    if (usuario.role === 'CLIENTE' && item.travado_nutri) {
      throw new ApiError(
        'Esta refeição foi travada na prescrição do seu nutricionista (RN06).',
        422,
        'RN06_LOCKED_BY_NUTRI'
      );
    }

    const { data: novaMarmitaRow } = await supabase
      .from('marmita')
      .select('*')
      .eq('id_marmita', novaMarmitaId)
      .single();
    if (!novaMarmitaRow) throw new ApiError('Marmita não encontrada.', 404);

    const perfil = await api.getPerfil();
    if (!marmitaSeguraParaPerfil(mapMarmita(novaMarmitaRow), perfil)) {
      throw new ApiError('Esta marmita contém alergênicos cadastrados no seu perfil (RN02).', 422, 'RN02_ALLERGEN_BLOCKED');
    }

    const { error } = await supabase
      .from('cardapio_item')
      .update({ id_marmita: novaMarmitaId })
      .eq('id_item', itemId);
    if (error) throw new ApiError(error.message, 400);

    return buildCardapioResponse(item.cardapio_planejado);
  },

  async alternarConsumido(itemId: number): Promise<CardapioPlanejado> {
    const { data: item } = await supabase
      .from('cardapio_item')
      .select('*, cardapio_planejado(*)')
      .eq('id_item', itemId)
      .single();
    if (!item) throw new ApiError('Refeição não encontrada.', 404);

    await supabase
      .from('cardapio_item')
      .update({ consumido: !item.consumido })
      .eq('id_item', itemId);

    return buildCardapioResponse(item.cardapio_planejado);
  },

  // === CHAT HÍBRIDO — MILA (IA) + NUTRICIONISTA (RF06 + RN02 + RN06) ===
  async listarMensagensChat(): Promise<MensagemChat[]> {
    const authUser = await requireAuthUser();
    const { data, error } = await supabase
      .from('mensagem_chat')
      .select('*, marmita(*)')
      .eq('id_cliente', authUser.id)
      .order('timestamp', { ascending: true });
    if (error) throw new ApiError(error.message, 400);

    return (data || []).map((m: any) => ({
      id: Number(m.id_mensagem),
      remetenteTipo: m.remetente_tipo,
      conteudo: m.conteudo,
      marmitaSugerida: m.marmita ? mapMarmita(m.marmita) : undefined,
      timestamp: m.timestamp,
    }));
  },

  async enviarMensagemIa(conteudoBruto: string): Promise<MensagemChat[]> {
    const authUser = await requireAuthUser();
    const conteudo = sanitize(conteudoBruto);

    const { data: msgUser, error: uErr } = await supabase
      .from('mensagem_chat')
      .insert({
        id_cliente: authUser.id,
        remetente_tipo: 'CLIENTE',
        conteudo,
      })
      .select('*')
      .single();
    if (uErr) throw new ApiError(uErr.message, 400);

    const perfil = await api.getPerfil();
    // RN02: Apenas marmitas 100% seguras chegam à Mila
    const seguras = await api.listarMarmitas({ filtrarAlergenos: true });
    const q = conteudo.toLowerCase();
    const sugerida =
      seguras.length > 0
        ? [...seguras].sort((a, b) => pontuarMarmitaParaMila(b, q) - pontuarMarmitaParaMila(a, q))[0]
        : undefined;

    const alergiasTexto =
      perfil.alergias.length > 0
        ? ` (100% livre de ${perfil.alergias.join(', ')})`
        : '';
    const metaTexto = perfil.metaKcal
      ? `alinhada à sua meta de ${perfil.metaKcal} kcal e ${perfil.metaProteinaG}g de proteína${
          perfil.metasDefinidasNutri ? ' prescrita pelo seu nutricionista' : ''
        }`
      : 'equilibrada para sua rotina';

    const respostaMila = sugerida
      ? `Oi! Separei uma ótima opção ${metaTexto}${alergiasTexto}: recomendo ${sugerida.nome} (${sugerida.kcal} kcal e ${sugerida.proteinaG}g de proteína). Você pode ver a ficha nutricional ou já adicionar no seu carrinho!`
      : 'Analisei seu perfil nutricional e estou pronta para ajudar! Se quiser um ajuste clínico específico, você também pode falar direto com seu nutricionista na aba ao lado.';

    const { data: msgIa, error: iErr } = await supabase
      .from('mensagem_chat')
      .insert({
        id_cliente: authUser.id,
        remetente_tipo: 'IA',
        conteudo: respostaMila,
        marmita_sugerida_id: sugerida?.id ?? null,
      })
      .select('*, marmita(*)')
      .single();
    if (iErr) throw new ApiError(iErr.message, 400);

    return [
      {
        id: Number(msgUser.id_mensagem),
        remetenteTipo: 'CLIENTE',
        conteudo: msgUser.conteudo,
        timestamp: msgUser.timestamp,
      },
      {
        id: Number(msgIa.id_mensagem),
        remetenteTipo: 'IA',
        conteudo: msgIa.conteudo,
        marmitaSugerida: msgIa.marmita ? mapMarmita(msgIa.marmita) : undefined,
        timestamp: msgIa.timestamp,
      },
    ];
  },

  async enviarMensagemNutri(conteudoBruto: string): Promise<MensagemChat> {
    const authUser = await requireAuthUser();
    const { data, error } = await supabase
      .from('mensagem_chat')
      .insert({
        id_cliente: authUser.id,
        remetente_tipo: 'CLIENTE',
        conteudo: `[Para o Nutricionista] ${sanitize(conteudoBruto)}`,
      })
      .select('*')
      .single();
    if (error) throw new ApiError(error.message, 400);

    return {
      id: Number(data.id_mensagem),
      remetenteTipo: 'CLIENTE',
      conteudo: data.conteudo,
      timestamp: data.timestamp,
    };
  },

  // === ENDEREÇOS, CEP (RN05), ASSINATURAS & CHECKOUT (RN01 + RN03) ===
  async validarCep(cepBruto: string): Promise<CepCobertura> {
    const cepLimpo = (cepBruto || '').replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      return {
        cep: cepBruto,
        atendido: false,
        taxaEntrega: 0,
        mensagem: 'Informe um CEP válido com 8 dígitos.',
      };
    }

    const { data } = await supabase.from('faixa_cep_cobertura').select('*').eq('ativo', true);
    const num = Number(cepLimpo);
    for (const f of data || []) {
      const ini = Number(String(f.cep_inicio).replace(/\D/g, ''));
      const fim = Number(String(f.cep_fim).replace(/\D/g, ''));
      if (num >= ini && num <= fim) {
        return {
          cep: cepLimpo,
          atendido: true,
          regiao: f.regiao,
          taxaEntrega: Number(f.taxa_entrega),
          mensagem: `Endereço atendido na região ${f.regiao}!`,
        };
      }
    }
    return {
      cep: cepLimpo,
      atendido: false,
      taxaEntrega: 0,
      mensagem: 'Ainda não atendemos este CEP. Confira nossa área de cobertura (DF, SP, RJ, GO).',
    };
  },

  async listarEnderecos(): Promise<Endereco[]> {
    const authUser = await requireAuthUser();
    const { data, error } = await supabase
      .from('endereco')
      .select('*')
      .eq('id_usuario', authUser.id)
      .eq('ativo', true);
    if (error) throw new ApiError(error.message, 400);
    return (data || []).map(mapEndereco);
  },

  async criarEndereco(payload: Record<string, unknown>): Promise<Endereco> {
    const authUser = await requireAuthUser();
    const cob = await api.validarCep(String(payload.cep || ''));
    if (!cob.atendido) {
      throw new ApiError(cob.mensagem, 422, 'RN05_OUT_OF_COVERAGE');
    }

    const { data, error } = await supabase
      .from('endereco')
      .insert({
        id_usuario: authUser.id,
        apelido: sanitize(String(payload.apelido || 'Principal')),
        logradouro: sanitize(String(payload.logradouro || '')),
        numero: sanitize(String(payload.numero || '')),
        complemento: sanitize(String(payload.complemento || '')) || null,
        bairro: sanitize(String(payload.bairro || '')),
        cidade: sanitize(String(payload.cidade || '')),
        uf: sanitize(String(payload.uf || '')).toUpperCase().slice(0, 2),
        cep: cob.cep,
        ativo: true,
      })
      .select('*')
      .single();
    if (error) throw new ApiError(error.message, 400);
    return mapEndereco(data);
  },

  async listarAssinaturas(): Promise<Assinatura[]> {
    const authUser = await requireAuthUser();
    const { data, error } = await supabase
      .from('assinatura')
      .select('*, plano(*)')
      .eq('id_cliente', authUser.id)
      .order('data_inicio', { ascending: false });
    if (error) throw new ApiError(error.message, 400);

    return (data || []).map((a: any) => ({
      id: Number(a.id_assinatura),
      plano: mapPlano(a.plano),
      dataInicio: a.data_inicio,
      proximaCobranca: a.proxima_cobranca,
      status: a.status,
      diaEntregaPreferencial: a.dia_entrega_preferencial || undefined,
      janelaHorarioPreferencial: a.janela_horario_preferencial || undefined,
      formaPagamento: a.forma_pagamento || undefined,
      pausadaAte: a.pausada_ate || undefined,
    }));
  },

  async pausarAssinatura(id: number, pausarAte: string): Promise<Assinatura> {
    const { data, error } = await supabase
      .from('assinatura')
      .update({ status: 'PAUSADA', pausada_ate: pausarAte })
      .eq('id_assinatura', id)
      .select('*, plano(*)')
      .single();
    if (error) throw new ApiError(error.message, 400);

    return {
      id: Number(data.id_assinatura),
      plano: mapPlano(data.plano),
      dataInicio: data.data_inicio,
      proximaCobranca: data.proxima_cobranca,
      status: data.status,
      diaEntregaPreferencial: data.dia_entrega_preferencial || undefined,
      janelaHorarioPreferencial: data.janela_horario_preferencial || undefined,
      formaPagamento: data.forma_pagamento || undefined,
      pausadaAte: data.pausada_ate || undefined,
    };
  },

  async reativarAssinatura(id: number): Promise<Assinatura> {
    const { data, error } = await supabase
      .from('assinatura')
      .update({ status: 'ATIVA', pausada_ate: null })
      .eq('id_assinatura', id)
      .select('*, plano(*)')
      .single();
    if (error) throw new ApiError(error.message, 400);

    return {
      id: Number(data.id_assinatura),
      plano: mapPlano(data.plano),
      dataInicio: data.data_inicio,
      proximaCobranca: data.proxima_cobranca,
      status: data.status,
      diaEntregaPreferencial: data.dia_entrega_preferencial || undefined,
      janelaHorarioPreferencial: data.janela_horario_preferencial || undefined,
      formaPagamento: data.forma_pagamento || undefined,
      pausadaAte: data.pausada_ate || undefined,
    };
  },

  async checkout(payload: Record<string, unknown>): Promise<Pedido> {
    const authUser = await requireAuthUser();
    const enderecoId = Number(payload.enderecoId);
    const { data: endRow } = await supabase
      .from('endereco')
      .select('*')
      .eq('id_endereco', enderecoId)
      .single();
    if (!endRow) throw new ApiError('Endereço não encontrado.', 404);

    // RN05
    const cob = await api.validarCep(endRow.cep);
    if (!cob.atendido) throw new ApiError(cob.mensagem, 422, 'RN05_OUT_OF_COVERAGE');

    let assinaturaId: number | null = null;
    let subtotal = 0;

    if (payload.planoId) {
      const { data: planoRow } = await supabase
        .from('plano')
        .select('*')
        .eq('id_plano', Number(payload.planoId))
        .single();
      if (!planoRow) throw new ApiError('Plano não encontrado.', 404);

      const prox = new Date();
      prox.setDate(prox.getDate() + (planoRow.frequencia === 'SEMANAL' ? 7 : 30));

      const { data: ass, error: assErr } = await supabase
        .from('assinatura')
        .insert({
          id_cliente: authUser.id,
          id_plano: planoRow.id_plano,
          gateway_subscription_id: `sub_sb_${crypto.randomUUID().slice(0, 8)}`,
          data_inicio: new Date().toISOString().split('T')[0],
          proxima_cobranca: prox.toISOString().split('T')[0],
          status: 'ATIVA',
          janela_horario_preferencial: String(payload.janelaHorario || '18:00 - 20:00'),
          forma_pagamento: String(payload.formaPagamento || 'CARTAO_CREDITO'),
        })
        .select('*')
        .single();
      if (assErr) throw new ApiError(assErr.message, 400);
      assinaturaId = Number(ass.id_assinatura);
      subtotal = Number(planoRow.preco);
    }

    const itensReq = Array.isArray(payload.itens)
      ? (payload.itens as Array<{ marmitaId: number; quantidade: number }>)
      : [];

    const itensParaInserir: Array<{ id_marmita: number; quantidade: number; preco_unitario: number }> = [];
    for (const it of itensReq) {
      const { data: mRow } = await supabase
        .from('marmita')
        .select('id_marmita, preco_avulso')
        .eq('id_marmita', it.marmitaId)
        .single();
      if (!mRow) continue;
      itensParaInserir.push({
        id_marmita: Number(mRow.id_marmita),
        quantidade: Number(it.quantidade),
        preco_unitario: Number(mRow.preco_avulso),
      });
      if (!payload.planoId) {
        subtotal += Number(mRow.preco_avulso) * Number(it.quantidade);
      }
    }

    const frete = payload.planoId ? 0 : cob.taxaEntrega;

    const { data: ped, error: pErr } = await supabase
      .from('pedido')
      .insert({
        id_cliente: authUser.id,
        id_assinatura: assinaturaId,
        id_endereco: enderecoId,
        data_entrega: String(payload.dataEntrega),
        janela_horario: String(payload.janelaHorario),
        status_entrega: 'CONFIRMADO',
        forma_pagamento: String(payload.formaPagamento),
        gateway_payment_id: `pay_sb_${crypto.randomUUID().slice(0, 10)}`,
        valor_frete: frete,
        valor_total: subtotal + frete,
        observacoes: sanitize(String(payload.observacoes || '')) || null,
      })
      .select('*, usuario:id_cliente(nome), endereco(*), pedido_item(*, marmita(*))')
      .single();
    if (pErr) throw new ApiError(pErr.message, 400);

    if (itensParaInserir.length > 0) {
      await supabase
        .from('pedido_item')
        .insert(itensParaInserir.map((i) => ({ ...i, id_pedido: ped.id_pedido })));
    }

    const { data: fullPed } = await supabase
      .from('pedido')
      .select('*, usuario:id_cliente(nome), endereco(*), pedido_item(*, marmita(*))')
      .eq('id_pedido', ped.id_pedido)
      .single();

    return mapPedidoRow(fullPed);
  },

  async listarPedidos(): Promise<Pedido[]> {
    const authUser = await requireAuthUser();
    const { data, error } = await supabase
      .from('pedido')
      .select('*, usuario:id_cliente(nome), endereco(*), pedido_item(*, marmita(*))')
      .eq('id_cliente', authUser.id)
      .order('criado_em', { ascending: false });
    if (error) throw new ApiError(error.message, 400);
    return Promise.all((data || []).map(mapPedidoRow));
  },

  async cancelarPedido(id: number): Promise<Pedido> {
    const { data: p } = await supabase.from('pedido').select('*').eq('id_pedido', id).single();
    if (!p) throw new ApiError('Pedido não encontrado.', 404);
    if (!dentroDaJanela24h(p.data_entrega, p.janela_horario)) {
      throw new ApiError(
        'O cancelamento só pode ser realizado com no mínimo 24 horas de antecedência da entrega (RN01).',
        422,
        'RN01_24H_WINDOW'
      );
    }

    const { data: updated, error } = await supabase
      .from('pedido')
      .update({ status_entrega: 'CANCELADO' })
      .eq('id_pedido', id)
      .select('*, usuario:id_cliente(nome), endereco(*), pedido_item(*, marmita(*))')
      .single();
    if (error) throw new ApiError(error.message, 400);
    return mapPedidoRow(updated);
  },

  // === NUTRICIONISTA ===
  async listarPacientes(): Promise<PacienteResumo[]> {
    const { data: perfis, error } = await supabase
      .from('perfil_nutricional')
      .select('*, usuario:id_cliente(id_usuario, nome, email)');
    if (error) throw new ApiError(error.message, 400);

    return (perfis || []).map((p: any) => ({
      clienteId: p.id_cliente,
      nome: p.usuario?.nome || 'Paciente',
      email: p.usuario?.email || '',
      objetivo: p.objetivo || 'N/D',
      metaKcal: p.meta_kcal != null ? Number(p.meta_kcal) : undefined,
      metaProteinaG: p.meta_proteina_g != null ? Number(p.meta_proteina_g) : undefined,
      pesoAtual: p.peso_kg != null ? Number(p.peso_kg) : undefined,
      statusCardapio: 'ATIVO',
      totalMensagensChat: 0,
    }));
  },

  async obterProntuario(clienteId: string): Promise<{
    perfil: PerfilNutricional;
    evolucao: EvolucaoBiometrica[];
    cardapio: CardapioPlanejado | null;
    chat: MensagemChat[];
  }> {
    const { data: pRow, error } = await supabase
      .from('perfil_nutricional')
      .select('*, usuario:id_cliente(nome)')
      .eq('id_cliente', clienteId)
      .single();
    if (error) throw new ApiError(error.message, 404);

    const { data: evRows } = await supabase
      .from('evolucao_biometrica')
      .select('*')
      .eq('id_cliente', clienteId)
      .order('data_registro', { ascending: true });

    const { data: cRow } = await supabase
      .from('cardapio_planejado')
      .select('*')
      .eq('id_cliente', clienteId)
      .order('semana_referencia', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: chatRows } = await supabase
      .from('mensagem_chat')
      .select('*, marmita(*)')
      .eq('id_cliente', clienteId)
      .order('timestamp', { ascending: true });

    return {
      perfil: {
        id: Number(pRow.id_perfil),
        clienteId: pRow.id_cliente,
        clienteNome: pRow.usuario?.nome || 'Paciente',
        pesoKg: pRow.peso_kg != null ? Number(pRow.peso_kg) : undefined,
        alturaCm: pRow.altura_cm != null ? Number(pRow.altura_cm) : undefined,
        idade: pRow.idade != null ? Number(pRow.idade) : undefined,
        sexo: pRow.sexo || undefined,
        nivelAtividade: pRow.nivel_atividade || undefined,
        objetivo: pRow.objetivo || undefined,
        restricoes: Array.isArray(pRow.restricoes) ? pRow.restricoes : [],
        alergias: Array.isArray(pRow.alergias) ? pRow.alergias : [],
        tmbKcal: pRow.tmb_kcal != null ? Number(pRow.tmb_kcal) : undefined,
        getKcal: pRow.get_kcal != null ? Number(pRow.get_kcal) : undefined,
        metaKcal: pRow.meta_kcal != null ? Number(pRow.meta_kcal) : undefined,
        metaProteinaG: pRow.meta_proteina_g != null ? Number(pRow.meta_proteina_g) : undefined,
        metaCarboG: pRow.meta_carbo_g != null ? Number(pRow.meta_carbo_g) : undefined,
        metaGorduraG: pRow.meta_gordura_g != null ? Number(pRow.meta_gordura_g) : undefined,
        metaAguaLitros: pRow.meta_agua_litros != null ? Number(pRow.meta_agua_litros) : 2.5,
        metasDefinidasNutri: Boolean(pRow.metas_definidas_nutri),
        observacoesClinicas: pRow.observacoes_clinicas || undefined,
        onboardingConcluido: Boolean(pRow.onboarding_concluido),
      },
      evolucao: (evRows || []).map((row: any) => ({
        id: Number(row.id_evolucao),
        dataRegistro: row.data_registro,
        pesoKg: Number(row.peso_kg),
        percentualGordura: row.percentual_gordura != null ? Number(row.percentual_gordura) : undefined,
        aguaLitros: row.agua_litros != null ? Number(row.agua_litros) : undefined,
        notasPaciente: row.notas_paciente || undefined,
        feedbackNutri: row.feedback_nutri || undefined,
      })),
      cardapio: cRow ? await buildCardapioResponse(cRow) : null,
      chat: (chatRows || []).map((m: any) => ({
        id: Number(m.id_mensagem),
        remetenteTipo: m.remetente_tipo,
        conteudo: m.conteudo,
        marmitaSugerida: m.marmita ? mapMarmita(m.marmita) : undefined,
        timestamp: m.timestamp,
      })),
    };
  },

  async ajustarMetasNutri(clienteId: string, payload: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('perfil_nutricional')
      .update({
        meta_kcal: Number(payload.metaKcal),
        meta_proteina_g: Number(payload.metaProteinaG),
        meta_carbo_g: Number(payload.metaCarboG),
        meta_gordura_g: Number(payload.metaGorduraG),
        observacoes_clinicas: sanitize(String(payload.observacoesClinicas || '')) || null,
        metas_definidas_nutri: true,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id_cliente', clienteId);
    if (error) throw new ApiError(error.message, 400);
  },

  async aprovarCardapio(cardapioId: number, orientacoesNutri: string): Promise<void> {
    const { error } = await supabase
      .from('cardapio_planejado')
      .update({
        status_aprovacao: 'APROVADO_NUTRI',
        orientacoes_nutri: sanitize(orientacoesNutri) || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id_cardapio', cardapioId);
    if (error) throw new ApiError(error.message, 400);
  },

  async alternarTravaNutri(itemId: number): Promise<void> {
    const { data: it } = await supabase
      .from('cardapio_item')
      .select('travado_nutri')
      .eq('id_item', itemId)
      .single();
    if (!it) throw new ApiError('Item não encontrado.', 404);
    await supabase
      .from('cardapio_item')
      .update({ travado_nutri: !it.travado_nutri })
      .eq('id_item', itemId);
  },

  async responderChatNutri(clienteId: string, conteudo: string): Promise<void> {
    const { error } = await supabase.from('mensagem_chat').insert({
      id_cliente: clienteId,
      remetente_tipo: 'NUTRICIONISTA',
      conteudo: sanitize(conteudo),
    });
    if (error) throw new ApiError(error.message, 400);
  },

  // === ADMIN / COZINHA ===
  async adminListarMarmitas(): Promise<Marmita[]> {
    const { data, error } = await supabase.from('marmita').select('*').order('id_marmita', { ascending: true });
    if (error) throw new ApiError(error.message, 400);
    return (data || []).map(mapMarmita);
  },

  async adminCriarMarmita(payload: Record<string, unknown>): Promise<Marmita> {
    const { data, error } = await supabase
      .from('marmita')
      .insert({
        nome: sanitize(String(payload.nome)),
        descricao: sanitize(String(payload.descricao)),
        imagem_url: String(payload.imagemUrl),
        alt_text: sanitize(String(payload.altText)),
        categoria: String(payload.categoria) as CategoriaMarmita,
        ingredientes: sanitize(String(payload.ingredientes)),
        alergenos: Array.isArray(payload.alergenos) ? payload.alergenos : [],
        kcal: Number(payload.kcal),
        proteina_g: Number(payload.proteinaG),
        carbo_g: Number(payload.carboG),
        gordura_g: Number(payload.gorduraG),
        fibra_g: Number(payload.fibraG ?? 5),
        preco_avulso: Number(payload.precoAvulso),
        disponivel: true,
      })
      .select('*')
      .single();
    if (error) throw new ApiError(error.message, 400);
    return mapMarmita(data);
  },

  async adminInativarMarmita(id: number): Promise<void> {
    await supabase.from('marmita').update({ disponivel: false }).eq('id_marmita', id);
  },

  async adminRelatorioProducao(): Promise<RelatorioProducao> {
    const { data, error } = await supabase
      .from('pedido')
      .select('*, usuario:id_cliente(nome), endereco(*), pedido_item(*, marmita(*))')
      .in('status_entrega', ['CONFIRMADO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE'])
      .order('data_entrega', { ascending: true });
    if (error) throw new ApiError(error.message, 400);

    const pedidos = await Promise.all((data || []).map(mapPedidoRow));
    const mapa = new Map<number, { marmitaId: number; marmitaNome: string; categoria: string; quantidadeTotal: number }>();
    let totalMarmitas = 0;

    for (const p of data || []) {
      for (const pi of p.pedido_item || []) {
        const m = pi.marmita;
        if (!m) continue;
        totalMarmitas += Number(pi.quantidade);
        const cur = mapa.get(Number(m.id_marmita));
        mapa.set(Number(m.id_marmita), {
          marmitaId: Number(m.id_marmita),
          marmitaNome: m.nome,
          categoria: m.categoria,
          quantidadeTotal: (cur?.quantidadeTotal || 0) + Number(pi.quantidade),
        });
      }
    }

    return {
      totalPedidosConfirmados: pedidos.length,
      totalMarmitas,
      itens: Array.from(mapa.values()),
      pedidos,
    };
  },

  async adminAtualizarStatusPedido(pedidoId: number, statusEntrega: StatusEntrega): Promise<void> {
    const { error } = await supabase
      .from('pedido')
      .update({ status_entrega: statusEntrega })
      .eq('id_pedido', pedidoId);
    if (error) throw new ApiError(error.message, 400);
  },

  async adminListarCeps(): Promise<FaixaCep[]> {
    const { data, error } = await supabase.from('faixa_cep_cobertura').select('*').order('id_faixa', { ascending: true });
    if (error) throw new ApiError(error.message, 400);
    return (data || []).map((f: any) => ({
      id: Number(f.id_faixa),
      cepInicio: f.cep_inicio,
      cepFim: f.cep_fim,
      regiao: f.regiao,
      taxaEntrega: Number(f.taxa_entrega),
      ativo: Boolean(f.ativo),
    }));
  },

  async adminCriarCep(payload: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('faixa_cep_cobertura').insert({
      cep_inicio: String(payload.cepInicio).replace(/\D/g, ''),
      cep_fim: String(payload.cepFim).replace(/\D/g, ''),
      regiao: sanitize(String(payload.regiao)),
      taxa_entrega: Number(payload.taxaEntrega),
      ativo: true,
    });
    if (error) throw new ApiError(error.message, 400);
  },

  async adminRemoverCep(id: number): Promise<void> {
    await supabase.from('faixa_cep_cobertura').delete().eq('id_faixa', id);
  },
};
