package br.com.mymita.repository;

import br.com.mymita.domain.CardapioPlanejado;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CardapioPlanejadoRepository extends JpaRepository<CardapioPlanejado, Long> {
    Optional<CardapioPlanejado> findTopByClienteIdOrderBySemanaReferenciaDesc(Long clienteId);
}
