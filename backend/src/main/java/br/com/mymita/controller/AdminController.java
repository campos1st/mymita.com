package br.com.mymita.controller;

import br.com.mymita.dto.AdminDtos.*;
import br.com.mymita.dto.CatalogoDtos.*;
import br.com.mymita.dto.PedidoDtos.*;
import br.com.mymita.service.CatalogoService;
import br.com.mymita.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final CatalogoService catalogoService;
    private final PedidoService pedidoService;

    public AdminController(CatalogoService catalogoService, PedidoService pedidoService) {
        this.catalogoService = catalogoService;
        this.pedidoService = pedidoService;
    }

    @GetMapping("/marmitas")
    public ResponseEntity<List<MarmitaResponse>> listarMarmitas() {
        return ResponseEntity.ok(catalogoService.listarTodasAdmin());
    }

    @PostMapping("/marmitas")
    public ResponseEntity<MarmitaResponse> criarMarmita(@Valid @RequestBody MarmitaUpsertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogoService.criarMarmita(req));
    }

    @PutMapping("/marmitas/{id}")
    public ResponseEntity<MarmitaResponse> atualizarMarmita(
            @PathVariable Long id,
            @Valid @RequestBody MarmitaUpsertRequest req) {
        return ResponseEntity.ok(catalogoService.atualizarMarmita(id, req));
    }

    @DeleteMapping("/marmitas/{id}")
    public ResponseEntity<Void> inativarMarmita(@PathVariable Long id) {
        catalogoService.inativarMarmita(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/planos")
    public ResponseEntity<PlanoResponse> criarPlano(@Valid @RequestBody PlanoUpsertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogoService.criarPlano(req));
    }

    @PutMapping("/planos/{id}")
    public ResponseEntity<PlanoResponse> atualizarPlano(
            @PathVariable Long id,
            @Valid @RequestBody PlanoUpsertRequest req) {
        return ResponseEntity.ok(catalogoService.atualizarPlano(id, req));
    }

    @GetMapping("/producao")
    public ResponseEntity<RelatorioProducaoResponse> relatorioProducao(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataEntrega) {
        return ResponseEntity.ok(pedidoService.relatorioProducaoAdmin(dataEntrega));
    }

    @PatchMapping("/pedidos/{id}/status")
    public ResponseEntity<PedidoResponse> atualizarStatusPedido(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarStatusPedidoRequest req) {
        return ResponseEntity.ok(pedidoService.atualizarStatusAdmin(id, req.statusEntrega()));
    }

    @GetMapping("/ceps")
    public ResponseEntity<List<FaixaCepResponse>> listarCeps() {
        return ResponseEntity.ok(pedidoService.listarFaixasCep());
    }

    @PostMapping("/ceps")
    public ResponseEntity<FaixaCepResponse> criarCep(@Valid @RequestBody FaixaCepRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.criarFaixaCep(req));
    }

    @DeleteMapping("/ceps/{id}")
    public ResponseEntity<Void> removerCep(@PathVariable Long id) {
        pedidoService.removerFaixaCep(id);
        return ResponseEntity.noContent().build();
    }
}
