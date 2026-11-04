import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
const auth=await readFile(join(process.env.APPDATA,'xdg.config/.wrangler/config/default.toml'),'utf8');
const token=auth.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
const endpoint='https://api.cloudflare.com/client/v4/accounts/0426b9932c46913ed8bee6eef9f56577/pages/projects/de-todo-un-poco-bodas/domains';
const headers={authorization:`Bearer ${token}`,'content-type':'application/json'};
const list=await fetch(endpoint,{headers}).then(r=>r.json());
if(!list.success)throw Error('No se pudieron consultar los dominios de la landing.');
for(const name of ['detodounpocomusic.com','www.detodounpocomusic.com']){
 let domain=list.result.find(d=>d.name===name);
 if(!domain){const r=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({name})});const j=await r.json();if(!j.success){console.log(JSON.stringify({name,errors:j.errors}));continue;}domain=j.result;}
 console.log(JSON.stringify({name:domain.name,status:domain.status,validation:domain.validation_data,verification:domain.verification_data}));
}
