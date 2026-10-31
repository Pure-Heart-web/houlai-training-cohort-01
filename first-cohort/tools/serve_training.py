#!/usr/bin/env python3
"""Local public cohort server. No symlinks, dot files or external roots."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse

ROOT=Path(__file__).resolve().parents[1]
class PublicHandler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_GET(self):
        if not self.allowed(): self.send_error(403,'Public package only');return
        super().do_GET()
    def do_HEAD(self):
        if not self.allowed(): self.send_error(403,'Public package only');return
        super().do_HEAD()
    def allowed(self):
        parts=Path(unquote(urlsplit(self.path).path).lstrip('/')).parts
        if any(p.startswith('.') or p=='..' for p in parts): return False
        target=ROOT
        for part in parts:
            target=target/part
            if target.is_symlink(): return False
        return target.resolve().is_relative_to(ROOT)
    def list_directory(self,path):
        self.send_error(403,'Directory listing disabled');return None

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('port',type=int,nargs='?',default=8765);args=parser.parse_args()
    if not 1024<=args.port<=65535: parser.error('port must be 1024..65535')
    print(f'公开模拟训练包：http://127.0.0.1:{args.port}/console/',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),PublicHandler).serve_forever()
