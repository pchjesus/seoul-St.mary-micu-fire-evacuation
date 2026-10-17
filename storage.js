/* IndexedDB is authoritative. Legacy mirrors are imported once only. */
const APP_VERSION = '0.7.5';
const AppStorage = (() => {
  const DB_NAME = 'fireEvacuationRosterDB_v0617';
  const STORES = ['rosters', 'overrides', 'personnel', 'meta'];
  let connection;
  let opening;
  let sessionEpoch = null;

  function openDB() {
    if (connection) return Promise.resolve(connection);
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => fail(new Error('저장소 응답이 늦어. 다른 탭을 닫고 다시 시도해줘.')), 8000);
      function fail(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(error);
      }
      if (!globalThis.indexedDB) { fail(new Error('이 브라우저에서 IndexedDB를 사용할 수 없어.')); return; }
      let request;
      // v4 fences older app tabs which do not understand full-data restore epochs.
      try { request = indexedDB.open(DB_NAME, 4); }
      catch (error) { fail(error); return; }
      request.onupgradeneeded = () => {
        for (const name of [...STORES, 'logs']) {
          if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, {keyPath:'id'});
        }
      };
      request.onerror = () => {
        if (request.error?.name === 'VersionError') {
          fail(new Error('저장된 데이터가 현재 실행 중인 앱보다 새로운 버전이야. 최신 MICU 웹사이트에서 다시 열어줘. 기존 데이터를 보존하려면 사이트 데이터 삭제나 초기화를 하지 마.'));
        } else fail(request.error);
      };
      request.onblocked = () => fail(new Error('저장소 업데이트가 대기 중이야. 이 앱의 다른 탭을 닫고 다시 시도해줘.'));
      request.onsuccess = () => {
        if (settled) { request.result.close(); return; }
        settled = true;
        clearTimeout(timeout);
        connection = request.result;
        connection.onversionchange = () => { connection.close(); connection = null; };
        connection.onclose = () => { connection = null; };
        resolve(connection);
      };
    }).finally(() => { opening = null; });
    return opening;
  }

  async function transaction(names, mode, callback) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      let tx;
      const stores = mode==='readwrite' ? [...new Set([...names,'meta'])] : names;
      try { tx = db.transaction(stores, mode, {durability:'strict'}); }
      catch (error) {
        if (!(error instanceof TypeError)) { reject(error); return; }
        tx = db.transaction(stores, mode);
      }
      let result;
      let cause;
      const timer = setTimeout(() => {
        cause = new Error('저장소 응답을 확인하지 못했어. 다시 시도해줘.');
        try { tx.abort(); } catch (_) { /* already finished */ }
        reject(cause);
      }, 8000);
      tx.oncomplete = () => { clearTimeout(timer); resolve(result); };
      tx.onabort = tx.onerror = () => { clearTimeout(timer); reject(cause || tx.error || new Error('저장 트랜잭션이 중단됐어.')); };
      const invoke = () => {
        try { callback(tx, value => { result = value; }, error => { cause = error; tx.abort(); }); }
        catch (error) { cause = error; tx.abort(); }
      };
      if(mode==='readwrite') {
        const epoch=tx.objectStore('meta').get('storageEpoch');
        epoch.onsuccess=()=>{
          const current=epoch.result?.value || 0;
          if(sessionEpoch===null)sessionEpoch=current;
          if(sessionEpoch!==current){cause=new Error('다른 탭에서 전체 데이터를 복원했어. 이 창을 새로고침한 뒤 다시 작업해줘.');tx.abort();return;}
          invoke();
        };
      } else invoke();
    });
  }
  const read = (store, id) => transaction([store], 'readonly', (tx, done) => {
    const request = id === undefined ? tx.objectStore(store).getAll() : tx.objectStore(store).get(id);
    request.onsuccess = () => done(request.result ?? null);
  });
  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
    return value;
  }
  function verify(actual, expected) {
    if (JSON.stringify(canonical(actual)) !== JSON.stringify(canonical(expected))) throw new Error('저장 후 다시 읽은 값이 일치하지 않아. 다시 시도해줘.');
  }
  function clearScope(tx, store, rosterId) {
    const request = tx.objectStore(store).openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if (cursor.value.rosterId === rosterId) cursor.delete();
      cursor.continue();
    };
    return request;
  }
  const emptyPersonnel = id => ({id, profiles:{}, contexts:{}});
  async function readState(id) {
    return transaction(['overrides','personnel','meta'], 'readonly', (tx, done) => {
      const state = {assignments:{}, personnel:emptyPersonnel(id), revision:0};
      const overrides = tx.objectStore('overrides').getAll();
      overrides.onsuccess = () => { overrides.result.filter(row => row.rosterId === id).forEach(row => { state.assignments[row.contextKey] = row.value ?? row.name; }); };
      const personnel = tx.objectStore('personnel').get(id);
      personnel.onsuccess = () => { state.personnel = personnel.result || emptyPersonnel(id); };
      const revision = tx.objectStore('meta').get(`revision:${id}`);
      revision.onsuccess = () => { state.revision = revision.result?.value || 0; };
      done(state);
    });
  }
  async function saveState(id, assignments, personnel, expectedRevision) {
    if (!id) throw new Error('저장할 근무표가 없어.');
    const snapshot = JSON.parse(JSON.stringify({assignments, personnel, revision:expectedRevision + 1}));
    if (snapshot.personnel?.id !== id) throw new Error('인원 데이터의 근무표 범위가 올바르지 않아.');
    // A previous commit may have succeeded while its verification read failed.
    // An identical retry is safe; a different intervening write still conflicts.
    const previous = await readState(id);
    if (previous.revision === snapshot.revision &&
        JSON.stringify(canonical(previous)) === JSON.stringify(canonical(snapshot))) return previous;
    await transaction(['overrides','personnel','meta'], 'readwrite', (tx, done, fail) => {
      const request = tx.objectStore('meta').get(`revision:${id}`);
      request.onsuccess = () => {
        if ((request.result?.value || 0) !== expectedRevision) { fail(new Error('다른 탭에서 데이터가 변경됐어. 입력 내용을 복사한 뒤 새로고침해줘.')); return; }
        const cursorRequest = clearScope(tx, 'overrides', id);
        const advance = cursorRequest.onsuccess;
        cursorRequest.onsuccess = () => {
          const hasCursor = Boolean(cursorRequest.result);
          advance();
          if (hasCursor) return;
          for (const [contextKey, value] of Object.entries(snapshot.assignments)) {
            const parts = contextKey.split('|');
            if (parts.length !== 4 || parts[0] !== id) { fail(new Error('배치 데이터의 범위가 올바르지 않아.')); return; }
            const match = /^(\d{4}-\d{1,2}-\d{1,2})-([DEN])$/.exec(parts[1]);
            if (!match) { fail(new Error('배치 날짜를 확인해줘.')); return; }
            tx.objectStore('overrides').put({id:contextKey, rosterId:id, contextKey, dateKey:match[1], duty:match[2], role:parts[2], slot:Number(parts[3]), value, updatedAt:new Date().toISOString()});
          }
        };
        tx.objectStore('personnel').put(snapshot.personnel);
        tx.objectStore('meta').put({id:`revision:${id}`, value:snapshot.revision});
      };
    });
    const saved = await readState(id);
    verify(saved, snapshot);
    return saved;
  }
  async function setActiveId(id) {
    const value = {id:'activeRosterId', value:id || null};
    await transaction(['meta'], 'readwrite', tx => tx.objectStore('meta').put(value));
    verify(await read('meta', value.id), value);
  }
  async function saveRoster(record, replace = false, expectedCurrent = null) {
    const safe = JSON.parse(JSON.stringify({...record, sourceBlob:undefined}));
    await transaction(STORES, 'readwrite', (tx, done, fail) => {
      const existing = tx.objectStore('rosters').get(safe.id);
      existing.onsuccess = () => {
        if (existing.result && !replace) { fail(new Error('같은 월의 근무표가 다른 탭에서 저장됐어. 보관함을 다시 열어줘.')); return; }
        if (expectedCurrent && JSON.stringify(canonical(existing.result)) !== JSON.stringify(canonical(expectedCurrent.record))) {
          fail(new Error('다른 탭에서 근무표가 교체·삭제됐어. 보관함을 다시 열어 확인해줘.')); return;
        }
        if (replace) {
          const revision = tx.objectStore('meta').get(`revision:${safe.id}`);
          revision.onsuccess = () => {
            if (expectedCurrent && (revision.result?.value || 0) !== expectedCurrent.revision) {
              fail(new Error('다른 탭에서 인원·배치가 변경됐어. 교체를 중단했어. 최신 자료를 확인해줘.')); return;
            }
            tx.objectStore('rosters').put(safe);
            clearScope(tx, 'overrides', safe.id);
            tx.objectStore('personnel').delete(safe.id);
            tx.objectStore('meta').put({id:`revision:${safe.id}`, value:(revision.result?.value || 0) + 1});
          };
        } else tx.objectStore('rosters').put(safe);
      };
    });
    verify(await read('rosters', safe.id), safe);
    if (replace) {
      const state = await readState(safe.id);
      verify(state.assignments, {});
      verify(state.personnel, emptyPersonnel(safe.id));
    }
    return safe;
  }
  async function deleteRoster(id, expectedCurrent = null) {
    await transaction(STORES, 'readwrite', (tx, done, fail) => {
      const existing = tx.objectStore('rosters').get(id);
      existing.onsuccess = () => {
        if (expectedCurrent && JSON.stringify(canonical(existing.result)) !== JSON.stringify(canonical(expectedCurrent.record))) {
          fail(new Error('다른 탭에서 근무표가 교체·삭제됐어. 삭제를 중단했어.')); return;
        }
        const revision = tx.objectStore('meta').get(`revision:${id}`);
        revision.onsuccess = () => {
          if (expectedCurrent && (revision.result?.value || 0) !== expectedCurrent.revision) {
            fail(new Error('다른 탭에서 인원·배치가 변경됐어. 삭제를 중단했어.')); return;
          }
          tx.objectStore('rosters').delete(id);
          clearScope(tx, 'overrides', id);
          tx.objectStore('personnel').delete(id);
          tx.objectStore('meta').put({id:`revision:${id}`, value:(revision.result?.value || 0) + 1});
          const active = tx.objectStore('meta').get('activeRosterId');
          active.onsuccess = () => { if (active.result?.value === id) tx.objectStore('meta').put({id:'activeRosterId',value:null}); };
        };
      };
    });
    verify(await read('rosters', id), null);
    const state = await readState(id);
    verify(state.assignments, {});
    verify(state.personnel, emptyPersonnel(id));
  }
  // Logs have their own transactions; roster lifecycle operations never erase them.
  async function appendLogs(events) {
    const rows = JSON.parse(JSON.stringify(events));
    if (!rows.length) return;
    if (rows.some(row => !row.id || !row.timestamp || !row.action || !row.appVersion)) throw new Error('이력 필수 정보가 없어.');
    await transaction(['logs'], 'readwrite', (tx, done, fail) => {
      const store = tx.objectStore('logs');
      rows.forEach(row => {
        const request = store.get(row.id);
        request.onsuccess = () => {
          if (request.result) {
            try { verify(request.result, row); } catch (error) { fail(error); }
          } else store.add(row);
        };
      });
    });
    const saved = await transaction(['logs'], 'readonly', (tx, done) => {
      const result = [];
      rows.forEach((row, index) => {
        const request = tx.objectStore('logs').get(row.id);
        request.onsuccess = () => { result[index] = request.result; };
      });
      done(result);
    });
    verify(saved, rows);
  }
  function legacy(key, fallback) {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch (_) { return fallback; }
  }
  async function initialize() {
    // Initialization is also the explicit refresh boundary after a restore.
    sessionEpoch=(await read('meta','storageEpoch'))?.value || 0;
    // Keep the v0.6.17 database name: existing v0.7.0 data must survive upgrades.
    await transaction(STORES, 'readwrite', tx => {
      const marker = tx.objectStore('meta').get('migration:0.7.1');
      marker.onsuccess = () => {
        if (marker.result) return;
        const rosters = tx.objectStore('rosters').getAll();
        rosters.onsuccess = () => {
          const source = rosters.result.length ? rosters.result : legacy('micu.fire.v0617.rosters', []);
          if (!Array.isArray(source)) { tx.abort(); return; }
          if (!rosters.result.length) source.forEach(row => tx.objectStore('rosters').put(row));
          const ids = new Set(source.map(row => row.id));
          const overrides = tx.objectStore('overrides').getAll();
          overrides.onsuccess = () => {
            const rows = overrides.result.length ? overrides.result : legacy('micu.fire.v0617.overrides', []);
            if (!Array.isArray(rows)) { tx.abort(); return; }
            // Canonical IDs repair legacy metadata while preserving contextKey values.
            tx.objectStore('overrides').clear();
            rows.forEach(row => {
              let id = row.rosterId;
              if (id === '2026-09' && !ids.has(id)) id = 'sample:2026-09';
              if (!ids.has(id) && id !== 'sample:2026-09') return;
              const parts = String(row.contextKey || '').split('|');
              if (parts.length !== 4) return;
              parts[0] = id;
              const contextKey = parts.join('|');
              tx.objectStore('overrides').put({...row, id:contextKey, rosterId:id, contextKey});
            });
          };
          let active;
          try { active = localStorage.getItem('micu.fire.v0617.activeRosterId') || localStorage.getItem('fireEvacuation.activeRosterId.v0617'); } catch (_) { /* IndexedDB remains usable */ }
          tx.objectStore('meta').put({id:'activeRosterId', value:ids.has(active) ? active : null});
          tx.objectStore('meta').put({id:'migration:0.7.1', value:true});
        };
      };
    });
  }
  const ALL_STORES=[...STORES,'logs'];
  function snapshotInTransaction(tx,done) {
    const snapshot={};let remaining=ALL_STORES.length;
    for(const name of ALL_STORES){
      const request=tx.objectStore(name).getAll();
      request.onsuccess=()=>{
        snapshot[name]=request.result.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
        if(--remaining===0)done(snapshot);
      };
    }
  }
  function exportSnapshot() {
    return transaction(ALL_STORES,'readonly',(tx,done)=>snapshotInTransaction(tx,done));
  }
  async function restoreSnapshot(incoming,expectedCurrent) {
    // Validate before touching any persistent data; validation is shared with import UI.
    BackupFormat.validateSnapshot(incoming);
    if(!expectedCurrent)throw new Error('현재 데이터 확인 없이 복원할 수 없어. 백업 파일을 다시 선택해줘.');
    let restored, committed=false;
    try {
      await transaction(ALL_STORES,'readwrite',(tx,done,fail)=>{
        snapshotInTransaction(tx,current=>{
          try {
            verify(current,expectedCurrent);
            restored=JSON.parse(JSON.stringify(incoming));
            const meta=new Map(restored.meta.map(row=>[row.id,row]));
            const currentMeta=new Map(current.meta.map(row=>[row.id,row]));
            const revisionIds=new Set([...current.meta,...restored.meta].filter(row=>row.id.startsWith('revision:')).map(row=>row.id));
            for(const id of [...current.rosters,...restored.rosters].map(row=>row.id))revisionIds.add(`revision:${id}`);
            revisionIds.add('revision:sample:2026-09');
            for(const id of revisionIds)meta.set(id,{id,value:Math.max(currentMeta.get(id)?.value||0,meta.get(id)?.value||0)+1});
            meta.set('storageEpoch',{id:'storageEpoch',value:(currentMeta.get('storageEpoch')?.value||0)+1});
            meta.set('migration:0.7.1',{id:'migration:0.7.1',value:true});
            restored.meta=[...meta.values()];
            for(const name of ALL_STORES){
              restored[name].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
              const store=tx.objectStore(name);store.clear();
              restored[name].forEach(row=>store.put(row));
            }
          } catch(error) {
            fail(new Error(`복원을 중단했어. 기존 데이터는 유지돼. ${error.message} 미리보기를 다시 열고 현재 백업을 보관해줘.`));
          }
        });
      });
      committed=true;
      sessionEpoch=restored.meta.find(row=>row.id==='storageEpoch').value;
      verify(await exportSnapshot(),restored);
      return restored;
    } catch(error) {
      if(committed){
        const uncertain=new Error('복원 쓰기는 완료했지만 다시 읽기 확인에 실패했어. 복원을 반복하지 말고 새로고침 후 내용을 확인해줘. 복원 전 백업은 보관해줘.');
        uncertain.restoreCommitted=true;throw uncertain;
      }
      throw error;
    }
  }
  return {exportSnapshot,restoreSnapshot,appendLogs, listLogs:() => read('logs'), openDB, initialize, readState, saveState, saveRoster, deleteRoster, setActiveId, emptyPersonnel,
    getActiveId:async () => (await read('meta','activeRosterId'))?.value || null,
    listRosters:() => read('rosters'), getRoster:id => read('rosters',id)};
})();

