package br.com.mymita.repository;

import br.com.mymita.domain.CardapioItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardapioItemRepository extends JpaRepository<CardapioItem, Long> {
}
