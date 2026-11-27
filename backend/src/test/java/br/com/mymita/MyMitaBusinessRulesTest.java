package br.com.mymita;

import br.com.mymita.domain.*;
import br.com.mymita.domain.enums.*;
import br.com.mymita.dto.AuthDtos.*;
import br.com.mymita.dto.PedidoDtos.*;
import br.com.mymita.dto.PerfilDtos.*;
import br.com.mymita.exception.BusinessException;
import br.com.mymita.repository.*;
import br.com.mymita.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Transactional
class MyMitaBusinessRulesTest {

    @Autowired private AuthService authService;
    @Autowired private NutricaoService nutricaoService;
    @Autowired private CardapioService cardapioService;
    @Autowired private GeminiChatService chatService;
    @Autowired private PedidoService pedidoService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private MarmitaRepository marmitaRepository;
    @Autowired private EnderecoRepository enderecoRepository;
    @Autowired private CardapioPlanejadoRepository cardapioRepository;

    @Test
    void deveCalcularTmbGetEMetasNoOnboarding() {
        AuthResponse reg = authService.register(new RegisterRequest(
                "Teste Onboarding", "onboarding@mymita.test", "Senha@123",
                "123.456.789-00", "(61) 99999-0000", Role.CLIENTE, null, true));
        Usuario u = usuarioRepository.findById(reg.usuario().id()).orElseThrow();

        PerfilResponse perfil = nutricaoService.salvarOnboarding(u, new OnboardingRequest(
                BigDecimal.valueOf(80.0), 180, 28, SexoBiologico.MASCULINO,
                NivelAtividade.MODERADO, ObjetivoNutricional.HIPERTROFIA,
                List.of("sem_lactose"), List.of("amendoim")));

        assertThat(perfil.tmbKcal()).isGreaterThan(1700);
        assertThat(perfil.getKcal()).isGreaterThan(perfil.tmbKcal());
        assertThat(perfil.metaKcal()).isGreaterThan(perfil.getKcal());
        assertThat(perfil.metaProteinaG()).isGreaterThan(140);
        assertThat(perfil.onboardingConcluido()).isTrue();
    }

    @Test
    void rn02_deveBloquearAlergenosNoCardapioENoChatIA() {
        Usuario alan = usuarioRepository.findByEmailIgnoreCase("alan@mymita.com.br").orElseThrow();
        Marmita comAmendoim = marmitaRepository.findAll().stream()
                .filter(m -> m.getAlergenosJson().contains("amendoim"))
                .findFirst().orElseThrow();

        CardapioPlanejado cardapio = cardapioRepository.findTopByClienteIdOrderBySemanaReferenciaDesc(alan.getId()).orElseThrow();
        CardapioItem itemLivre = cardapio.getItens().stream().filter(i -> !i.isTravadoNutri()).findFirst().orElseThrow();

        assertThatThrownBy(() -> cardapioService.trocarPrato(alan, itemLivre.getId(), comAmendoim.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("RN02");

        var msgs = chatService.enviarParaIa(alan, "Quero um shake com pasta de amendoim para hipertrofia");
        var respostaIa = msgs.getLast();
        assertThat(respostaIa.marmitaSugerida()).isNotNull();
        assertThat(respostaIa.marmitaSugerida().alergenos()).doesNotContain("amendoim");
    }

    @Test
    void rn06_clienteNaoPodeAlterarRefeicaoTravadaPeloNutricionista() {
        Usuario alan = usuarioRepository.findByEmailIgnoreCase("alan@mymita.com.br").orElseThrow();
        CardapioPlanejado cardapio = cardapioRepository.findTopByClienteIdOrderBySemanaReferenciaDesc(alan.getId()).orElseThrow();
        CardapioItem itemTravado = cardapio.getItens().stream().filter(CardapioItem::isTravadoNutri).findFirst().orElseThrow();
        Marmita outra = marmitaRepository.findAll().stream()
                .filter(m -> !m.getId().equals(itemTravado.getMarmita().getId()) && !m.getAlergenosJson().contains("amendoim"))
                .findFirst().orElseThrow();

        assertThatThrownBy(() -> cardapioService.trocarPrato(alan, itemTravado.getId(), outra.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("RN06");
    }

    @Test
    void rn05_deveValidarAreaDeCoberturaDeCep() {
        CepCoberturaResponse df = pedidoService.validarCep("72445-020");
        CepCoberturaResponse fora = pedidoService.validarCep("69900-000");

        assertThat(df.atendido()).isTrue();
        assertThat(fora.atendido()).isFalse();
    }

    @Test
    void rn01_e_rn03_devemProtegerJanela24hELiberacaoPorPagamento() {
        Usuario alan = usuarioRepository.findByEmailIgnoreCase("alan@mymita.com.br").orElseThrow();
        Endereco end = enderecoRepository.findByUsuarioIdAndAtivoTrue(alan.getId()).getFirst();
        Marmita m = marmitaRepository.findByDisponivelTrueOrderByIdAsc().getFirst();

        // Checkout com PIX_PENDENTE nasce como AGUARDANDO_PAGAMENTO (RN03)
        PedidoResponse p = pedidoService.realizarCheckout(alan, new CheckoutRequest(
                null, end.getId(), LocalDate.now().plusDays(4), "18:00 - 20:00",
                "PIX_PENDENTE", "Teste RN03", List.of(new CheckoutItemRequest(m.getId(), 2))));

        assertThat(p.statusEntrega()).isEqualTo(StatusEntrega.AGUARDANDO_PAGAMENTO);
        assertThatThrownBy(() -> pedidoService.atualizarStatusAdmin(p.id(), StatusEntrega.EM_PREPARO))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("RN03");

        // Webhook confirma pagamento e libera produção
        pedidoService.processarWebhook(new WebhookPagamentoRequest(p.gatewayPaymentId(), null, "payment_succeeded"));
        PedidoResponse confirmado = pedidoService.atualizarStatusAdmin(p.id(), StatusEntrega.EM_PREPARO);
        assertThat(confirmado.statusEntrega()).isEqualTo(StatusEntrega.EM_PREPARO);
    }
}
