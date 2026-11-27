package br.com.mymita.service;

import br.com.mymita.domain.Marmita;
import br.com.mymita.domain.PerfilNutricional;
import br.com.mymita.domain.Plano;
import br.com.mymita.domain.Usuario;
import br.com.mymita.domain.enums.CategoriaMarmita;
import br.com.mymita.domain.enums.TipoRefeicao;
import br.com.mymita.dto.CatalogoDtos.*;
import br.com.mymita.exception.ResourceNotFoundException;
import br.com.mymita.repository.MarmitaRepository;
import br.com.mymita.repository.PerfilNutricionalRepository;
import br.com.mymita.repository.PlanoRepository;
import br.com.mymita.util.JsonListUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CatalogoService {

    private final MarmitaRepository marmitaRepository;
    private final PlanoRepository planoRepository;
    private final PerfilNutricionalRepository perfilRepository;
    private final NutricaoService nutricaoService;

    public CatalogoService(
            MarmitaRepository marmitaRepository,
            PlanoRepository planoRepository,
            PerfilNutricionalRepository perfilRepository,
            NutricaoService nutricaoService) {
        this.marmitaRepository = marmitaRepository;
        this.planoRepository = planoRepository;
        this.perfilRepository = perfilRepository;
        this.nutricaoService = nutricaoService;
    }

    public List<MarmitaResponse> listarMarmitas(
            CategoriaMarmita categoria,
            Integer kcalMin,
            Integer kcalMax,
            String busca,
            boolean filtrarAlergenosPerfil,
            Usuario usuarioLogado) {

        PerfilNutricional perfil = (filtrarAlergenosPerfil && usuarioLogado != null)
                ? perfilRepository.findByClienteId(usuarioLogado.getId()).orElse(null)
                : null;

        return marmitaRepository.findByDisponivelTrueOrderByIdAsc().stream()
                .filter(m -> categoria == null || m.getCategoria() == categoria)
                .filter(m -> kcalMin == null || m.getKcal() >= kcalMin)
                .filter(m -> kcalMax == null || m.getKcal() <= kcalMax)
                .filter(m -> {
                    if (busca == null || busca.isBlank()) return true;
                    String q = busca.toLowerCase();
                    return m.getNome().toLowerCase().contains(q)
                            || m.getIngredientes().toLowerCase().contains(q)
                            || m.getDescricao().toLowerCase().contains(q);
                })
                .filter(m -> perfil == null || nutricaoService.marmitaEhSeguraParaPerfil(m, perfil))
                .map(this::toMarmitaResponse)
                .toList();
    }

    public List<MarmitaResponse> listarTodasAdmin() {
        return marmitaRepository.findAll().stream().map(this::toMarmitaResponse).toList();
    }

    public MarmitaResponse buscarMarmita(Long id) {
        Marmita m = marmitaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marmita não encontrada."));
        return toMarmitaResponse(m);
    }

    @Transactional
    public MarmitaResponse criarMarmita(MarmitaUpsertRequest req) {
        Marmita m = new Marmita();
        applyMarmita(m, req);
        return toMarmitaResponse(marmitaRepository.save(m));
    }

    @Transactional
    public MarmitaResponse atualizarMarmita(Long id, MarmitaUpsertRequest req) {
        Marmita m = marmitaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marmita não encontrada."));
        applyMarmita(m, req);
        return toMarmitaResponse(marmitaRepository.save(m));
    }

    @Transactional
    public void inativarMarmita(Long id) {
        Marmita m = marmitaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Marmita não encontrada."));
        m.setDisponivel(false);
        marmitaRepository.save(m);
    }

    public List<PlanoResponse> listarPlanosAtivos() {
        return planoRepository.findByAtivoTrueOrderByPrecoAsc().stream()
                .map(this::toPlanoResponse)
                .toList();
    }

    @Transactional
    public PlanoResponse criarPlano(PlanoUpsertRequest req) {
        Plano p = new Plano();
        applyPlano(p, req);
        return toPlanoResponse(planoRepository.save(p));
    }

    @Transactional
    public PlanoResponse atualizarPlano(Long id, PlanoUpsertRequest req) {
        Plano p = planoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plano não encontrado."));
        applyPlano(p, req);
        return toPlanoResponse(planoRepository.save(p));
    }

    private void applyMarmita(Marmita m, MarmitaUpsertRequest req) {
        m.setNome(JsonListUtil.sanitizeText(req.nome()));
        m.setDescricao(JsonListUtil.sanitizeText(req.descricao()));
        m.setImagemUrl(req.imagemUrl().trim());
        m.setAltText(JsonListUtil.sanitizeText(req.altText()));
        m.setCategoria(req.categoria());
        m.setTipoSugerido(req.tipoSugerido() != null ? req.tipoSugerido() : TipoRefeicao.ALMOCO);
        m.setPesoGramas(req.pesoGramas() != null ? req.pesoGramas() : 350);
        m.setTempoPreparoMin(req.tempoPreparoMin() != null ? req.tempoPreparoMin() : 5);
        m.setIngredientes(JsonListUtil.sanitizeText(req.ingredientes()));
        m.setAlergenosJson(JsonListUtil.toJson(req.alergenos()));
        m.setKcal(req.kcal());
        m.setProteinaG(req.proteinaG());
        m.setCarboG(req.carboG());
        m.setGorduraG(req.gorduraG());
        m.setFibraG(req.fibraG() != null ? req.fibraG() : 5);
        m.setPrecoAvulso(req.precoAvulso());
        if (req.disponivel() != null) m.setDisponivel(req.disponivel());
    }

    private void applyPlano(Plano p, PlanoUpsertRequest req) {
        p.setNomePlano(JsonListUtil.sanitizeText(req.nomePlano()));
        p.setDescricao(JsonListUtil.sanitizeText(req.descricao()));
        p.setFrequencia(req.frequencia());
        p.setQtdMarmitas(req.qtdMarmitas());
        p.setIncluiConsultaNutri(req.incluiConsultaNutri());
        p.setPreco(req.preco());
        p.setDestaque(req.destaque());
        if (req.ativo() != null) p.setAtivo(req.ativo());
    }

    public MarmitaResponse toMarmitaResponse(Marmita m) {
        return new MarmitaResponse(
                m.getId(),
                m.getNome(),
                m.getDescricao(),
                m.getImagemUrl(),
                m.getAltText(),
                m.getCategoria(),
                m.getTipoSugerido(),
                m.getPesoGramas(),
                m.getTempoPreparoMin(),
                m.getIngredientes(),
                JsonListUtil.parseList(m.getAlergenosJson()),
                m.getKcal(),
                m.getProteinaG(),
                m.getCarboG(),
                m.getGorduraG(),
                m.getFibraG(),
                m.getPrecoAvulso(),
                m.isDisponivel()
        );
    }

    public PlanoResponse toPlanoResponse(Plano p) {
        return new PlanoResponse(
                p.getId(),
                p.getNomePlano(),
                p.getDescricao(),
                p.getFrequencia(),
                p.getQtdMarmitas(),
                p.isIncluiConsultaNutri(),
                p.getPreco(),
                p.isDestaque(),
                p.isAtivo()
        );
    }
}
