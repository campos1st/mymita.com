package br.com.mymita.repository;

import br.com.mymita.domain.Marmita;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MarmitaRepository extends JpaRepository<Marmita, Long> {
    List<Marmita> findByDisponivelTrueOrderByIdAsc();
}
