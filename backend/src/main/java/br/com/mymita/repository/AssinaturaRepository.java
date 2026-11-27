package br.com.mymita.repository;

import br.com.mymita.domain.Assinatura;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AssinaturaRepository extends JpaRepository<Assinatura, Long> {
    List<Assinatura> findByClienteIdOrderByDataInicioDesc(Long clienteId);
    Optional<Assinatura> findByGatewaySubscriptionId(String gatewaySubscriptionId);
}
