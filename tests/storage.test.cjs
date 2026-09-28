const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {IDBFactory} = require('fake-indexeddb');

function setup({indexedDB=new IDBFactory(), legacy={}, blockedLS=false}={}) {
  const context = vm.createContext({indexedDB, setTimeout, clearTimeout, console, TypeError,
    localStorage:{getItem:key=>{if(blockedLS) throw new Error('denied'); return legacy[key] ?? null;}}});
  vm.runInContext(fs.readFileSync('storage.js','utf8')+'\nglobalThis.storage = AppStorage;',context);
  return {storage:context.storage,indexedDB};
}
const plain = value => JSON.parse(JSON.stringify(value));
const record = id => ({id,year:2026,month:9,all:[{name:'가상인원',group:'Charge'}],shifts:{'24':['E']},groups:[{name:'Charge'}]});
const key = id => `${id}|2026-9-24-E|통보연락반|0`;

test('verified state survives a new app instance with localStorage blocked', async()=>{
  const {storage:s,indexedDB} = setup({blockedLS:true});
  await s.initialize();
  await s.saveRoster(record('a'));
  await s.setActiveId('a');
  const expected = {[key('a')]:{personId:'source:a:0',name:'새이름'}};
  const state = await s.saveState('a',expected,s.emptyPersonnel('a'),0);
  assert.equal(state.revision,1);
  const next = setup({indexedDB,blockedLS:true}).storage;
  await next.initialize();
  assert.equal(await next.getActiveId(),'a');
  assert.deepEqual(plain((await next.readState('a')).assignments),expected);
});

test('failure aborts the entire overwrite and preserves previous assignments and people', async()=>{
  const {storage:s} = setup(); await s.initialize();
  const before = {[key('a')]:'이전 이름'};
  await s.saveState('a',before,s.emptyPersonnel('a'),0);
  await assert.rejects(s.saveState('a',{'wrong-scope|date|role|0':'bad'},s.emptyPersonnel('a'),1),/범위/);
  const result=await s.readState('a');
  assert.deepEqual(plain(result.assignments),before);
  assert.equal(result.revision,1);
});

test('concurrent stale save is rejected without overwriting the winning tab', async()=>{
  const {storage:s} = setup(); await s.initialize();
  await s.saveState('a',{[key('a')]:'첫번째'},s.emptyPersonnel('a'),0);
  await assert.rejects(s.saveState('a',{[key('a')]:'두번째'},s.emptyPersonnel('a'),0),/다른 탭/);
  assert.equal((await s.readState('a')).assignments[key('a')],'첫번째');
});

test('identical retry after a completed write is idempotent',async()=>{
  const {storage:s}=setup(); await s.initialize();
  const assignments={[key('a')]:'입력보존'};
  await s.saveState('a',assignments,s.emptyPersonnel('a'),0);
  const retry=await s.saveState('a',assignments,s.emptyPersonnel('a'),0);
  assert.equal(retry.revision,1);
  assert.equal(retry.assignments[key('a')],'입력보존');
});

test('read-back mismatch never reports success', async()=>{
  const {storage:s} = setup(); await s.initialize();
  const db=await s.openDB();
  const transaction=db.transaction.bind(db);
  let corrupt=false;
  db.transaction=(...args)=>{
    const tx=transaction(...args);
    if(corrupt && args[1]==='readonly'){
      const objectStore=tx.objectStore.bind(tx);
      tx.objectStore=name=>{
        const store=objectStore(name);
        if(name==='overrides'){
          const getAll=store.getAll.bind(store);
          store.getAll=()=>{
            const request=getAll();
            request.addEventListener('success',()=>Object.defineProperty(request,'result',{value:[]}));
            return request;
          };
        }
        return store;
      };
    }
    return tx;
  };
  corrupt=true;
  await assert.rejects(s.saveState('a',{[key('a')]:'새이름'},s.emptyPersonnel('a'),0),/일치/);
});

test('legacy mirrors migrate once, sample changes are remapped, deleted data stays deleted', async()=>{
  const legacy={
    'micu.fire.v0617.rosters':JSON.stringify([record('a')]),
    'micu.fire.v0617.overrides':JSON.stringify([
      {id:'old-bad-metadata',rosterId:'a',contextKey:key('a'),name:'레거시'},
      {id:'sample-old',rosterId:'2026-09',contextKey:key('2026-09'),name:'샘플수정'}]),
    'micu.fire.v0617.activeRosterId':'a'
  };
  const {storage:s,indexedDB} = setup({legacy}); await s.initialize();
  assert.equal((await s.readState('a')).assignments[key('a')],'레거시');
  assert.equal((await s.readState('sample:2026-09')).assignments[key('sample:2026-09')],'샘플수정');
  await s.deleteRoster('a');
  const next=setup({indexedDB,legacy}).storage; await next.initialize();
  assert.equal((await next.listRosters()).length,0);
  assert.deepEqual(plain((await next.readState('a')).assignments),{});
  assert.equal(await next.getActiveId(),null);
});

test('replacement clears only its own assignments and personnel atomically', async()=>{
  const {storage:s}=setup(); await s.initialize();
  for(const id of ['a','b']){
    await s.saveRoster(record(id));
    const people=s.emptyPersonnel(id); people.contexts['2026-9-24-E']={added:[{id:'added:test',name:'추가'}],excluded:[]};
    await s.saveState(id,{[key(id)]:'수정'},people,0);
  }
  await s.saveRoster({...record('a'),fileName:'교체.xlsx'},true);
  assert.deepEqual(plain((await s.readState('a')).assignments),{});
  assert.deepEqual(plain((await s.readState('a')).personnel),plain(s.emptyPersonnel('a')));
  assert.equal((await s.readState('b')).assignments[key('b')],'수정');
  assert.equal((await s.readState('b')).personnel.contexts['2026-9-24-E'].added.length,1);
});

test('quota / write exception rejects and leaves committed state intact', async()=>{
  const {storage:s}=setup(); await s.initialize();
  await s.saveState('a',{[key('a')]:'기존'},s.emptyPersonnel('a'),0);
  const db=await s.openDB(), original=db.transaction.bind(db);
  db.transaction=(...args)=>{
    if(args[1]==='readwrite') throw new DOMException('Quota exceeded','QuotaExceededError');
    return original(...args);
  };
  await assert.rejects(s.saveState('a',{[key('a')]:'실패'},s.emptyPersonnel('a'),1),/Quota/);
  assert.equal((await s.readState('a')).assignments[key('a')],'기존');
});

test('unavailable IndexedDB fails instead of succeeding through localStorage', async()=>{
  const {storage:s}=setup({indexedDB:null});
  await assert.rejects(s.initialize(),/IndexedDB/);
  await assert.rejects(s.saveState('a',{},s.emptyPersonnel('a'),0),/IndexedDB/);
});

test('open failure is retryable', async()=>{
  const factory=new IDBFactory();
  let failed=false;
  const wrapped={open(...args){if(!failed){failed=true;throw new Error('once');}return factory.open(...args);}};
  const {storage:s}=setup({indexedDB:wrapped});
  await assert.rejects(s.initialize(),/once/);
  await s.initialize();
  assert.equal((await s.listRosters()).length,0);
});

test('existing primary data wins over an older legacy mirror',async()=>{
  const {storage:s}=setup({legacy:{'micu.fire.v0617.rosters':JSON.stringify([record('a')]),'micu.fire.v0617.overrides':JSON.stringify([{id:'mirror',rosterId:'a',contextKey:key('a'),name:'古い'}])}});
  await s.saveRoster(record('a'));
  await s.saveState('a',{[key('a')]:'최신'},s.emptyPersonnel('a'),0);
  await s.initialize();
  assert.equal((await s.readState('a')).assignments[key('a')],'최신');
});
