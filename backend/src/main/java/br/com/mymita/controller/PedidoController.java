package br.com.mymita.controller;

import br.com.mymita.domain.Usuario;
import br.com.mymita.dto.PedidoDtos.*;
import br.com.mymita.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @GetMapping("/enderecos/validar-cep/{cep}")
    public ResponseEntity<CepCoberturaResponse> validarCep(@PathVariable String cep) {
        return ResponseEntity.ok(pedidoService.validarCep(cep));
    }

    @GetMapping("/enderecos")
    public ResponseEntity<List<EnderecoResponse>> listarEnderecos(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(pedidoService.listarEnderecos(usuario));
    }

    @PostMapping("/enderecos")
    public ResponseEntity<EnderecoResponse> criarEndereco(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody EnderecoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.criarEndereco(usuario, req));
    }

    @GetMapping("/assinaturas")
    public ResponseEntity<List<AssinaturaResponse>> listarAssinaturas(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(pedidoService.listarAssinaturas(usuario));
    }

    @PatchMapping("/assinaturas/{id}/pausar")
    public ResponseEntity<AssinaturaResponse> pausarAssinatura(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id,
            @Valid @RequestBody PausarAssinaturaRequest req) {
        return ResponseEntity.ok(pedidoService.pausarAssinatura(usuario, id, req.pausarAte()));
    }

    @PatchMapping("/assinaturas/{id}/reativar")
    public ResponseEntity<AssinaturaResponse> reativarAssinatura(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.reativarAssinatura(usuario, id));
    }

    @PostMapping("/pedidos/checkout")
    public ResponseEntity<PedidoResponse> checkout(
            @AuthenticationPrincipal Usuario usuario,
            @Valid @RequestBody CheckoutRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.realizarCheckout(usuario, req));
    }

    @GetMapping("/pedidos")
    public ResponseEntity<List<PedidoResponse>> listarPedidos(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(pedidoService.listarPedidosCliente(usuario));
    }

    @PatchMapping("/pedidos/{id}/cancelar")
    public ResponseEntity<PedidoResponse> cancelarPedido(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.cancelarPedido(usuario, id));
    }

    @PostMapping("/webhooks/pagamentos")
    public ResponseEntity<Map<String, String>> webhookPagamentos(@RequestBody WebhookPagamentoRequest req) {
        String resultado = pedidoService.processarWebhook(req);
        return ResponseEntity.ok(Map.of("status", "ok", "mensagem", resultado));
    }
}
