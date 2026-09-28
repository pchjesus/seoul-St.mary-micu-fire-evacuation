"""Build a verified review archive without browser data, operational rosters or Git internals."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text())['version']
release = f'fire_evacuation_prototype_v{version}_RC'
paths = [root / name for name in (
    'index.html', 'style.css', 'storage.js', 'audit.js', 'audit-model.js',
    'script.js', 'personnel.js', 'history.js',
    'README.md', 'TEST_REPORT.md', 'package.json', 'package-lock.json', '.gitignore',
    f'CHANGELOG_v{version}.md', f'RELEASE_REPORT_v{version}.md',
)]
for directory in ('vendor', 'tests', 'scripts', 'docs'):
    paths.extend(p for p in (root / directory).rglob('*')
                 if p.is_file() and '__pycache__' not in p.parts)
paths.extend(p for p in (root / 'artifacts' / f'v{version}').glob('*')
             if p.suffix in {'.png', '.pdf'})
paths = sorted(set(paths))
manifest = {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
output = root / 'dist' / f'{release}.zip'
output.parent.mkdir(exist_ok=True)
prefix = release + '/'
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in paths:
        archive.write(path, prefix + str(path.relative_to(root)))
    archive.writestr(prefix + 'SHA256SUMS.json', json.dumps(manifest, indent=2, ensure_ascii=False))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for name, expected in manifest.items():
        assert hashlib.sha256(archive.read(prefix + name)).hexdigest() == expected
print(output)
print(f'{output.stat().st_size:,} bytes; {len(manifest)} files verified')
print('ZIP SHA256:', hashlib.sha256(output.read_bytes()).hexdigest())
