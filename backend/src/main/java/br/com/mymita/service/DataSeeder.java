package br.com.mymita.service;

import br.com.mymita.domain.*;
import br.com.mymita.domain.enums.*;
import br.com.mymita.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PerfilNutricionalRepository perfilRepository;
    private final EvolucaoBiometricaRepository evolucaoRepository;
    private final EnderecoRepository enderecoRepository;
    private final FaixaCepCoberturaRepository cepRepository;
    private final PlanoRepository planoRepository;
    private final AssinaturaRepository assinaturaRepository;
    private final MarmitaRepository marmitaRepository;
    private final CardapioPlanejadoRepository cardapioRepository;
    private final PedidoRepository pedidoRepository;
    private final MensagemChatRepository chatRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UsuarioRepository usuarioRepository,
            PerfilNutricionalRepository perfilRepository,
            EvolucaoBiometricaRepository evolucaoRepository,
            EnderecoRepository enderecoRepository,
            FaixaCepCoberturaRepository cepRepository,
            PlanoRepository planoRepository,
            AssinaturaRepository assinaturaRepository,
            MarmitaRepository marmitaRepository,
            CardapioPlanejadoRepository cardapioRepository,
            PedidoRepository pedidoRepository,
            MensagemChatRepository chatRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.perfilRepository = perfilRepository;
        this.evolucaoRepository = evolucaoRepository;
        this.enderecoRepository = enderecoRepository;
        this.cepRepository = cepRepository;
        this.planoRepository = planoRepository;
        this.assinaturaRepository = assinaturaRepository;
        this.marmitaRepository = marmitaRepository;
        this.cardapioRepository = cardapioRepository;
        this.pedidoRepository = pedidoRepository;
        this.chatRepository = chatRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepository.count() > 0) return;

        // 1. Usuários dos 3 perfis RBAC
        Usuario nutri = new Usuario();
        nutri.setNome("Dra. Camila Mendes");
        nutri.setEmail("nutri@mymita.com.br");
        nutri.setSenhaHash(passwordEncoder.encode("Mymita@123"));
        nutri.setTelefone("(61) 99812-3400");
        nutri.setRole(Role.NUTRICIONISTA);
        nutri.setCrn("CRN-1 14820");
        nutri.setAvatarUrl("https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80");
        nutri.setConsentimentoLgpd(true);
        nutri.setDataConsentimentoLgpd(LocalDateTime.now());
        nutri = usuarioRepository.save(nutri);

        Usuario admin = new Usuario();
        admin.setNome("Cozinha Central MyMita");
        admin.setEmail("admin@mymita.com.br");
        admin.setSenhaHash(passwordEncoder.encode("Mymita@123"));
        admin.setTelefone("(61) 3035-3900");
        admin.setRole(Role.ADMIN);
        admin.setAvatarUrl("https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80");
        admin.setConsentimentoLgpd(true);
        admin.setDataConsentimentoLgpd(LocalDateTime.now());
        admin = usuarioRepository.save(admin);

        Usuario alan = new Usuario();
        alan.setNome("Alan Turing da Silva");
        alan.setEmail("alan@mymita.com.br");
        alan.setSenhaHash(passwordEncoder.encode("Mymita@123"));
        alan.setCpf("045.821.990-12");
        alan.setTelefone("(61) 99123-4567");
        alan.setRole(Role.CLIENTE);
        alan.setAvatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80");
        alan.setConsentimentoLgpd(true);
        alan.setDataConsentimentoLgpd(LocalDateTime.now());
        alan = usuarioRepository.save(alan);

        // 2. Perfil Nutricional do Alan
        PerfilNutricional perfil = new PerfilNutricional();
        perfil.setCliente(alan);
        perfil.setNutricionista(nutri);
        perfil.setPesoKg(BigDecimal.valueOf(78.5));
        perfil.setAlturaCm(178);
        perfil.setIdade(30);
        perfil.setSexo(SexoBiologico.MASCULINO);
        perfil.setNivelAtividade(NivelAtividade.MODERADO);
        perfil.setObjetivo(ObjetivoNutricional.HIPERTROFIA);
        perfil.setRestricoesJson("[\"sem_lactose\"]");
        perfil.setAlergiasJson("[\"amendoim\"]");
        perfil.setTmbKcal(1748);
        perfil.setGetKcal(2709);
        perfil.setMetaKcal(1800);
        perfil.setMetaProteinaG(120);
        perfil.setMetaCarboG(180);
        perfil.setMetaGorduraG(60);
        perfil.setMetaAguaLitros(BigDecimal.valueOf(2.50));
        perfil.setMetasDefinidasNutri(true);
        perfil.setObservacoesClinicas("Foco em ganho de massa magra com fracionamento em 5 refeições e hidratação mínima de 2,5L/dia.");
        perfil.setOnboardingConcluido(true);
        perfilRepository.save(perfil);

        // 3. Histórico de Evolução Biométrica (4 semanas)
        List<Object[]> checkins = List.of(
                new Object[]{LocalDate.now().minusDays(21), 80.4, 18.2, 2.0, "Iniciando a assinatura semanal MyMita.", "Ótima adesão inicial! Aumente água pós-treino."},
                new Object[]{LocalDate.now().minusDays(14), 79.6, 17.6, 2.3, "Seguindo 100% os almoços e jantares.", "Excelente evolução de composição corporal."},
                new Object[]{LocalDate.now().minusDays(7), 79.0, 17.1, 2.5, "Energia muito melhor nos treinos.", "Mantemos o aporte proteico de 120g+."},
                new Object[]{LocalDate.now(), 78.5, 16.5, 2.6, "Bati todas as metas da semana!", null}
        );
        for (Object[] c : checkins) {
            EvolucaoBiometrica ev = new EvolucaoBiometrica();
            ev.setCliente(alan);
            ev.setDataRegistro((LocalDate) c[0]);
            ev.setPesoKg(BigDecimal.valueOf((Double) c[1]));
            ev.setPercentualGordura(BigDecimal.valueOf((Double) c[2]));
            ev.setAguaLitros(BigDecimal.valueOf((Double) c[3]));
            ev.setNotasPaciente((String) c[4]);
            ev.setFeedbackNutri((String) c[5]);
            evolucaoRepository.save(ev);
        }

        // 4. Faixas de CEP atendidas (RN05)
        cepRepository.saveAll(List.of(
                faixa("70000000", "73699999", "Distrito Federal (Plano Piloto, Gama, Águas Claras, Taguatinga)", 0.00),
                faixa("01000000", "09999999", "Grande São Paulo - SP", 7.90),
                faixa("20000000", "28999999", "Rio de Janeiro - RJ", 8.90),
                faixa("74000000", "74999999", "Goiânia e Região - GO", 5.90)
        ));

        // 5. Endereço inicial do Alan (Gama - DF)
        Endereco end = new Endereco();
        end.setUsuario(alan);
        end.setApelido("Casa");
        end.setLogradouro("SIGA Área Especial para Indústria");
        end.setNumero("02");
        end.setComplemento("Bloco B, Apto 304");
        end.setBairro("Setor Leste");
        end.setCidade("Gama");
        end.setUf("DF");
        end.setCep("72445020");
        end = enderecoRepository.save(end);

        // 6. Catálogo de Marmitas Fitness (fiel aos protótipos + todas categorias)
        Marmita aveia = marmita("Aveia com frutas",
                "Bowl cremoso de aveia em flocos preparada com leite vegetal, banana fatiada, morangos frescos e sementes de chia.",
                "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=600&q=80",
                "Tigela de aveia cremosa com fatias de banana, morangos frescos e sementes de chia",
                CategoriaMarmita.FIT, TipoRefeicao.CAFE_MANHA, 280, 5,
                "Aveia em flocos, banana prata, morango fresco, leite de amêndoas e chia",
                "[\"gluten\"]", 320, 14, 48, 8, 9, 16.90);

        Marmita iogurte = marmita("Iogurte vegetal com granola",
                "Iogurte vegetal proteico sem lactose acompanhado de granola artesanal crocante e fio de mel silvestre.",
                "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
                "Bowl de iogurte vegetal cremoso com granola crocante, frutas e mel",
                CategoriaMarmita.FIT, TipoRefeicao.LANCHE_MANHA, 220, 2,
                "Iogurte vegetal natural sem lactose, granola artesanal de aveia e mel orgânico",
                "[]", 180, 12, 24, 5, 4, 14.90);

        Marmita frangoQuinoa = marmita("Frango grelhado com quinoa",
                "Peito de frango grelhado em ervas finas acompanhado de quinoa tricolor, legumes salteados no azeite extravirgem.",
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
                "Marmita de peito de frango grelhado fatiado com quinoa tricolor e legumes coloridos",
                CategoriaMarmita.HIPERTROFIA, TipoRefeicao.ALMOCO, 380, 5,
                "Peito de frango grelhado, quinoa tricolor, brócolis, cenoura, abobrinha e azeite extravirgem",
                "[]", 450, 44, 38, 12, 7, 26.90);

        Marmita salmao = marmita("Salmão com legumes",
                "Filé de salmão grelhado rico em ômega-3 servido com brócolis no vapor e cenouras baby ao alecrim.",
                "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80",
                "Marmita de filé de salmão grelhado com brócolis frescos e cenoura ao vapor",
                CategoriaMarmita.LOW_CARB, TipoRefeicao.JANTAR, 350, 5,
                "Salmão grelhado, brócolis ninja, cenoura baby, limão siciliano e azeite",
                "[\"peixe\"]", 420, 38, 14, 22, 6, 34.90);

        Marmita frangoArroz = marmita("Frango grelhado com arroz integral e legumes",
                "Tempere o frango com ervas e grelhe. Arroz integral soltinho com mix de brócolis, cenoura e abobrinha refogados.",
                "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80",
                "Prato de peito de frango grelhado dourado com arroz integral e legumes salteados",
                CategoriaMarmita.FIT, TipoRefeicao.ALMOCO, 350, 5,
                "Peito de frango grelhado com ervas, arroz integral, brócolis, cenoura e abobrinha",
                "[]", 320, 36, 30, 6, 6, 24.90);

        Marmita patinhoAbobora = marmita("Patinho moído com purê de abóbora",
                "Carne bovina magra de patinho refogada com cebola roxa e tomate acompanhada de purê cremoso de abóbora cabotiá.",
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
                "Marmita de patinho moído refogado com purê cremoso de abóbora cabotiá e cheiro-verde",
                CategoriaMarmita.HIPERTROFIA, TipoRefeicao.ALMOCO, 380, 5,
                "Patinho moído magro, abóbora cabotiá, vagem francesa, alho e páprica defumada",
                "[]", 410, 40, 32, 13, 6, 27.90);

        Marmita bowlVegano = marmita("Bowl Vegano de Tofu e Grão-de-Bico",
                "Tofu orgânico grelhado no gergelim, grão-de-bico assado crocante, arroz negro, abacate e espinafre.",
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
                "Bowl vegano colorido com tofu grelhado, grão-de-bico, folhas verdes e abacate",
                CategoriaMarmita.VEGANA, TipoRefeicao.ALMOCO, 360, 5,
                "Tofu grelhado, grão-de-bico, abacate, tomate cereja, espinafre e gergelim",
                "[\"soja\"]", 390, 22, 42, 14, 11, 25.90);

        Marmita tilapia = marmita("Tilápia ao limão com batata doce",
                "Filé de tilápia grelhado ao limão siciliano com cubos de batata doce assada e aspargos frescos.",
                "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80",
                "Marmita de filé de tilápia grelhado com batata doce assada e aspargos",
                CategoriaMarmita.FIT, TipoRefeicao.JANTAR, 350, 5,
                "Filé de tilápia, batata doce roxa, aspargos verdes, limão siciliano e ervas",
                "[\"peixe\"]", 350, 34, 36, 7, 6, 28.90);

        Marmita escondidinho = marmita("Escondidinho fit de frango com batata doce",
                "Frango desfiado temperado ao tomate pelati coberto por purê aveludado de batata doce.",
                "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80",
                "Escondidinho saudável de frango desfiado com purê dourado de batata doce",
                CategoriaMarmita.HIPERTROFIA, TipoRefeicao.JANTAR, 400, 6,
                "Frango desfiado, batata doce, molho de tomate natural, cebola e salsinha",
                "[]", 480, 42, 52, 10, 7, 26.50);

        Marmita bananaCastanha = marmita("Banana com pasta de castanha e chia",
                "Lanche energético pré-treino de banana nanica com pasta integral de castanha de caju e chia (livre de amendoim).",
                "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80",
                "Rodelas de banana fresca com pasta cremosa de castanha de caju e sementes de chia",
                CategoriaMarmita.VEGANA, TipoRefeicao.LANCHE_TARDE, 200, 2,
                "Banana nanica, pasta integral de castanha de caju, canela e sementes de chia",
                "[\"castanhas\"]", 210, 7, 30, 8, 5, 13.90);

        Marmita omelete = marmita("Omelete de claras com espinafre",
                "Omelete proteico fofinho com claras, espinafre salteado, tomate cereja e queijo vegetal sem lactose.",
                "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80",
                "Omelete dourado de claras recheado com espinafre fresco e tomates cereja",
                CategoriaMarmita.LOW_CARB, TipoRefeicao.CAFE_MANHA, 250, 4,
                "Claras de ovo pasteurizadas, espinafre fresco, tomate cereja, orégano e azeite",
                "[\"ovo\"]", 260, 28, 8, 12, 3, 18.90);

        Marmita smoothieAmendoim = marmita("Shake Proteico com Pasta de Amendoim",
                "Shake cremoso hipercalórico de cacau 100% com pasta de amendoim integral e proteína vegetal (contém amendoim).",
                "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80",
                "Copo de shake proteico de cacau com pasta de amendoim integral",
                CategoriaMarmita.HIPERTROFIA, TipoRefeicao.LANCHE_TARDE, 300, 2,
                "Proteína vegetal, pasta de amendoim integral, cacau 100%, banana e aveia",
                "[\"amendoim\"]", 340, 28, 28, 14, 6, 17.90);

        marmitaRepository.saveAll(List.of(
                aveia, iogurte, frangoQuinoa, salmao, frangoArroz, patinhoAbobora,
                bowlVegano, tilapia, escondidinho, bananaCastanha, omelete, smoothieAmendoim
        ));

        // 7. Planos de Assinatura (RF11)
        Plano sem5 = plano("Semanal Essencial", "Ideal para garantir o almoço saudável de segunda a sexta sem complicação.", FrequenciaPlano.SEMANAL, 5, false, 119.90, false);
        Plano sem10 = plano("Semanal Equilíbrio", "Almoço e jantar planejados com macros calculados pela IA durante a semana.", FrequenciaPlano.SEMANAL, 10, true, 219.90, true);
        Plano sem14 = plano("Semanal Performance", "Rotina completa de 7 dias com acompanhamento clínico de nutricionista.", FrequenciaPlano.SEMANAL, 14, true, 289.90, false);
        Plano men20 = plano("Mensal Essencial", "20 marmitas mensais com 15% de desconto e frete grátis na área de cobertura.", FrequenciaPlano.MENSAL, 20, false, 439.90, false);
        Plano men40 = plano("Mensal Equilíbrio + Nutri", "40 refeições mensais, consulta mensal com nutricionista CRN e entregas semanais.", FrequenciaPlano.MENSAL, 40, true, 799.90, true);
        Plano men60 = plano("Mensal Atleta Pro", "60 refeições completas para alta performance, hipertrofia e suporte clínico contínuo.", FrequenciaPlano.MENSAL, 60, true, 1149.90, false);
        planoRepository.saveAll(List.of(sem5, sem10, sem14, men20, men40, men60));

        // 8. Assinatura ativa do Alan
        Assinatura ass = new Assinatura();
        ass.setCliente(alan);
        ass.setPlano(sem10);
        ass.setGatewaySubscriptionId("sub_seed_alan_001");
        ass.setDataInicio(LocalDate.now().minusDays(14));
        ass.setProximaCobranca(LocalDate.now().plusDays(7));
        ass.setStatus(StatusAssinatura.ATIVA);
        ass.setDiaEntregaPreferencial("MONDAY");
        ass.setJanelaHorarioPreferencial("18:00 - 20:00");
        ass.setFormaPagamento("CARTAO_CREDITO");
        ass = assinaturaRepository.save(ass);

        // 9. Cardápio Planejado Semanal do Alan (idêntico ao protótipo das páginas 25 e 26!)
        CardapioPlanejado cardapio = new CardapioPlanejado();
        cardapio.setCliente(alan);
        cardapio.setSemanaReferencia(LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)));
        cardapio.setStatusAprovacao(StatusAprovacaoCardapio.APROVADO_NUTRI);
        cardapio.setOrientacoesNutri("Almoço de segunda travado para garantir aporte proteico pós-treino. Hidrate-se ao longo do dia!");

        List<Marmita> almocos = List.of(frangoQuinoa, patinhoAbobora, frangoArroz, bowlVegano, escondidinho, frangoQuinoa, patinhoAbobora);
        List<Marmita> jantares = List.of(salmao, tilapia, escondidinho, salmao, tilapia, bowlVegano, salmao);

        DiaSemana[] dias = DiaSemana.values();
        for (int i = 0; i < dias.length; i++) {
            DiaSemana d = dias[i];
            addItem(cardapio, d, TipoRefeicao.CAFE_MANHA, i % 2 == 0 ? aveia : omelete, i == 0, false);
            addItem(cardapio, d, TipoRefeicao.LANCHE_MANHA, iogurte, i == 0, false);
            addItem(cardapio, d, TipoRefeicao.ALMOCO, almocos.get(i), i == 0, i == 0); // Segunda almoço travado pelo nutri (RN06)
            addItem(cardapio, d, TipoRefeicao.LANCHE_TARDE, i == 0 ? iogurte : bananaCastanha, i == 0, false);
            addItem(cardapio, d, TipoRefeicao.JANTAR, jantares.get(i), false, false);
        }
        cardapioRepository.save(cardapio);

        // 10. Pedidos de exemplo (Histórico Entregue + Pedido Confirmado para Cozinha)
        Pedido p1 = new Pedido();
        p1.setCliente(alan);
        p1.setAssinatura(ass);
        p1.setEndereco(end);
        p1.setDataEntrega(LocalDate.now().minusDays(7));
        p1.setJanelaHorario("18:00 - 20:00");
        p1.setStatusEntrega(StatusEntrega.ENTREGUE);
        p1.setFormaPagamento("CARTAO_CREDITO");
        p1.setGatewayPaymentId("pay_seed_001");
        p1.setValorFrete(BigDecimal.ZERO);
        p1.setValorTotal(sem10.getPreco());
        addPedidoItem(p1, frangoQuinoa, 5);
        addPedidoItem(p1, salmao, 5);
        pedidoRepository.save(p1);

        Pedido p2 = new Pedido();
        p2.setCliente(alan);
        p2.setAssinatura(ass);
        p2.setEndereco(end);
        p2.setDataEntrega(LocalDate.now().plusDays(3));
        p2.setJanelaHorario("18:00 - 20:00");
        p2.setStatusEntrega(StatusEntrega.EM_PREPARO);
        p2.setFormaPagamento("CARTAO_CREDITO");
        p2.setGatewayPaymentId("pay_seed_002");
        p2.setValorFrete(BigDecimal.ZERO);
        p2.setValorTotal(sem10.getPreco());
        addPedidoItem(p2, frangoQuinoa, 3);
        addPedidoItem(p2, patinhoAbobora, 3);
        addPedidoItem(p2, salmao, 4);
        pedidoRepository.save(p2);

        // 11. Conversa inicial do Chat Híbrido (fiel ao protótipo da página 27!)
        MensagemChat m1 = new MensagemChat();
        m1.setCliente(alan);
        m1.setRemetenteTipo(RemetenteChat.CLIENTE);
        m1.setConteudo("Quero uma opção de almoço com frango, arroz integral e legumes, que seja rápida e tenha poucas calorias.");
        m1.setTimestamp(LocalDateTime.now().minusMinutes(15));

        MensagemChat m2 = new MensagemChat();
        m2.setCliente(alan);
        m2.setRemetenteTipo(RemetenteChat.IA);
        m2.setConteudo("Aqui está uma ótima opção para o seu almoço! Totalmente livre de lactose e amendoim conforme seu perfil:");
        m2.setMarmitaSugerida(frangoArroz);
        m2.setTimestamp(LocalDateTime.now().minusMinutes(14));

        MensagemChat m3 = new MensagemChat();
        m3.setCliente(alan);
        m3.setRemetenteTipo(RemetenteChat.NUTRICIONISTA);
        m3.setConteudo("Olá Alan! Aprovei seu cardápio da semana e travei o almoço de segunda com quinoa para otimizar sua recuperação pós-treino.");
        m3.setTimestamp(LocalDateTime.now().minusMinutes(8));

        chatRepository.saveAll(List.of(m1, m2, m3));
    }

    private FaixaCepCobertura faixa(String ini, String fim, String regiao, double taxa) {
        FaixaCepCobertura f = new FaixaCepCobertura();
        f.setCepInicio(ini);
        f.setCepFim(fim);
        f.setRegiao(regiao);
        f.setTaxaEntrega(BigDecimal.valueOf(taxa));
        f.setAtivo(true);
        return f;
    }

    private Marmita marmita(String nome, String desc, String img, String alt, CategoriaMarmita cat,
                            TipoRefeicao tipo, int peso, int prep, String ingr, String alerg,
                            int kcal, int prot, int carb, int gord, int fibra, double preco) {
        Marmita m = new Marmita();
        m.setNome(nome);
        m.setDescricao(desc);
        m.setImagemUrl(img);
        m.setAltText(alt);
        m.setCategoria(cat);
        m.setTipoSugerido(tipo);
        m.setPesoGramas(peso);
        m.setTempoPreparoMin(prep);
        m.setIngredientes(ingr);
        m.setAlergenosJson(alerg);
        m.setKcal(kcal);
        m.setProteinaG(prot);
        m.setCarboG(carb);
        m.setGorduraG(gord);
        m.setFibraG(fibra);
        m.setPrecoAvulso(BigDecimal.valueOf(preco));
        m.setDisponivel(true);
        return m;
    }

    private Plano plano(String nome, String desc, FrequenciaPlano freq, int qtd, boolean nutri, double preco, boolean destaque) {
        Plano p = new Plano();
        p.setNomePlano(nome);
        p.setDescricao(desc);
        p.setFrequencia(freq);
        p.setQtdMarmitas(qtd);
        p.setIncluiConsultaNutri(nutri);
        p.setPreco(BigDecimal.valueOf(preco));
        p.setDestaque(destaque);
        p.setAtivo(true);
        return p;
    }

    private void addItem(CardapioPlanejado c, DiaSemana dia, TipoRefeicao tipo, Marmita m, boolean consumido, boolean travado) {
        CardapioItem item = new CardapioItem();
        item.setCardapio(c);
        item.setDiaSemana(dia);
        item.setTipoRefeicao(tipo);
        item.setHorarioSugerido(tipo.getHorarioPadrao());
        item.setMarmita(m);
        item.setConsumido(consumido);
        item.setTravadoNutri(travado);
        c.getItens().add(item);
    }

    private void addPedidoItem(Pedido p, Marmita m, int qtd) {
        PedidoItem pi = new PedidoItem();
        pi.setPedido(p);
        pi.setMarmita(m);
        pi.setQuantidade(qtd);
        pi.setPrecoUnitario(m.getPrecoAvulso());
        p.getItens().add(pi);
    }
}
