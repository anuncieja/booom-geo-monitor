"use strict";
(() => {
  const api = "https://api.github.com/repos/anuncieja/booom-geo-monitor/";
  const $ = id => document.getElementById(id);
  let token = "", busy = false, queuedAction = null;
  const dialog = $("auth-dialog");
  const setStatus = (message, error=false) => {
    $("run-status").textContent = message;
    $("run-status").className = "job"+(error?" error":"");
  };
  const setBusy = value => {
    busy = value;
    for(const id of ["dispatch","collect","connect"]) $(id).disabled = value;
  };
  const showAuth = () => { $("auth-error").textContent=""; $("token").value=""; if(!dialog.open) dialog.showModal(); $("token").focus(); };
  function forget(){
    token=""; queuedAction=null; $("token").value="";
    $("auth-status").textContent="Não autorizado";
    $("auth-status").className="pill";
    $("connect").textContent="Autorizar painel";
  }
  async function request(path, {method="GET",body,credential=token}={}){
    if(!credential) throw new Error("Autorize a sessão primeiro.");
    const headers={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2026-03-10",Authorization:"Bearer "+credential};
    if(body!==undefined) headers["Content-Type"]="application/json";
    const res=await fetch(api+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:"no-store",redirect:"error",credentials:"omit"});
    if(!res.ok){
      const msg={401:"Token inválido ou expirado.",403:"Acesso negado ou limite da API. Verifique Actions: Read and write.",404:"Repositório/workflow não acessível com este token.",422:"Comando inválido ou workflow indisponível.",429:"Limite de requisições. Tente mais tarde."};
      const error=new Error(msg[res.status]||("GitHub HTTP "+res.status));error.status=res.status;throw error;
    }
    return res.status===204?null:res.json();
  }
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function start(action){
    if(busy) return;
    if(!token){queuedAction=action;showAuth();return}
    setBusy(true);
    try{
      if(action==="enviar"){
        const job=await file("queue/job.json");
        if(!/^poc-gh-[0-9]+$/.test(job.job_id))throw new Error("Fila inválida.");
        try{
          const prior=await file("results/"+job.job_id+".json");
          if(prior.job_id!==job.job_id||prior.status!=="CONCLUIDA"||prior.auditoria_geo_valida!==false)throw new Error("Retorno anterior inválido.");
        }catch(e){if(e.status===404)throw new Error("Já existe um teste pendente. Aguarde o retorno do GPT e clique em Atualizar painel.");throw e}
      }
      setStatus("Enviando comando ao GitHub Actions…");
      const result=await request("actions/workflows/ponte.yml/dispatches",{method:"POST",body:{ref:"main",inputs:{acao:action}}});
      const runId=result?.workflow_run_id;
      if(!Number.isSafeInteger(runId)||runId<=0){
        setStatus("Comando aceito pelo GitHub, mas o identificador da execução não foi retornado. Atualize o painel para consultar a fila.");
        await refresh();return;
      }
      setStatus("Comando aceito. Execução #"+runId+" enfileirada no GitHub.");
      for(let i=0;i<20;i++){
        await sleep(15000);
        const run=await request("actions/runs/"+runId);
        if(run.status!=="completed"){setStatus("Execução #"+runId+" — "+(run.status==="in_progress"?"em processamento":"aguardando execução")+".");continue}
        await refresh();
        if(run.conclusion==="success"){
          setStatus(action==="enviar"?"GitHub concluiu a execução #"+runId+". Novo teste enviado; a resposta do GPT depende da tarefa agendada.":"Recolhimento #"+runId+" concluído. O painel foi atualizado.");
        }else{
          setStatus("Execução #"+runId+" encerrada: "+run.conclusion+". Nenhuma conclusão do GPT foi presumida.",true);
        }
        return;
      }
      setStatus("Execução #"+runId+" ainda não concluída. Use Atualizar painel para acompanhar a fila.");
      await refresh();
    }catch(e){
      if(e.status===401)forget();
      setStatus(e.message+" Se o envio foi interrompido, confira a fila antes de repetir.",true);
    }finally{setBusy(false)}
  }
  $("connect").addEventListener("click",()=>{if(token){forget();setStatus("Sessão encerrada. A leitura pública continua disponível.")}else{queuedAction=null;showAuth()}});
  $("close-auth").addEventListener("click",()=>{queuedAction=null;$("token").value="";dialog.close()});
  dialog.addEventListener("cancel",()=>{queuedAction=null;$("token").value=""});
  $("auth-form").addEventListener("submit",async e=>{
    e.preventDefault();
    const candidate=$("token").value.trim();
    if(!/^github_pat_[A-Za-z0-9_]+$/.test(candidate)){$("auth-error").textContent="Informe um token fine-grained válido (github_pat_…).";return}
    $("auth-submit").disabled=true;$("auth-error").textContent="";
    try{
      const workflow=await request("actions/workflows/ponte.yml",{credential:candidate});
      if(workflow.state!=="active")throw new Error("O workflow não está ativo.");
      token=candidate;$("token").value="";$("auth-status").textContent="Sessão autorizada";$("auth-status").className="pill good";$("connect").textContent="Encerrar sessão";dialog.close();
      setStatus("Token aceito para leitura do workflow. O direito de disparo será confirmado no primeiro envio.");
      const pending=queuedAction;queuedAction=null;if(pending)start(pending);
    }catch(e){$("auth-error").textContent=e.message}finally{$("auth-submit").disabled=false}
  });
  $("dispatch").addEventListener("click",()=>start("enviar"));
  $("collect").addEventListener("click",()=>start("recolher"));
  window.addEventListener("pagehide",forget);
})();
