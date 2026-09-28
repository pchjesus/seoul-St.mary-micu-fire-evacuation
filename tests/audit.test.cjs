const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const {IDBFactory}=require('fake-indexeddb');
const XLSX=require('../vendor/xlsx.full.min.js');
const plain=value=>JSON.parse(JSON.stringify(value));
const roster={id:'2026-09',year:2026,month:9,fileName:'virtual.xlsx',all:[{name:'가상가',group:'Charge'},{name:'가상나',group:'Charge'}],groups:[{name:'Charge'}],shifts:{'24':['E','E']}};
function setup(indexedDB=new IDBFactory()){
  const ctx=vm.createContext({indexedDB,Date,crypto:webcrypto,console,setTimeout,clearTimeout,TypeError,XLSX,localStorage:{getItem:()=>null},navigator:{userAgent:'Mozilla/5.0 (Linux; Android 16; Mobile) Chrome/140.0 Safari/537.36'}});
  for(const name of ['storage.js','audit.js']) vm.runInContext(fs.readFileSync(name,'utf8'),ctx);
  return {ctx,run:code=>vm.runInContext(code,ctx),s:vm.runInContext('AppStorage',ctx),a:vm.runInContext('Audit',ctx)};
}
async function seedV2(indexedDB){
  const db=await new Promise((resolve,reject)=>{
    const request=indexedDB.open('fireEvacuationRosterDB_v0617',2);
    request.onupgradeneeded=()=>['rosters','overrides','personnel','meta'].forEach(name=>request.result.createObjectStore(name,{keyPath:'id'}));
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(['rosters','personnel','overrides','meta'],'readwrite');
    tx.objectStore('rosters').put(roster);tx.objectStore('overrides').put({id:'2026-09|2026-9-24-E|통보연락반|0',rosterId:roster.id,contextKey:'2026-09|2026-9-24-E|통보연락반|0',value:{personId:'source:2026-09:0',name:'이전배치수정'}});
    tx.objectStore('personnel').put({id:roster.id,profiles:{'source:2026-09:0':{name:'이전수정',kind:'nurse',group:'Charge'}},contexts:{}});
    tx.objectStore('meta').put({id:'migration:0.7.1',value:true});tx.objectStore('meta').put({id:'activeRosterId',value:roster.id});tx.objectStore('meta').put({id:`revision:${roster.id}`,value:7});
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });db.close();
}
test('v2 database upgrades without losing active roster, personnel or revision',async()=>{
  const db=new IDBFactory();await seedV2(db);const {s}=setup(db);await s.initialize();
  assert.equal((await s.openDB()).version,3);assert.deepEqual(plain(await s.getRoster(roster.id)),roster);
  assert.equal(await s.getActiveId(),roster.id);const state=await s.readState(roster.id);
  assert.equal(state.revision,7);assert.equal(state.assignments['2026-09|2026-9-24-E|통보연락반|0'].name,'이전배치수정');assert.equal(state.personnel.profiles['source:2026-09:0'].name,'이전수정');assert.equal((await s.listLogs()).length,0);
});
test('roster replacement and deletion preserve independent history and a new instance restores it',async()=>{
  const db=new IDBFactory();const {s,a}=setup(db);await s.initialize();await s.saveRoster(roster);
  await a.logEvent({action:'roster_registered',target:'virtual.xlsx'});
  await s.saveRoster({...roster,fileName:'replacement.xlsx'},true);await s.deleteRoster(roster.id);
  const restored=setup(db);await restored.s.initialize();const rows=await restored.s.listLogs();
  assert.equal(rows.length,1);assert.equal(rows[0].appVersion,'0.7.2');assert.equal(rows[0].target,'virtual.xlsx');
});
test('successful operation logs changes and verified save in one correlated batch with coarse environment',async()=>{
  const {s,a}=setup();let saved=false;
  const result=await a.perform({operation:'이름 저장',rosterId:roster.id},[{action:'name_changed',before:'가',after:'나'}],async()=>{saved=true;return 42;});
  assert.equal(result,42);assert.equal(saved,true);const rows=await s.listLogs();assert.equal(rows.length,2);
  assert.equal(rows[0].operationId,rows[1].operationId);assert.equal(rows[0].appVersion,'0.7.2');
  assert.deepEqual(Object.keys(rows[0].environment).sort(),['browser','device','os']);assert.equal(rows[0].environment.os,'Android');
  assert.ok(rows.every(row=>!('userAgent'in row)&&!('deviceId'in row)));
});
test('failed operation records only one failure, never successful changes; outer handling does not duplicate',async()=>{
  const {s,a}=setup();const error=Error('quota');
  await assert.rejects(a.perform({operation:'인원 저장'},[{action:'person_added'}],async()=>{throw error;}),/quota/);
  await a.recordFailure({operation:'outer'},error);
  const rows=await s.listLogs();assert.equal(rows.length,1);assert.equal(rows[0].action,'save_failure');assert.equal(rows[0].result,'실패');assert.equal(a.completedCount,0);
});
test('audit failure keeps operational success and pending events; retry is verified without duplicate IDs',async()=>{
  const {s,a}=setup();const append=s.appendLogs;let attempts=0;
  s.appendLogs=async rows=>{attempts++;await append(rows);throw Error('verification read failed');};
  assert.equal(await a.perform({operation:'save'},[{action:'person_added'}],async()=>99),99);
  assert.equal(a.completedCount,1);assert.equal(a.pendingCount,2);assert.equal((await s.listLogs()).length,2);
  s.appendLogs=append;assert.equal(await a.retry(),true);assert.equal(a.pendingCount,0);assert.equal((await s.listLogs()).length,2);assert.equal(attempts,1);
});
test('pending events are visible and exportable with an explicit unpersisted label',async()=>{
  const {s,a}=setup();s.appendLogs=async()=>{throw Error('quota');};
  await a.logEvent({action:'save_failure',result:'실패'});
  const rows=await a.list();assert.equal(rows[0].pending,true);
  const wb=a.exportWorkbook(rows);assert.equal(wb.Sheets['수정 이력'].N2.v,'저장 대기 (현재 창)');
});
test('same ID cannot overwrite an earlier log and the failed batch is atomic',async()=>{
  const {s,a}=setup();const [row]=await a.logEvent({action:'person_added'});
  await assert.rejects(s.appendLogs([{...row,id:'new:event'}, {...row,action:'person_deleted'}]),/일치/);
  assert.equal((await s.listLogs()).length,1);assert.equal((await s.listLogs())[0].action,'person_added');
});
test('environment detects iOS Chrome, touch iPad Safari, Android tablet and Windows Edge',()=>{
  const {a}=setup();
  assert.deepEqual(plain(a.environment({userAgent:'iPhone Mobile CriOS/140 Safari/604'})),{os:'iOS',device:'모바일',browser:'Chrome'});
  assert.deepEqual(plain(a.environment({userAgent:'Macintosh Version/26 Safari/605',maxTouchPoints:5})),{os:'iOS',device:'태블릿',browser:'Safari'});
  assert.equal(a.environment({userAgent:'Android Chrome/140 Safari/537'}).device,'태블릿');
  assert.equal(a.environment({userAgent:'Windows NT Chrome/140 Edg/140'}).browser,'Edge');
});
test('inclusive recorded-local date, action, environment filters combine and sort latest first',()=>{
  const {a}=setup();const base={appVersion:'0.7.2',operationId:'x',sequence:0,environment:{device:'PC',os:'Windows',browser:'Chrome'}};
  const rows=[{...base,id:'a',dateKey:'2026-09-24',timestamp:'2026-09-23T15:00:00Z',action:'person_added'},{...base,id:'b',dateKey:'2026-09-24',timestamp:'2026-09-24T14:59:59Z',action:'name_changed'},{...base,id:'c',dateKey:'2026-09-25',timestamp:'2026-09-24T15:00:00Z',action:'person_added'}];
  assert.deepEqual(plain(a.filter(rows,{from:'2026-09-24',to:'2026-09-24'}).map(row=>row.id)),['b','a']);
  assert.deepEqual(plain(a.filter(rows,{from:'2026-09-24',to:'2026-09-24',action:'person_added',environment:'PC · Windows · Chrome'}).map(row=>row.id)),['a']);
  assert.equal(a.group(a.filter(rows),'date').length,2);assert.equal(a.group(a.filter(rows),'environment').length,1);
});
test('Excel export includes every filtered row beyond display pagination and names remain literal string cells',async()=>{
  const {a}=setup();const [row]=await a.logEvent({action:'person_added',target:'=HYPERLINK("https://example.com")'});
  const rows=Array.from({length:125},(_,i)=>({...row,id:`id${i}`,sequence:i}));
  const workbook=a.exportWorkbook(rows);const decoded=XLSX.read(XLSX.write(workbook,{type:'buffer',bookType:'xlsx'}),{type:'buffer'});
  const sheet=decoded.Sheets['수정 이력'];assert.equal(XLSX.utils.sheet_to_json(sheet).length,125);assert.equal(sheet.C2.t,'s');assert.equal(sheet.C2.f,undefined);assert.equal(sheet.C2.v,row.target);
});
function model(){
  const {ctx,run,...rest}=setup();
  vm.runInContext(fs.readFileSync('script.js','utf8').split('/* UI bindings */')[0],ctx);
  vm.runInContext(fs.readFileSync('audit-model.js','utf8'),ctx);
  run(`globalThis.source=${JSON.stringify(roster)};globalThis.before={assignments:{},personnel:AppStorage.emptyPersonnel(source.id)};globalThis.after=JSON.parse(JSON.stringify(before));selectedDate=new Date(2026,8,24);selectedDuty='E';`);
  return {run,...rest};
}
test('person diff logs name and role against stable identity with original values',()=>{
  const {run}=model();run("after.personnel.profiles['source:2026-09:0']={name:'이름변경',kind:'doctor',group:'Charge'}");
  const events=plain(run('stateEvents(source,before,after)'));assert.ok(events.some(row=>row.action==='name_changed'&&row.before==='가상가'&&row.after==='이름변경'&&row.personId==='source:2026-09:0'));
  assert.ok(events.some(row=>row.action==='role_changed'&&row.after==='의사'));assert.ok(events.some(row=>row.action==='auto_assignment'));assert.ok(events.some(row=>row.action==='assignment_changed'));
});
test('add, exclude, restore and delete changes are scoped and no-op creates no change events',()=>{
  const {run}=model();assert.equal(run('stateEvents(source,before,after).length'),0);
  run("after.personnel.contexts['2026-9-24-E']={added:[{id:'added:one',name:'추가',kind:'staff'}],excluded:['source:2026-09:0']}");
  const events=plain(run('stateEvents(source,before,after)'));assert.ok(events.some(row=>row.action==='person_added'&&row.context==='2026-9-24-E'));assert.ok(events.some(row=>row.action==='person_deleted'));
  const reverse=plain(run('stateEvents(source,after,before)'));assert.ok(reverse.some(row=>row.action==='person_restored'));assert.ok(reverse.some(row=>row.action==='person_deleted'&&row.personId==='added:one'));
});
test('manual edit and reset log before/after while unchanged overrides remain quiet',()=>{
  const {run}=model();run("after.assignments['2026-09|2026-9-24-E|통보연락반|0']={personId:'source:2026-09:0',name:'표시수정'}");
  assert.ok(run("stateEvents(source,before,after).some(row=>row.action==='manual_override'&&row.before.includes('가상가')&&row.after.includes('표시수정'))"));
  assert.ok(run("stateEvents(source,after,before).some(row=>row.action==='data_reset')"));
  assert.equal(run('stateEvents(source,after,after).length'),0);
});
