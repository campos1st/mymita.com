package br.com.mymita.repository;

import br.com.mymita.domain.PerfilNutricional;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PerfilNutricionalRepository extends JpaRepository<PerfilNutricional, Long> {
    Optional<PerfilNutricional> findByClienteId(Long clienteId);
    List<PerfilNutricional> findByNutricionistaId(Long nutricionistaId);
}
