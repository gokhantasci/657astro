import {spawnSync} from 'node:child_process';
const r=spawnSync(process.platform==='win32'?'python':'python3',['scripts/tarife-pdf.py'],{stdio:'inherit'});
if(r.error)throw r.error;
if(r.status!==0)process.exit(r.status??1);
