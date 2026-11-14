# Roadmap

| Fase | Objetivo | Estado |
|---|---|---|
| **1. Motor + registro** | Motor genérico, registro de 21 indicadores/33 medidas, contrato de dados, testes contra referência independente | ✅ feito |
| **2. Interface ASG** | Visão ASG, Ambiental, Social, Governança, Empresas e projetos, Indicadores e método; catálogo GRI (130, privado) | ✅ feito (protótipo) |
| **3. Escalabilidade** | Importação **CSV e XLSX** (e `metricas.json`) pelo navegador, sem persistência; validação com mensagens claras; segundo tema de demonstração | ⏳ próximo |
| **4. Pontuação ASG** | `config/metricas.json` (pesos, piso/teto, faixas, justificativas); nota por pilar, ASG geral e por entidade; página de método com a conta; sensibilidade dos pesos | ✅ implementado (D5, D15); falta calibrar limites com dados reais |
| **5. Mais indicadores** | Subir indicadores do catálogo de *catalogado* para *calculável*, começando pelos de `indicadores-candidatos.md` | ⏳ contínuo |
| **5b. Modo apresentação e identidade** | Tela cheia, navegação por teclado, tipografia de reunião, logo e nome da Investe Piauí (`config/identidade.json`, `assets/`) | ⏳ próximo |
| **6. Entrega e apresentação** | Manual de uso, roteiro do pitch focado no T8, ensaio | ⏳ até 27/11 |

## Ideias futuras (fora do escopo da disciplina)

> Decidido em 14/11: **não haverá exportação** (PDF/CSV/imagem); a apresentação acontece dentro da ferramenta.


- Pacote em arquivo único (`tools/empacotar`) para abrir offline sem servidor.
- Backend + banco + autenticação para uso real pela Investe Piauí.
- Histórico de versões dos dados e trilha de auditoria.
