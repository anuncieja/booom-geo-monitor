import tempfile, unittest
from pathlib import Path
from bridge import QUESTION, submit, collect, save, validate_job
class TestBridge(unittest.TestCase):
    def test_cycle(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            job=submit(root,"123")
            self.assertEqual(collect(root)["status"],"PENDENTE")
            self.assertEqual(submit(root,"123"),job)
            with self.assertRaises(RuntimeError): submit(root,"124")
            save(root/"results/poc-gh-123.json",{"job_id":job["job_id"],"pergunta":QUESTION,"status":"CONCLUIDA","resposta":"Belo Horizonte.","respondido_em":"2026-11-23","origem":"mock","evidencia":"mock","auditoria_geo_valida":False})
            self.assertEqual(collect(root)["status"],"RETORNO_VALIDADO")
            self.assertEqual(submit(root,"124")["job_id"],"poc-gh-124")
    def test_invalid(self):
        with self.assertRaises(ValueError): validate_job({"job_id":"../etc"})
    def test_invalid_return(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            submit(root,"1")
            save(root/"results/poc-gh-1.json",{"status":"CONCLUIDA"})
            with self.assertRaises(ValueError): collect(root)
if __name__=="__main__": unittest.main()
