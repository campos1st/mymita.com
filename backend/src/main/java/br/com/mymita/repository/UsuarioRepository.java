package br.com.mymita.repository;

import br.com.mymita.domain.Usuario;
import br.com.mymita.domain.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<Usuario> findByRoleAndAtivoTrue(Role role);
}
