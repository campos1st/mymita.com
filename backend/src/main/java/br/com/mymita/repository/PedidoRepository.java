package br.com.mymita.repository;

import br.com.mymita.domain.Pedido;
import br.com.mymita.domain.enums.StatusEntrega;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByClienteIdOrderByCriadoEmDesc(Long clienteId);
    List<Pedido> findByStatusEntregaNotInOrderByDataEntregaAsc(List<StatusEntrega> excludedStatuses);
    List<Pedido> findByDataEntregaAndStatusEntregaIn(LocalDate dataEntrega, List<StatusEntrega> statuses);
    Optional<Pedido> findByGatewayPaymentId(String gatewayPaymentId);
}
