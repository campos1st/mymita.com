package br.com.mymita.repository;

import br.com.mymita.domain.Endereco;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EnderecoRepository extends JpaRepository<Endereco, Long> {
    List<Endereco> findByUsuarioIdAndAtivoTrue(Long usuarioId);
}
