import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
const account='0426b9932c46913ed8bee6eef9f56577';
const name='de-todo-un-poco-bodas';
const config=await readFile(join(process.env.APPDATA,'xdg.config/.wrangler/config/default.toml'),'utf8');
const token=config.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
if(!token)throw Error('Inicia sesión con Wrangler.');
const headers={authorization:`Bearer ${token}`,'content-type':'application/json'};
const endpoint=`https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects`;
async function call(url,options={}){const r=await fetch(url,{...options,headers});const result=await r.json();if(!r.ok||!result.success)throw Error(JSON.stringify(result.errors||{status:r.status}));return result.result;}
const action=process.argv[2]||'status';
let project;
if(action==='create'){
 const list=await call(endpoint);project=list.find(p=>p.name===name);
 if(!project)project=await call(endpoint,{method:'POST',body:JSON.stringify({name,production_branch:'main',build_config:{build_command:'npm run build',destination_dir:'dist',root_dir:''},source:{type:'github',config:{owner:'artesbuhooficial-max',owner_id:'281841275',repo_name:name,repo_id:'1429649772',production_branch:'main',pr_comments_enabled:true,deployments_enabled:true,production_deployments_enabled:true,preview_deployment_setting:'none'}},deployment_configs:{production:{compatibility_date:'2026-11-04',env_vars:{NODE_VERSION:{type:'plain_text',value:'22'}}},preview:{compatibility_date:'2026-11-04',env_vars:{NODE_VERSION:{type:'plain_text',value:'22'}}}}})});
}else if(action==='deploy'){
 const deployment=await call(`${endpoint}/${name}/deployments`,{method:'POST'});
 console.log(JSON.stringify({deploymentId:deployment.id,url:deployment.url,stage:deployment.latest_stage},null,2));
 process.exit(0);
}else project=await call(`${endpoint}/${name}`);
console.log(JSON.stringify({name:project.name,domains:project.domains,source:project.source,build_config:project.build_config,latest_deployment:project.latest_deployment?{id:project.latest_deployment.id,url:project.latest_deployment.url,stage:project.latest_deployment.latest_stage}:null},null,2));
