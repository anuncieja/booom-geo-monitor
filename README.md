# BOOOM GEO Monitor — POC 0.4.1

Ponte GitHub ↔ ChatGPT agendado ↔ Google Sheets, sem API OpenAI. Painel estático em `docs/`, preparado para GitHub Pages (main, /docs). O painel lê dados públicos e dispara workflows com token fine-grained, restrito ao repositório e mantido exclusivamente em memória durante a sessão aberta. Não permite disparo anônimo.

## Arquitetura
O GitHub registra um job em queue/job.json; a tarefa agendada do ChatGPT consulta esse arquivo via conector GitHub, registra a resposta na planilha operacional autorizada e publica o retorno em results/<job_id>.json. Actions verifica o retorno e registra um resumo no log do job, sem armazenar artefatos pagos. A planilha permanece privada. A tarefa horária não é webhook.

## Operação
- Painel > Autorizar painel: forneça um token fine-grained de acesso exclusivo ao repositório com Actions: Read and write; não use tokens clássicos ou amplos. Não cole em chats ou commits. O token não é armazenado e precisa ser informado após recarregar a página.
- Executar teste agora: dispara workflow_dispatch diretamente via GitHub REST, cria novo teste somente após retorno válido do anterior. Recolher resultados dispara o modo recolher. O painel acompanha o workflow pelo ID retornado pela API 2026-03-10. O GPT ainda depende da tarefa agendada.
- recolher: verifica o retorno. A rotina horária também recolhe.
- `python -m unittest -v`: testes de validação.
- Pages: Settings > Pages > Deploy from a branch > main > /docs > Save.

## Limites
Somente teste técnico neutro autorizado. As 15 consultas GEO em consultas.json ainda não são executadas. Uma tarefa agendada não comprova sessões independentes. Não confundir retornos técnicos com recomendações GEO. Nenhum relatório GEO é publicado enquanto não existir coleta válida.

## Privacidade
Não armazene chaves, informações privadas de clientes ou respostas sensíveis no repositório público. A visibilidade pública expõe todo o histórico Git e os arquivos de fila/retorno. Uma referência à planilha operacional aparece em commits anteriores; a planilha não deve ser compartilhada publicamente. Para proteger dados futuros, use uma área privada separada e publique apenas informações aprovadas.

## Controle de custos
- Repositório público, GitHub Pages e runner padrão `ubuntu-latest`.
- Sem API OpenAI, sem API paga, sem runner premium, sem upload de artefatos pela ponte e sem domínio pago.
- Os resultados técnicos pequenos ficam no Git; não publique dados confidenciais.
- A tarefa ChatGPT utiliza a franquia do plano existente. Em caso de limite, interrompa e aguarde a renovação da franquia; não compre créditos automaticamente.
- A hospedagem e a automação respeitam os limites e termos dos serviços. Não há promessa de uso ilimitado ou gratuito para sempre.

### Diagnóstico de acesso
A leitura usa o token quando autorizado, inclusive para a pré-validação da fila. A interface distingue erro HTTP de leitura, disparo e acompanhamento, e mostra a mensagem do GitHub sem expor o token. A autorização de leitura não comprova permissão de disparo; esta é confirmada após POST bem-sucedido. Não há ampliação automática de permissões.
