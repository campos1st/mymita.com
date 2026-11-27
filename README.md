# MYMita — Sua alimentação saudável no piloto automático

Plataforma Micro-SaaS Web Responsiva (Mobile-First) de planejamento alimentar personalizado, assinatura recorrente de marmitas fitness e acompanhamento nutricional híbrido (**IA Gemini + Nutricionista**).

## Arquitetura

- **Front-end (`/frontend`):** React 18 + TypeScript + Vite + Tailwind CSS, suporte nativo Light/Dark e conformidade WCAG 2.1 AA.
- **Back-end (`/backend`):** Java 21 + Spring Boot 3.4 + Spring Security (JWT stateless) + Spring Data JPA + Flyway + OpenAPI/Swagger.
- **Banco de Dados:** PostgreSQL 16 (via Docker Compose) + perfil `local` com H2 em modo de compatibilidade PostgreSQL para execução imediata sem dependências externas.
- **Integrações:** Google Gemini API e Gateway de Pagamento (Stripe/Mercado Pago) com modo **sandbox** automático quando as chaves não estão configuradas.

## Banco de Dados Real (Supabase)

- **Projeto Supabase:** `MyMita` (`bppbyymrgzlrdzsqltma` — região `sa-east-1` / São Paulo)
- **URL:** `https://bppbyymrgzlrdzsqltma.supabase.co`
- **Dados iniciais:** Usuários, pedidos, cardápios e conversas começam **100% zerados**. Apenas o catálogo base (**12 marmitas**, **6 planos** e **4 faixas de CEP**) está pré-cadastrado.
- **Autenticação & Segurança:** Supabase Auth (`Cadastro` e `Login` reais) + Row-Level Security (RLS) habilitado em todas as 13 tabelas.
- **Assistente Virtual:** **Mila** (personagem 3D animada no canto inferior direito + tela completa de chat).

## Como Rodar com PostgreSQL via Docker Compose
```bash
cp .env.example .env
docker compose up --build
```
