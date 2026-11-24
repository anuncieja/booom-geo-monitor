"use strict";
(() => {
 const progress=document.getElementById("geo-progress"), list=document.getElementById("geo-items"), btn=document.getElementById("geo-refresh");
 async function loadGeo(){
  btn.disabled=true;
  try{
   const q=await file("geo/queue.json");const r=await file("geo/rounds/"+q.rodada+".json");
   if(q.metodo!=="GEO_EXPERIMENTAL_TAREFAS_GPT"||r.rodada!==q.rodada||!Array.isArray(r.respostas))throw new Error("Rodada inválida.");
   const valid=r.respostas.filter(x=>q.items.some(y=>y.id===x.id&&y.pergunta===x.pergunta)&&x.status==="CONCLUIDA"&&x.independencia_comprovada===false&&typeof x.resposta==="string"&&x.resposta.trim());
   const byId=new Map(valid.map(x=>[x.id,x]));const completed=byId.size;
   progress.textContent=q.rodada+" · "+completed+"/"+q.items.length+" respostas experimentais · "+(q.items.length-completed)+" pendentes · 0 independentes comprovadas";
   list.replaceChildren();
   for(const [id,city,question] of queries.length?queries:q.items.filter(x=>x.repeticao===1).map(x=>[x.consulta,x.cidade,x.pergunta])){
     const d=node("details","","job"), related=q.items.filter(x=>x.consulta===id);
     d.append(node("summary",id+" · "+city+" · "+question+" ("+related.filter(x=>byId.has(x.id)).length+"/3)"));
     for(const item of related){const a=byId.get(item.id);const block=node("div","","job");block.append(node("small","Repetição "+item.repeticao+" · "+(a?a.origem:"Pendente")));if(a){block.append(node("p",a.resposta),node("small","Data: "+a.respondido_em+" · Modelo: "+(a.modelo||"N/D")+" · Independência: não comprovada"));if(Array.isArray(a.fontes)&&a.fontes.length)block.append(node("p","Fontes registradas: "+a.fontes.join(" | ")));}d.append(block)}list.append(d)
   }
  }catch(e){progress.textContent="Não foi possível consultar a rodada: "+e.message;}finally{btn.disabled=false}
 }
 btn.addEventListener("click",loadGeo);loadGeo();setInterval(()=>{if(!document.hidden&&!btn.disabled)loadGeo()},120000);
})();