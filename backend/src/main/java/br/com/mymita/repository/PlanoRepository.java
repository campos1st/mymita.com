package br.com.mymita.repository;

import br.com.mymita.domain.Plano;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlanoRepository extends JpaRepository<Plano, Long> {
    List<Plano> findByAtivoTrueOrderByPrecoAsc();
}
