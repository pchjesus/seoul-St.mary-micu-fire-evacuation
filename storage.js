/* v0.7.2: IndexedDB is authoritative. Legacy mirrors are imported once only. */
const APP_VERSION = '0.7.2';
const AppStorage = (() => {
  const DB_NAME = 'fireEvacuationRosterDB_v0617';
  const STORES = ['rosters', 'overrides', 'personnel', 'meta'];
  let connection;
  let opening;

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
      try { request = indexedDB.open(DB_NAME, 3); }
      catch (error) { fail(error); return; }
      request.onupgradeneeded = () => {
        for (const name of [...STORES, 'logs']) {
          if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, {keyPath:'id'});
        }
      };
      request.onerror = () => fail(request.error);
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
      try { tx = db.transaction(names, mode, {durability:'strict'}); }
      catch (error) {
        if (!(error instanceof TypeError)) { reject(error); return; }
        tx = db.transaction(names, mode);
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
      try { callback(tx, value => { result = value; }, error => { cause = error; tx.abort(); }); }
      catch (error) { cause = error; tx.abort(); }
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
  async function saveRoster(record, replace = false) {
    const safe = JSON.parse(JSON.stringify({...record, sourceBlob:undefined}));
    await transaction(STORES, 'readwrite', (tx, done, fail) => {
      const existing = tx.objectStore('rosters').get(safe.id);
      existing.onsuccess = () => {
        if (existing.result && !replace) { fail(new Error('같은 월의 근무표가 다른 탭에서 저장됐어. 보관함을 다시 열어줘.')); return; }
        tx.objectStore('rosters').put(safe);
        if (replace) {
          clearScope(tx, 'overrides', safe.id);
          tx.objectStore('personnel').delete(safe.id);
          const revision = tx.objectStore('meta').get(`revision:${safe.id}`);
          revision.onsuccess = () => tx.objectStore('meta').put({id:`revision:${safe.id}`, value:(revision.result?.value || 0) + 1});
        }
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
  async function deleteRoster(id) {
    await transaction(STORES, 'readwrite', tx => {
      tx.objectStore('rosters').delete(id);
      clearScope(tx, 'overrides', id);
      tx.objectStore('personnel').delete(id);
      const revision = tx.objectStore('meta').get(`revision:${id}`);
      revision.onsuccess = () => tx.objectStore('meta').put({id:`revision:${id}`, value:(revision.result?.value || 0) + 1});
      const active = tx.objectStore('meta').get('activeRosterId');
      active.onsuccess = () => { if (active.result?.value === id) tx.objectStore('meta').put({id:'activeRosterId',value:null}); };
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
  return {appendLogs, listLogs:() => read('logs'), openDB, initialize, readState, saveState, saveRoster, deleteRoster, setActiveId, emptyPersonnel,
    getActiveId:async () => (await read('meta','activeRosterId'))?.value || null,
    listRosters:() => read('rosters'), getRoster:id => read('rosters',id)};
})();
