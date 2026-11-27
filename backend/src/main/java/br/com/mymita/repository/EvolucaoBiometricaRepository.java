package br.com.mymita.repository;

import br.com.mymita.domain.EvolucaoBiometrica;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EvolucaoBiometricaRepository extends JpaRepository<EvolucaoBiometrica, Long> {
    List<EvolucaoBiometrica> findByClienteIdOrderByDataRegistroAsc(Long clienteId);
}
