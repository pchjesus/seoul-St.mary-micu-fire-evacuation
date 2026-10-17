/* One event boundary for local history; replace the adapter to use a future API. */
const Audit = (() => {
  const labels = Object.freeze({backup_restored:'전체 백업 복원',roster_registered:'근무표 등록',roster_replaced:'근무표 교체',roster_deleted:'근무표 삭제',roster_selected:'근무표 사용',person_added:'인원 추가',person_deleted:'인원 삭제',person_restored:'인원 복원',name_changed:'이름 수정',role_changed:'역할 수정',assignment_changed:'배치 변경',auto_assignment:'자동배치',manual_override:'수동 override',data_reset:'데이터 초기화',save_success:'저장 성공',save_failure:'저장 실패'});
  const adapter = {append:rows => AppStorage.appendLogs(rows), list:() => AppStorage.listLogs()};
  let pending = [];
  let flushing = null;
  let lastError = '';
  let completedCount = 0;
  const handledErrors = new WeakSet();
  const listeners = new Set();
  const clone = value => JSON.parse(JSON.stringify(value));
  const dayKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  function environment(nav=globalThis.navigator || {}) {
    const ua = nav.userAgent || '';
    const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1);
    const os = ios ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Macintosh|Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '알 수 없음';
    const tablet = /iPad|Tablet/.test(ua) || (ios && !/iPhone|iPod/.test(ua)) || (/Android/.test(ua) && !/Mobile/.test(ua));
    const device = tablet ? '태블릿' : /Mobile|iPhone|iPod/.test(ua) || nav.userAgentData?.mobile ? '모바일' : 'PC';
    const browser = /Edg(?:e|A|iOS)?\//.test(ua) ? 'Edge' : /SamsungBrowser\//.test(ua) ? 'Samsung Internet' : /OPR\/|OPiOS\//.test(ua) ? 'Opera' : /Firefox\/|FxiOS\//.test(ua) ? 'Firefox' : /Chrome\/|CriOS\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '알 수 없음';
    return {device,os,browser};
  }
  function uuid() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16)).join('-');
  }
  function notify() {
    const state = {pending:pending.length,error:lastError};
    listeners.forEach(listener => { try { listener(state); } catch (error) { console.error('이력 상태 표시 실패',error); } });
  }
  async function flush() {
    if (flushing) return flushing;
    flushing = (async () => {
      while (pending.length) {
        const batch = pending.slice();
        try { await adapter.append(batch); }
        catch (error) { lastError = error.message || '이력을 저장하지 못했어.'; notify(); return false; }
        const ids = new Set(batch.map(row=>row.id));
        pending = pending.filter(row=>!ids.has(row.id));
        lastError = '';
        notify();
      }
      return true;
    })();
    try { return await flushing; } finally { flushing = null; }
  }
  async function logEvent(events, context={}) {
    const now = new Date(), operationId = uuid();
    const rows = (Array.isArray(events)?events:[events]).map((event,sequence) => ({
      ...clone(context), ...clone(event), id:`${operationId}:${sequence}`,operationId,sequence,
      timestamp:now.toISOString(),dateKey:dayKey(now),utcOffsetMinutes:-now.getTimezoneOffset(),
      environment:environment(),appVersion:APP_VERSION,result:event.result || '성공'
    }));
    pending.push(...rows);
    notify();
    await flush();
    return rows;
  }
  function markHandled(error) { if (error && typeof error==='object') handledErrors.add(error); }
  async function recordFailure(context,error) {
    if (error && typeof error==='object' && handledErrors.has(error)) return;
    markHandled(error);
    await logEvent({action:'save_failure',result:'실패',detail:`${context.operation || '변경 저장'}: ${error?.message || error}`},context);
  }
  async function perform(context,events,mutation) {
    let result;
    try { result = await mutation(); }
    catch (error) { await recordFailure(context,error); throw error; }
    completedCount++;
    // An audit-store failure must never turn a verified operational save into a failed save.
    await logEvent([...events,{action:'save_success',detail:context.operation || '변경 저장'}],context);
    return result;
  }
  const envLabel = row => `${row.environment?.device || '알 수 없음'} · ${row.environment?.os || '알 수 없음'} · ${row.environment?.browser || '알 수 없음'}`;
  const sort = rows => [...rows].sort((a,b)=>b.timestamp.localeCompare(a.timestamp) || b.operationId.localeCompare(a.operationId) || b.sequence-a.sequence);
  function filter(rows,criteria={}) {
    return sort(rows.filter(row => (!criteria.from || row.dateKey>=criteria.from) && (!criteria.to || row.dateKey<=criteria.to) && (!criteria.action || row.action===criteria.action) && (!criteria.environment || envLabel(row)===criteria.environment)));
  }
  function group(rows,mode='date') {
    const groups = new Map();
    rows.forEach(row => {
      const key = mode==='environment' ? envLabel(row) : row.dateKey;
      if (!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(row);
    });
    return [...groups];
  }
  function timeLabel(row) {
    // Preserve the recorded local time even if the viewing device changes timezone.
    const date = new Date(Date.parse(row.timestamp)+(row.utcOffsetMinutes || 0)*60000);
    const offset = row.utcOffsetMinutes || 0;
    return `${date.toISOString().slice(0,19).replace('T',' ')} UTC${offset<0?'-':'+'}${String(Math.floor(Math.abs(offset)/60)).padStart(2,'0')}:${String(Math.abs(offset)%60).padStart(2,'0')}`;
  }
  function exportWorkbook(rows) {
    const headings = ['시간','작업','대상','변경 전','변경 후','기기 유형','OS','브라우저','결과','앱 버전','근무표','적용 범위','상세','기록 상태','이력 ID','작업 ID'];
    const values = sort(rows).map(row=>[timeLabel(row),labels[row.action]||row.action,row.target,row.before,row.after,row.environment?.device,row.environment?.os,row.environment?.browser,row.result,`v${row.appVersion}`,row.rosterId,row.context,row.detail,row.pending?'저장 대기 (현재 창)':'저장 확인',row.id,row.operationId].map(value=>String(value??'')));
    // Explicit string cells prevent user-provided names from becoming Excel formulas.
    const sheet = XLSX.utils.aoa_to_sheet([headings,...values]);
    sheet['!cols'] = headings.map((_,i)=>({wch:[31,18,25,40,40,12,14,18,10,12,18,24,60,24,44,38][i]}));
    sheet['!autofilter'] = {ref:sheet['!ref']};
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook,sheet,'수정 이력');
    return workbook;
  }
  async function list() {
    const saved = await adapter.list();
    const merged = new Map(saved.map(row=>[row.id,row]));
    pending.forEach(row=>{ if(!merged.has(row.id)) merged.set(row.id,{...row,pending:true}); });
    return sort([...merged.values()]);
  }
  return {labels,environment,dayKey,envLabel,filter,group,timeLabel,exportWorkbook,logEvent,perform,recordFailure,list,retry:flush,
    get pendingCount(){return pending.length;},get completedCount(){return completedCount;},
    subscribe(listener){listeners.add(listener);listener({pending:pending.length,error:lastError});return()=>listeners.delete(listener);}
  };
})();
function logEvent(event,context) { return Audit.logEvent(event,context); }
