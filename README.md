# BOOOM GEO Monitor — POC 0.3

Ponte GitHub ↔ ChatGPT agendado ↔ Google Sheets, sem API OpenAI. Painel estático em `docs/`, preparado para GitHub Pages (main, /docs). O painel usa somente a API pública de leitura do GitHub, sem tokens. Não permite disparo anônimo.

## Arquitetura
O GitHub registra um job em queue/job.json; a tarefa agendada do ChatGPT consulta esse arquivo via conector GitHub, registra a resposta na planilha operacional autorizada e publica o retorno em results/<job_id>.json. Actions verifica o retorno e gera um artefato JSON. A planilha permanece privada. A tarefa horária não é webhook.

## Operação
- Actions > GEO bridge POC > Run workflow > enviar: cria novo teste somente após retorno válido do anterior.
- recolher: verifica o retorno. A rotina horária também recolhe.
- `python -m unittest -v`: testes de validação.
- Pages: Settings > Pages > Deploy from a branch > main > /docs > Save.

## Limites
Somente teste técnico neutro autorizado. As 15 consultas GEO em consultas.json ainda não são executadas. Uma tarefa agendada não comprova sessões independentes. Não confundir retornos técnicos com recomendações GEO. Nenhum relatório GEO é publicado enquanto não existir coleta válida.

## Privacidade
Não armazene chaves, informações privadas de clientes ou respostas sensíveis no repositório público. A visibilidade pública expõe todo o histórico Git e os arquivos de fila/retorno. Uma referência à planilha operacional aparece em commits anteriores; a planilha não deve ser compartilhada publicamente. Para proteger dados futuros, use uma área privada separada e publique apenas informações aprovadas.
