#!/usr/bin/env python3
"""Package only the public first-cohort directory, never the repository root."""
from pathlib import Path
import argparse
import hashlib
import zipfile
from check_training import inspect

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[2]/'artifacts/houlai-cohort-v2-learner.zip');args=parser.parse_args()
    root=Path(__file__).resolve().parents[1];output=args.output.resolve()
    if output.is_relative_to(root): parser.error('输出必须在学员目录外，避免循环打包')
    errors=inspect(root)
    if errors: raise SystemExit('\n'.join(errors))
    files=sorted(p for p in root.rglob('*') if p.is_file() and not any(x.startswith('.') or x=='__pycache__' for x in p.relative_to(root).parts))
    output.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as archive:
        for p in files: archive.write(p,Path('first-cohort')/p.relative_to(root))
    print(f'公开学员包：{output}\n文件数：{len(files)}\nSHA-256：{hashlib.sha256(output.read_bytes()).hexdigest()}')
    print('仅包含 first-cohort；未打包仓库根目录旧草稿、.git 或仓库外资料。')
