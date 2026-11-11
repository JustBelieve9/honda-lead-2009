import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {articles,systems,categories} from './dist/data.js';
for(const file of ['app.js','model.js','data.js'])execFileSync(process.execPath,['--check',`dist/${file}`],{stdio:'pipe'});
const ids=new Set(articles.map(a=>a.id));assert.equal(ids.size,articles.length,'Duplicate articles');
for(const a of articles){assert.ok(a.sources.length,`Missing sources: ${a.id}`);assert.ok(categories.includes(a.category));assert.ok(systems.some(s=>s.id===a.system));for(const r of a.related||[])assert.ok(ids.has(r),`Invalid relation ${a.id} -> ${r}`);for(const s of a.sources)assert.equal(new URL(s.url).protocol,'https:');assert.ok(a.steps?.length||a.table,`No detailed procedure/table: ${a.id}`);}
for(const id of ['oil','strainer','air','battery','fuses','headlight','bulbs','dashboard','seat','glove','engine','gear','coolant','brakes','rear-brake','tyres','cvt','spark','valves','fuel','controls','maintenance'])assert.ok(ids.has(id),`Missing required topic: ${id}`);
const html=await readFile('dist/index.html','utf8');assert.ok(html.includes('lang="ru"'));assert.ok(html.includes('name="viewport"'));assert.ok(!/codex-clipboard|owner.s full name|chassis n|\b\d{2}[A-Z]\d-\d{4,5}\b/i.test(html+JSON.stringify(articles)),'Personal document data must not be included');
for(const file of ['three.module.js','three.core.js','OrbitControls.js','LICENSE-three.txt'])assert.ok((await readFile(`dist/vendor/${file}`)).length>500);
console.log(`PASS: JS syntax, ${articles.length} sourced topics, ${systems.length} systems, related links, required coverage, privacy and local 3D dependencies.`);
