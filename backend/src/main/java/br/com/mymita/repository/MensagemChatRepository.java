package br.com.mymita.repository;

import br.com.mymita.domain.MensagemChat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MensagemChatRepository extends JpaRepository<MensagemChat, Long> {
    List<MensagemChat> findByClienteIdOrderByTimestampAsc(Long clienteId);
}
