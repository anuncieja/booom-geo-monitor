"""POC de fila GitHub. ChatGPT, não este script, comunica com Sheets."""
import argparse
import json
import os
import re
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo

QUESTION = "Qual é a capital de Minas Gerais?"

def now():
    return datetime.now(ZoneInfo("America/Sao_Paulo")).isoformat(timespec="seconds")

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def validate_job(job):
    if (job.get("schema") != 1 or not re.fullmatch(r"poc-gh-[0-9]+", str(job.get("job_id","")))
        or job.get("pergunta") != QUESTION or job.get("tipo") != "TESTE_TECNICO"):
        raise ValueError("Job fora do escopo autorizado.")
    return job

def valid_return(job, result):
    return (result.get("job_id") == job["job_id"] and result.get("pergunta") == QUESTION
        and result.get("status") == "CONCLUIDA" and "belo horizonte" in str(result.get("resposta","")).lower()
        and result.get("auditoria_geo_valida") is False and bool(result.get("respondido_em"))
        and bool(result.get("evidencia")) and bool(result.get("origem")))

def collect(root):
    job = validate_job(load(root / "queue/job.json"))
    path = root / "results" / (job["job_id"] + ".json")
    result = load(path) if path.exists() else None
    status = "PENDENTE" if result is None else ("RETORNO_VALIDADO" if valid_return(job,result) else "RETORNO_INVALIDO")
    report = {"coletado_em":now(), "status":status, "job":job, "retorno":result, "auditoria_geo_valida":False}
    save(root / "output/retorno.json",report)
    print(status, job["job_id"])
    if status == "RETORNO_INVALIDO":
        raise ValueError("Retorno inválido; revisar evidência.")
    return report

def submit(root, run_id):
    if not re.fullmatch(r"[0-9]+",run_id):
        raise ValueError("GITHUB_RUN_ID inválido")
    path = root / "queue/job.json"
    if path.exists():
        old = validate_job(load(path))
        if old["job_id"] == "poc-gh-"+run_id:
            return old
        prev = root / "results" / (old["job_id"]+".json")
        if not prev.exists() or not valid_return(old,load(prev)):
            raise RuntimeError("Job anterior ainda pendente ou inválido; preservado.")
    job = {"schema":1,"job_id":"poc-gh-"+run_id,"pergunta":QUESTION,"tipo":"TESTE_TECNICO","criado_em":now(),"origem":"github_actions"}
    save(path,job)
    print("ENFILEIRADO",job["job_id"])
    return job

if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("acao",choices=["enviar","recolher"])
    args=parser.parse_args()
    if args.acao == "enviar":
        submit(Path("."),os.environ.get("GITHUB_RUN_ID",""))
    else:
        collect(Path("."))
