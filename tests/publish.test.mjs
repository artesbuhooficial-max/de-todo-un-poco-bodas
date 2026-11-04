import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import schema from '../schema.json' with {type:'json'};
import {validate,render} from '../lib/content.mjs';
import {onRequest} from '../functions/api/publish.js';
const original=JSON.parse(await readFile(new URL('../data/content.json',import.meta.url),'utf8'));
const env={GITHUB_TOKEN:'fake-token-for-test',PUBLISH_SECRET:'test-only-secret'};
const sha='a'.repeat(40);
const request=(body,key=env.PUBLISH_SECRET,origin='https://example.com')=>new Request('https://example.com/api/publish',{method:'POST',headers:{origin,'content-type':'application/json','x-publish-key':key},body:JSON.stringify(body)});

test('approved content validates and rendering escapes text',()=>{
 assert.equal(validate(original),original);
 const next=structuredClone(original),field=schema.find(f=>f.kind==='text');next.values[field.key]='<script>alert(1)</script>';
 assert.equal(render(`{{${field.key}}}`,next),'&lt;script&gt;alert(1)&lt;/script&gt;');
});
test('rejects executable links, SVG uploads, unknown fields and wrong artist',()=>{
 for(const mutate of [c=>{c.values[schema.find(f=>f.kind==='link').key]='javascript:alert(1)'},c=>{c.values[schema.find(f=>f.kind==='image').key]='data:image/svg+xml;base64,PHN2Zz4='},c=>{c.values.unknown='x'},c=>{c.siteId='mario-cassado'}]){const c=structuredClone(original);mutate(c);assert.throws(()=>validate(c));}
});
test('publishing without configuration or with wrong credentials fails closed',async()=>{
 assert.equal((await onRequest({request:request({}),env:{}})).status,503);
 assert.equal((await onRequest({request:request({},'wrong'),env})).status,401);
 assert.equal((await onRequest({request:request({},env.PUBLISH_SECRET,'https://other.example'),env})).status,403);
});
test('rejects oversized streamed bodies before contacting GitHub',async()=>{
 const response=await onRequest({request:request({value:'x'.repeat(905000)}),env});assert.equal(response.status,413);
});
test('detects concurrent updates and writes only the fixed content file',async()=>{
 const previous=globalThis.fetch;const calls=[];
 globalThis.fetch=async(url,options={})=>{calls.push({url,options});return Response.json(options.method==='PUT'?{content:{sha:'b'.repeat(40)}}:{sha,content:Buffer.from(JSON.stringify(original)).toString('base64')});};
 try{
  assert.equal((await onRequest({request:request({content:original,baseSha:'c'.repeat(40)}),env})).status,409);
  assert.equal(calls.filter(c=>c.options.method==='PUT').length,0);
  const response=await onRequest({request:request({content:original,baseSha:sha}),env});assert.equal(response.status,200);
  const update=calls.find(c=>c.options.method==='PUT');assert.equal(update.url,'https://api.github.com/repos/artesbuhooficial-max/de-todo-un-poco-bodas/contents/data/content.json');
  const payload=JSON.parse(update.options.body);assert.equal(payload.sha,sha);assert.equal(payload.branch,'main');assert.deepEqual(JSON.parse(Buffer.from(payload.content,'base64').toString('utf8')),original);
 }finally{globalThis.fetch=previous;}
});
