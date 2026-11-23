# BOOOM GEO Monitor — POC 0.2

Ponte privada GitHub ↔ ChatGPT agendado ↔ Google Sheets, sem API da OpenAI e sem chave Google no GitHub.

## Arquitetura
GitHub registra um job em `queue/job.json`; uma tarefa agendada do ChatGPT consulta esse arquivo com o conector GitHub, registra o job e a resposta na aba FILA do [Google Sheets](https://docs.google.com/spreadsheets/d/1k2q18JGn1-w23F68JHJA11AJagd0-wIKW79S2V7Pk_w/edit), e publica o retorno em `results/<job_id>.json` via conector GitHub. O Actions verifica o retorno e gera um artefato JSON. O GitHub não acessa diretamente o Google: o GPT é a ponte. Sem credenciais adicionais.

A tarefa horária não é webhook; pode sofrer atraso ou exigir autorização. O job inicial vem de um commit do conector GitHub, não de um workflow. O workflow permite disparar um próximo teste manualmente após o anterior concluir. O histórico de respostas permanece em results/.

## Operação
- Acompanhe a fila em queue/job.json e os retornos em results/.
- Actions > GEO bridge POC > Run workflow > enviar: registra uma pergunta neutra, somente se a anterior tiver retorno válido.
- Actions > recolher: verifica o retorno. A rotina horária também recolhe.
- O workflow não acessa o ChatGPT diretamente e não utiliza credenciais Google.
- `python -m unittest -v` executa testes locais de validação de fila e resultado.

## Limites
Somente o teste técnico fixo "Qual é a capital de Minas Gerais?" é aceito nesta fase. As 15 perguntas GEO ficam em consultas.json e NÃO são executadas ainda. Uma tarefa agendada não comprova sessões independentes do ChatGPT; nenhum teste técnico conta como observação GEO. Não substituir por buscas web ou API. A independência das respostas e os relatórios dependem de validação posterior.

Para pausar, desative o workflow e a tarefa GEO — Teste da ponte. Não publique o repositório ou a planilha.
