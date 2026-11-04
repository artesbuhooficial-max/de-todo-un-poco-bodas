import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const auth=await readFile(join(process.env.APPDATA,'xdg.config/.wrangler/config/default.toml'),'utf8');
const token=auth.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
const endpoint='https://api.cloudflare.com/client/v4/accounts/0426b9932c46913ed8bee6eef9f56577/pages/projects/de-todo-un-poco-bodas/deploy_hooks';
const headers={authorization:`Bearer ${token}`,'content-type':'application/json'};
const list=await fetch(endpoint,{headers}).then(r=>r.json());
if(!list.success)throw Error('No se pudieron consultar los despliegues de la landing.');
let hook=list.result.find(item=>item.name==='github-main-validated');
if(!hook){const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({name:'github-main-validated',branch:'main'})});const result=await response.json();if(!result.success)throw Error('No se pudo crear el disparador de publicación.');hook=result.result;}
const hookId=hook.hook_id||hook.id;
if(!hookId)throw Error('No se recibió un identificador para el disparador.');
const hookUrl=hook.url||`https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/${hookId}`;
execFileSync('gh',['secret','set','CLOUDFLARE_PAGES_DEPLOY_HOOK','--repo','artesbuhooficial-max/de-todo-un-poco-bodas'],{input:hookUrl,stdio:['pipe','pipe','pipe']});
console.log('Disparador limitado a esta landing guardado como secreto en GitHub.');
