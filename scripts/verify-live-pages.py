#!/usr/bin/env python3
"""HTTP smoke: verify Pages serves the expected entrypoint and source SHA, no user data."""
from pathlib import Path
import json
import time
import urllib.request

root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'DEPLOYMENT_SOURCE.json').read_text(encoding='utf-8'))
site=manifest['publishedSite']
sha=manifest['sourceCommit']
checks={
  'index.html': 'storage.js?v=0.7.5-db4',
  'storage.js': 'indexedDB.open(DB_NAME, 4)',
  'build-info.js': "const revision = '"+sha+"';",
}
for attempt in range(18):
    try:
        for path,needle in checks.items():
            address=site+(path if path!='index.html' else '')
            address+=('?deploy_probe='+str(attempt) if path=='index.html' else '?v=0.7.5-db4&deploy_probe='+str(attempt))
            request=urllib.request.Request(address,headers={'Cache-Control':'no-cache','User-Agent':'MICU-Pages-Smoke/1.0'})
            with urllib.request.urlopen(request,timeout=18) as response:
                body=response.read().decode('utf-8')
            if needle not in body:
                raise RuntimeError('Pages is not yet serving canonical version: '+path)
        print('PASS published Pages HTTP: v0.7.5, DB4 and source '+sha)
        break
    except Exception as error:
        print(f'Waiting for Pages publication ({attempt+1}/18): {error}',flush=True)
        if attempt==17:
            raise
        time.sleep(15)
