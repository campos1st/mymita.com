package br.com.mymita.repository;

import br.com.mymita.domain.FaixaCepCobertura;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FaixaCepCoberturaRepository extends JpaRepository<FaixaCepCobertura, Long> {
    List<FaixaCepCobertura> findByAtivoTrue();
}
