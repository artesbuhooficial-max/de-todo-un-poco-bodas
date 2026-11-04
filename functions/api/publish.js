import {validate, MAX_BYTES} from '../../lib/content.mjs';
const REPO = 'artesbuhooficial-max/de-todo-un-poco-bodas';
const PATH = 'data/content.json';
const BRANCH = 'main';
const reply = (status, message, extra = {}) => Response.json({message,...extra},{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
async function equalSecret(a,b) {
  if (!a || !b) return false;
  const hash = async value => new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
  const [left,right] = await Promise.all([hash(a),hash(b)]);
  return left.reduce((diff,value,index) => diff | (value ^ right[index]),0) === 0;
}
const encode = text => btoa(Array.from(new TextEncoder().encode(text),byte=>String.fromCharCode(byte)).join(''));
const decode = text => new TextDecoder().decode(Uint8Array.from(atob(text.replace(/\s/g,'')),char=>char.charCodeAt(0)));

export async function onRequest({request,env}) {
  if (!['GET','POST'].includes(request.method)) return reply(405,'Método no permitido.');
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply(403,'Origen no autorizado.');
  if (!env.GITHUB_TOKEN || !env.PUBLISH_SECRET) return reply(503,'La publicación está pendiente de activar. Puedes seguir editando y exportar tu borrador.');
  if (!await equalSecret(request.headers.get('x-publish-key'),env.PUBLISH_SECRET)) return reply(401,'La clave de publicación no es correcta.');
  let body;
  if (request.method === 'POST') {
    if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415,'Envía contenido JSON.');
    const reader = request.body?.getReader();
    if (!reader) return reply(400,'Falta el contenido.');
    const chunks=[]; let size=0;
    for (;;) {
      const {done,value}=await reader.read(); if(done)break;
      size+=value.length;
      if(size>MAX_BYTES+2000){await reader.cancel();return reply(413,'El contenido supera el tamaño permitido.');}
      chunks.push(value);
    }
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    try { body=JSON.parse(new TextDecoder().decode(bytes)); validate(body.content); }
    catch(error){return reply(400,error instanceof Error?error.message:'Contenido incorrecto.');}
    if(typeof body.baseSha!=='string'||!/^[a-f0-9]{40}$/.test(body.baseSha))return reply(400,'Carga primero la versión publicada.');
  }
  const url=`https://api.github.com/repos/${REPO}/contents/${PATH}`;
  const headers={accept:'application/vnd.github+json',authorization:`Bearer ${env.GITHUB_TOKEN}`,'user-agent':'artes-buho-dtup-editor','x-github-api-version':'2022-11-28'};
  try {
    const currentResponse=await fetch(`${url}?ref=${BRANCH}`,{headers});
    if(!currentResponse.ok)return reply(502,'No se pudo leer la versión de GitHub.');
    const current=await currentResponse.json();
    if(!current.sha||!current.content)return reply(502,'No se encontró el contenido editable.');
    if(request.method==='GET')return reply(200,'Versión cargada.',{sha:current.sha,content:JSON.parse(decode(current.content))});
    if(current.sha!==body.baseSha)return reply(409,'Alguien ha publicado otra versión. Exporta tu borrador y recarga antes de continuar.');
    const updated=await fetch(url,{method:'PUT',headers:{...headers,'content-type':'application/json'},body:JSON.stringify({message:'content: actualizar landing desde editor',content:encode(JSON.stringify(body.content,null,2)+'\n'),sha:current.sha,branch:BRANCH})});
    if(!updated.ok)return reply(updated.status===409?409:502,'No se pudo guardar. Conserva tu borrador y vuelve a cargar la versión publicada.');
    const result=await updated.json();
    return reply(200,'Cambios guardados. La publicación está en curso.',{sha:result.content.sha});
  }catch{return reply(502,'No se pudo contactar con el servicio de publicación. Tu borrador sigue en este navegador.');}
}
