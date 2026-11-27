package br.com.mymita.controller;

import br.com.mymita.domain.Usuario;
import br.com.mymita.domain.enums.CategoriaMarmita;
import br.com.mymita.dto.CatalogoDtos.*;
import br.com.mymita.service.CatalogoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class CatalogoController {

    private final CatalogoService catalogoService;

    public CatalogoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @GetMapping("/marmitas")
    public ResponseEntity<List<MarmitaResponse>> listarMarmitas(
            @RequestParam(required = false) CategoriaMarmita categoria,
            @RequestParam(required = false) Integer kcalMin,
            @RequestParam(required = false) Integer kcalMax,
            @RequestParam(required = false) String busca,
            @RequestParam(defaultValue = "false") boolean filtrarAlergenos,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(catalogoService.listarMarmitas(
                categoria, kcalMin, kcalMax, busca, filtrarAlergenos, usuario));
    }

    @GetMapping("/marmitas/{id}")
    public ResponseEntity<MarmitaResponse> buscarMarmita(@PathVariable Long id) {
        return ResponseEntity.ok(catalogoService.buscarMarmita(id));
    }

    @GetMapping("/planos")
    public ResponseEntity<List<PlanoResponse>> listarPlanos() {
        return ResponseEntity.ok(catalogoService.listarPlanosAtivos());
    }
}
