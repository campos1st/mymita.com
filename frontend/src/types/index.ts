export type Role = 'CLIENTE' | 'NUTRICIONISTA' | 'ADMIN';
export type SexoBiologico = 'MASCULINO' | 'FEMININO';
export type NivelAtividade = 'SEDENTARIO' | 'LEVE' | 'MODERADO' | 'INTENSO' | 'ATLETA';
export type ObjetivoNutricional = 'EMAGRECIMENTO' | 'MANUTENCAO' | 'HIPERTROFIA';
export type CategoriaMarmita = 'FIT' | 'LOW_CARB' | 'HIPERTROFIA' | 'VEGANA';
export type TipoRefeicao = 'CAFE_MANHA' | 'LANCHE_MANHA' | 'ALMOCO' | 'LANCHE_TARDE' | 'JANTAR';
export type DiaSemana = 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB' | 'DOM';
export type FrequenciaPlano = 'SEMANAL' | 'MENSAL';
export type StatusAssinatura = 'ATIVA' | 'PAUSADA' | 'SUSPENSA' | 'CANCELADA';
export type StatusAprovacaoCardapio = 'GERADO_IA' | 'APROVADO_NUTRI' | 'CONFIRMADO_CLIENTE';
export type StatusEntrega =
  | 'AGUARDANDO_PAGAMENTO'
  | 'CONFIRMADO'
  | 'EM_PREPARO'
  | 'SAIU_PARA_ENTREGA'
  | 'ENTREGUE'
  | 'CANCELADO';
export type RemetenteChat = 'CLIENTE' | 'IA' | 'NUTRICIONISTA';

export interface UserSummary {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  avatarUrl?: string;
  role: Role;
  crn?: string;
  consentimentoLgpd: boolean;
  onboardingConcluido: boolean;
  dataCadastro: string;
}

export interface AuthResponse {
  token: string;
  usuario: UserSummary;
}

export interface PerfilNutricional {
  id: number;
  clienteId: string;
  clienteNome: string;
  nutricionistaId?: string;
  nutricionistaNome?: string;
  nutricionistaCrn?: string;
  pesoKg?: number;
  alturaCm?: number;
  idade?: number;
  sexo?: SexoBiologico;
  nivelAtividade?: NivelAtividade;
  objetivo?: ObjetivoNutricional;
  restricoes: string[];
  alergias: string[];
  tmbKcal?: number;
  getKcal?: number;
  metaKcal?: number;
  metaProteinaG?: number;
  metaCarboG?: number;
  metaGorduraG?: number;
  metaAguaLitros?: number;
  metasDefinidasNutri: boolean;
  observacoesClinicas?: string;
  onboardingConcluido: boolean;
}

export interface EvolucaoBiometrica {
  id: number;
  dataRegistro: string;
  pesoKg: number;
  percentualGordura?: number;
  aguaLitros?: number;
  notasPaciente?: string;
  feedbackNutri?: string;
}

export interface Marmita {
  id: number;
  nome: string;
  descricao: string;
  imagemUrl: string;
  altText: string;
  categoria: CategoriaMarmita;
  tipoSugerido: TipoRefeicao;
  pesoGramas: number;
  tempoPreparoMin: number;
  ingredientes: string;
  alergenos: string[];
  kcal: number;
  proteinaG: number;
  carboG: number;
  gorduraG: number;
  fibraG: number;
  precoAvulso: number;
  disponivel: boolean;
}

export interface Plano {
  id: number;
  nomePlano: string;
  descricao: string;
  frequencia: FrequenciaPlano;
  qtdMarmitas: number;
  incluiConsultaNutri: boolean;
  preco: number;
  destaque: boolean;
  ativo: boolean;
}

export interface CardapioItem {
  id: number;
  diaSemana: DiaSemana;
  tipoRefeicao: TipoRefeicao;
  tipoLabel: string;
  horarioSugerido: string;
  consumido: boolean;
  travadoNutri: boolean;
  marmita: Marmita;
}

export interface ResumoMacros {
  kcal: number;
  proteinaG: number;
  carboG: number;
  gorduraG: number;
  fibraG: number;
}

export interface CardapioPlanejado {
  id: number;
  semanaReferencia: string;
  statusAprovacao: StatusAprovacaoCardapio;
  orientacoesNutri?: string;
  itens: CardapioItem[];
  macrosPorDia: Record<DiaSemana, ResumoMacros>;
  macrosSemana: ResumoMacros;
}

export interface MensagemChat {
  id: number;
  remetenteTipo: RemetenteChat;
  conteudo: string;
  marmitaSugerida?: Marmita;
  timestamp: string;
}

export interface Endereco {
  id: number;
  apelido?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface CepCobertura {
  cep: string;
  atendido: boolean;
  regiao?: string;
  taxaEntrega: number;
  mensagem: string;
}

export interface Assinatura {
  id: number;
  plano: Plano;
  dataInicio: string;
  proximaCobranca: string;
  status: StatusAssinatura;
  diaEntregaPreferencial?: string;
  janelaHorarioPreferencial?: string;
  formaPagamento?: string;
  pausadaAte?: string;
}

export interface PedidoItem {
  id: number;
  marmitaId: number;
  marmitaNome: string;
  marmitaImagemUrl: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Pedido {
  id: number;
  clienteId: string;
  clienteNome: string;
  assinaturaId?: number;
  endereco: Endereco;
  dataEntrega: string;
  janelaHorario: string;
  statusEntrega: StatusEntrega;
  formaPagamento: string;
  gatewayPaymentId?: string;
  valorFrete: number;
  valorTotal: number;
  observacoes?: string;
  podeAlterarOuCancelar: boolean;
  criadoEm: string;
  itens: PedidoItem[];
}

export interface RelatorioProducao {
  dataEntrega?: string;
  totalPedidosConfirmados: number;
  totalMarmitas: number;
  itens: Array<{
    marmitaId: number;
    marmitaNome: string;
    categoria: string;
    quantidadeTotal: number;
  }>;
  pedidos: Pedido[];
}

export interface FaixaCep {
  id: number;
  cepInicio: string;
  cepFim: string;
  regiao: string;
  taxaEntrega: number;
  ativo: boolean;
}

export interface PacienteResumo {
  clienteId: string;
  nome: string;
  email: string;
  objetivo: string;
  metaKcal?: number;
  metaProteinaG?: number;
  pesoAtual?: number;
  statusCardapio: string;
  totalMensagensChat: number;
}
