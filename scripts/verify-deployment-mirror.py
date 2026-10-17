#!/usr/bin/env python3
"""Verify this Pages mirror contains immutable assets copied from canonical MICU main."""
from pathlib import Path
import hashlib
import json
import re

root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'DEPLOYMENT_SOURCE.json').read_text(encoding='utf-8'))
source_sha=manifest['sourceCommit']
assert re.fullmatch(r'[0-9a-f]{40}',source_sha)
assert manifest['dbSchemaVersion']==4
expected=manifest['sourceBlobShas']
assert len(expected)==18

def git_blob(data):
    return hashlib.sha1(b'blob '+str(len(data)).encode('ascii')+b'\0'+data).hexdigest()

for path,sha in expected.items():
    data=(root/path).read_bytes()
    if path=='build-info.js':
        stamped=("const revision = '"+source_sha+"';").encode('ascii')
        assert data.count(stamped)==1, 'build-info commit attribution mismatch'
        data=data.replace(stamped,b'const revision = null;')
    current=git_blob(data)
    assert current==sha,f'{path}: mirror blob {current} != original {sha}'

html=(root/'index.html').read_text(encoding='utf-8')
storage=(root/'storage.js').read_text(encoding='utf-8')
assert 'storage.js?v=0.7.5-db4' in html
assert 'script.js?v=0.7.5-db4' in html
assert "indexedDB.open(DB_NAME, 4)" in storage
assert "indexedDB.open(DB_NAME, 3)" not in storage
sources=re.findall(r'(?:src|href)="([^"]+\.(?:js|css))(?:\?[^"]*)?"',html)
assert set(sources)==set(expected)-{'build-info.js'}|{'build-info.js'}
print(f'PASS: {len(expected)} canonical runtime assets match {source_sha}; IndexedDB v4; cache bust present')
