package br.com.mymita.dto;

import br.com.mymita.domain.enums.RemetenteChat;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public final class ChatDtos {
    private ChatDtos() {}

    public record EnviarMensagemRequest(
            @NotBlank(message = "Digite sua mensagem") String conteudo
    ) {}

    public record MensagemResponse(
            Long id,
            RemetenteChat remetenteTipo,
            String conteudo,
            CatalogoDtos.MarmitaResponse marmitaSugerida,
            LocalDateTime timestamp
    ) {}
}
