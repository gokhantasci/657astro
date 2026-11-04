"""Depoya özel yazma anahtarıyla tek onaylı JSON commit'i; kişisel PAT sunucuya taşınmaz."""
import json
import os
import shlex
import subprocess
import threading
import uuid
from pathlib import Path

_lock = threading.Lock()

def git_publish(record, config):
    ident = str(uuid.UUID(record['id']))
    if ident != record['id'] or config['GITHUB_REPOSITORY'] != 'gokhantasci/657astro' or config['GITHUB_BRANCH'] != 'main':
        raise RuntimeError('Yayın hedefi doğrulanamadı.')
    if not _lock.acquire(timeout=10):
        raise RuntimeError('Başka bir yayın sürüyor; öneri korundu. Biraz sonra yeniden deneyin.')
    try:
        folder = Path(config['GIT_DATABASE']).resolve()
        folder.mkdir(parents=True, exist_ok=True, mode=0o700)
        env = dict(os.environ, GIT_TERMINAL_PROMPT='0', GIT_AUTHOR_NAME='657 yayın', GIT_AUTHOR_EMAIL='gokhan@657.com.tr',
                   GIT_COMMITTER_NAME='657 yayın', GIT_COMMITTER_EMAIL='gokhan@657.com.tr')
        if config.get('GIT_KEY'):
            env['GIT_SSH_COMMAND'] = 'ssh -i '+shlex.quote(config['GIT_KEY'])+' -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile='+shlex.quote(config['GIT_KNOWN_HOSTS'])
        def git(*args, input=None, check=True):
            return subprocess.run(['git', '-c', 'commit.gpgsign=false', *args], cwd=folder, input=input, capture_output=True, text=True, encoding='utf-8',
                                  timeout=40, check=check, env=env)
        if not (folder/'HEAD').exists():
            git('init', '--bare', '.')
            git('remote', 'add', 'origin', config.get('GIT_REMOTE') or 'git@github.com:gokhantasci/657astro.git')
        path = 'src/data/onayli-oneriler/'+ident+'.json'
        url = 'https://github.com/gokhantasci/657astro/blob/main/'+path
        for _ in range(3):
            git('fetch', '--depth=1', 'origin', 'main')
            parent = git('rev-parse', 'FETCH_HEAD').stdout.strip()
            existing = git('show', parent+':'+path, check=False)
            if existing.returncode == 0:
                old = json.loads(existing.stdout)
                if {k:v for k,v in old.items() if k!='tarih'} != {k:v for k,v in record.items() if k!='tarih'}:
                    raise RuntimeError('GitHub’da bu kayıt farklı içerikle var; üzerine yazılmadı.')
                return url
            git('read-tree', parent)
            blob = git('hash-object', '-w', '--stdin', input=json.dumps(record,ensure_ascii=False,indent=2)+'\n').stdout.strip()
            git('update-index', '--add', '--cacheinfo', '100644,'+blob+','+path)
            tree = git('write-tree').stdout.strip()
            commit = git('commit-tree', tree, '-p', parent, '-m', 'Onaylanan '+record['tur']+' önerisi: '+ident[:8]).stdout.strip()
            result = git('push', 'origin', commit+':refs/heads/main', check=False)
            if result.returncode == 0:
                return url
        raise RuntimeError('Depo bu sırada değişti; öneri korundu. Yeniden deneyin.')
    except (subprocess.SubprocessError, OSError, ValueError, KeyError) as error:
        raise RuntimeError('GitHub yayını tamamlanamadı; öneri korundu. Anahtar ve bağlantıyı kontrol edin.') from error
    finally:
        _lock.release()
