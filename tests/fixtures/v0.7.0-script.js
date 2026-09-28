
/* v0.6.17 Storage abstraction
 * Primary: IndexedDB
 * Fallback/mirror: localStorage (JSON-safe roster/override data only)
 *
 * The application never bundles an operational roster. A roster exists only
 * after the user uploads it, and is stored locally in the current browser.
 */
const AppStorage = (() => {
  const DB_NAME = 'fireEvacuationRosterDB_v0617';
  const DB_VERSION = 1;
  const STORES = { rosters:'rosters', overrides:'overrides' };
  const LS_ROSTERS = 'micu.fire.v0617.rosters';
  const LS_OVERRIDES = 'micu.fire.v0617.overrides';
  const LS_ACTIVE = 'micu.fire.v0617.activeRosterId';
  let dbPromise=null;

  const jsonRead=(key,fallback)=>{ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; }catch(e){ return fallback; } };
  const jsonWrite=(key,value)=>{ try{ localStorage.setItem(key,JSON.stringify(value)); return true; }catch(e){ return false; } };

  function openDB(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!window.indexedDB){ reject(new Error('IndexedDB를 사용할 수 없어.')); return; }
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORES.rosters)){
          const s=db.createObjectStore(STORES.rosters,{keyPath:'id'});
          s.createIndex('monthKey','monthKey',{unique:false});
        }
        if(!db.objectStoreNames.contains(STORES.overrides)){
          const s=db.createObjectStore(STORES.overrides,{keyPath:'id'});
          s.createIndex('rosterId','rosterId',{unique:false});
          s.createIndex('contextKey','contextKey',{unique:false});
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('IndexedDB 열기에 실패했어.'));
      req.onblocked=()=>reject(new Error('IndexedDB가 다른 탭에서 사용 중이야.'));
    });
    return dbPromise;
  }

  async function getAll(storeName){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const req=db.transaction(storeName,'readonly').objectStore(storeName).getAll();
      req.onsuccess=()=>resolve(req.result||[]);
      req.onerror=()=>reject(req.error);
    });
  }
  async function get(storeName,id){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const req=db.transaction(storeName,'readonly').objectStore(storeName).get(id);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
  }
  async function put(storeName,value){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(storeName,'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete=()=>resolve(true);
      tx.onerror=()=>reject(tx.error||new Error('저장에 실패했어.'));
      tx.onabort=()=>reject(tx.error||new Error('저장이 중단됐어.'));
    });
  }
  async function remove(storeName,id){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(storeName,'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete=()=>resolve(true);
      tx.onerror=()=>reject(tx.error||new Error('삭제에 실패했어.'));
      tx.onabort=()=>reject(tx.error||new Error('삭제가 중단됐어.'));
    });
  }
  async function clearByIndex(storeName,indexName,value){
    const db=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(storeName,'readwrite');
      const req=tx.objectStore(storeName).index(indexName).openCursor(IDBKeyRange.only(value));
      req.onsuccess=()=>{ const c=req.result; if(c){ c.delete(); c.continue(); } };
      tx.oncomplete=()=>resolve(true);
      tx.onerror=()=>reject(tx.error||new Error('정리하지 못했어.'));
      tx.onabort=()=>reject(tx.error||new Error('정리가 중단됐어.'));
    });
  }

  function rosterId(monthKey){ return `roster:${monthKey}`; }
  function overrideId(rosterIdValue,dateKey,duty,role,slot){
    return [rosterIdValue,dateKey,duty,role,slot].map(v=>String(v)).join('|');
  }

  function stripBlob(record){
    const copy={...record};
    delete copy.sourceBlob;
    copy.monthKey=copy.monthKey||rosterKey(copy.year,copy.month);
    return copy;
  }
  function mirrorRosters(records){ jsonWrite(LS_ROSTERS,records.map(stripBlob)); }
  function mirrorOverrides(records){ jsonWrite(LS_OVERRIDES,records); }

  async function listRosters(){
    try{
      const records=await getAll(STORES.rosters);
      if(records.length) { mirrorRosters(records); return records; }
    }catch(e){ console.warn('IndexedDB 근무표 읽기 실패:',e); }
    return jsonRead(LS_ROSTERS,[]);
  }
  async function saveRoster(record){
    const safe=stripBlob(record);
    let saved=false;
    try{ saved=await put(STORES.rosters,safe); }catch(e){ console.warn('IndexedDB 근무표 저장 실패:',e); }
    const current=jsonRead(LS_ROSTERS,[]);
    const idx=current.findIndex(r=>r.id===safe.id);
    if(idx>=0) current[idx]=safe; else current.push(safe);
    mirrorRosters(current);
    return saved||true;
  }
  async function getRoster(id){
    try{ const r=await get(STORES.rosters,id); if(r) return r; }catch(e){}
    return jsonRead(LS_ROSTERS,[]).find(r=>r.id===id)||null;
  }
  async function deleteRoster(id){
    let ok=false;
    try{ ok=await remove(STORES.rosters,id); }catch(e){ console.warn('IndexedDB 근무표 삭제 실패:',e); }
    const current=jsonRead(LS_ROSTERS,[]).filter(r=>r.id!==id);
    mirrorRosters(current);
    return ok||true;
  }
  async function listOverrides(){
    try{
      const records=await getAll(STORES.overrides);
      if(records.length) { mirrorOverrides(records); return records; }
    }catch(e){ console.warn('IndexedDB override 읽기 실패:',e); }
    return jsonRead(LS_OVERRIDES,[]);
  }
  async function saveOverride(record){
    let ok=false;
    try{ ok=await put(STORES.overrides,record); }catch(e){ console.warn('IndexedDB override 저장 실패:',e); }
    const current=jsonRead(LS_OVERRIDES,[]);
    const idx=current.findIndex(r=>r.id===record.id);
    if(idx>=0) current[idx]=record; else current.push(record);
    mirrorOverrides(current);
    return ok||true;
  }
  async function deleteOverride(id){
    let ok=false;
    try{ ok=await remove(STORES.overrides,id); }catch(e){}
    mirrorOverrides(jsonRead(LS_OVERRIDES,[]).filter(r=>r.id!==id));
    return ok||true;
  }
  async function deleteOverridesForRoster(rosterIdValue){
    try{ await clearByIndex(STORES.overrides,'rosterId',rosterIdValue); }catch(e){}
    mirrorOverrides(jsonRead(LS_OVERRIDES,[]).filter(r=>r.rosterId!==rosterIdValue));
    return true;
  }
  async function restoreMirrorToIndexedDB(){
    try{
      const [rs,os]=await Promise.all([getAll(STORES.rosters),getAll(STORES.overrides)]);
      const mr=jsonRead(LS_ROSTERS,[]), mo=jsonRead(LS_OVERRIDES,[]);
      if(!rs.length && mr.length) for(const r of mr) await put(STORES.rosters,r);
      if(!os.length && mo.length) for(const o of mo) await put(STORES.overrides,o);
    }catch(e){}
  }

  return {
    openDB,listRosters,getRoster,saveRoster,deleteRoster,
    listOverrides,saveOverride,deleteOverride,deleteOverridesForRoster,
    makeRosterId:rosterId,makeOverrideId:overrideId,restoreMirrorToIndexedDB,
    getActiveId:()=>{try{return localStorage.getItem(LS_ACTIVE)}catch(e){return null}},
    setActiveId:id=>{try{if(id)localStorage.setItem(LS_ACTIVE,id);else localStorage.removeItem(LS_ACTIVE)}catch(e){}}
  };
})();


const SAMPLE = {
  year: 2026,
  month: 9,
  groups: [
    {name:'Charge', people:['김서윤','박지훈','이하은','최민재','정수빈','한도윤','윤채원','강현우']},
    {name:'중간년차', people:['송예린','조성민','임나연','오준혁','서지민','배현서']},
    {name:'저연차', people:['권도현','신유진','문재현','류하린','장민석','홍예은']}
  ],
  rows: [
    ['김서윤', 'EFE', 'E', 'N', 'N', 'OF', 'OF', 'D', 'E', 'E', 'E', 'OF', 'OF', 'OF', 'E', 'N', 'N', 'OF', 'OF', 'E', 'E', 'E', 'OF', 'C', 'PE', 'V', 'D', 'D', 'V', 'V', 'D', 'D'],
    ['박지훈', 'NNF', 'OF', 'E', 'E', 'E', 'OF', 'OF', 'OF', 'D', 'N', 'OF', 'OF', 'D', 'D', 'D', 'D', 'E', 'OF', 'OF', 'E', 'E', 'OF', 'C', 'PE', 'D', 'D', 'N', 'PE', 'V', 'V', 'N'],
    ['이하은', 'FFD', 'D', 'D', 'D', 'D', 'OF', 'OF', 'OF', 'OF', 'D', 'E', 'N', 'OF', 'OF', 'D', 'D', 'D', 'OF', 'OF', 'D', 'D', 'C', 'PE', 'D', 'N', 'N', 'PE', 'V', 'V', 'V', 'D'],
    ['최민재', 'FNN', 'NC', 'OF', 'OF', 'OF', 'NC', 'NC', 'NC', 'OF', 'OF', 'OF', 'OF', 'NC', 'NC', 'OF', 'C', 'PE', 'NC', 'NC', 'NC', 'PE', 'NV', 'NC', 'NC', 'NC', 'NV', 'V', 'NC', 'NC', 'V', 'V'],
    ['정수빈', 'DEF', 'OF', 'D', 'D', 'D', 'OF', 'OF', 'D', 'D', 'E', 'E', 'E', 'OF', 'OF', 'OF', 'OF', 'OF', 'C', 'D', 'D', 'D', 'D', 'D', 'PE', 'PE', 'V', 'D', 'D', 'E', 'E', 'V'],
    ['한도윤', 'FEE', 'E', 'N', 'N', 'OF', 'OF', 'E', 'E', 'OF', 'OF', 'D', 'E', 'E', 'OF', 'OF', 'N', 'N', 'OF', 'OF', 'E', 'C', 'PE', 'D', 'E', 'E', 'E', 'V', 'V', 'N', 'N', 'V'],
    ['윤채원', 'EEE', 'E', 'OF', 'OF', 'OF', 'D', 'D', 'E', 'E', 'OF', 'OF', 'N', 'N', 'OF', 'OF', 'OF', 'D', 'D', 'D', 'C', 'PE', 'E', 'E', 'E', 'E', 'V', 'V', 'V', 'V', 'E', 'E'],
    ['강현우', 'FDD', 'D', 'E', 'OF', 'OF', 'D', 'OF', 'OF', 'OF', 'D', 'D', 'D', 'D', 'D', 'OF', 'OF', 'D', 'D', 'D', 'OF', 'C', 'E', 'N', 'N', 'PE', 'V', 'V', 'V', 'D', 'D', 'E'],
    ['송예린', 'FDD', 'NC', 'OF', 'OF', 'NC', 'OF', 'OF', 'OF', 'NC', 'NC', 'NC', 'OF', 'OF', 'NC', 'NC', 'OF', 'NV', 'NC', 'NV', 'C', 'NC', 'NC', 'PE', 'V', 'NC', 'NC', 'V', 'V', 'NC', 'NC', 'NC'],
    ['조성민', 'FFN', 'OF', 'OF', 'D', 'D', 'D', 'D', 'D', 'OF', 'OF', 'N', 'OF', 'OF', 'D', 'D', 'E', 'OF', 'OF', 'D', 'D', 'N', 'N', 'C', 'PE', 'D', 'E', 'E', 'E', 'V', 'V', 'V'],
    ['임나연', 'FNN', 'OF', 'OF', 'D', 'E', 'E', 'E', 'OF', 'OF', 'OF', 'OF', 'D', 'D', 'OF', 'OF', 'N', 'N', 'C', 'PE', 'D', 'D', 'D', 'D', 'E', 'V', 'V', 'E', 'E', 'E', 'E', 'V'],
    ['오준혁', 'NNF', 'OF', 'E', 'E', 'E', 'OF', 'OF', 'D', 'D', 'OF', 'OF', 'E', 'E', 'E', 'E', 'OF', 'OF', 'D', 'E', 'E', 'N', 'N', 'OF', 'C', 'PE', 'D', 'D', 'D', 'PE', 'V', 'V'],
    ['서지민', 'FEE', 'OF', 'OF', 'E', 'E', 'E', 'OF', 'N', 'N', 'OF', 'OF', 'D', 'D', 'OF', 'OF', 'D', 'N', 'N', 'OF', 'C', 'PE', 'PE', 'V', 'D', 'D', 'D', 'N', 'N', 'V', 'V', 'D'],
    ['배현서', 'DDD', 'D', 'D', 'OF', 'OF', 'OF', 'E', 'E', 'E', 'OF', 'OF', 'N', 'N', 'OF', 'OF', 'E', 'E', 'E', 'E', 'OF', 'C', 'D', 'E', 'PE', 'V', 'V', 'V', 'E', 'E', 'E', 'E'],
    ['권도현', 'EFF', 'D', 'D', 'E', 'OF', 'D', 'D', 'N', 'N', 'OF', 'OF', 'E', 'E', 'E', 'E', 'OF', 'OF', 'E', 'N', 'N', 'OF', 'OF', 'D', 'D', 'OF', 'C', 'E', 'E', 'E', 'PE', 'V'],
    ['신유진', 'EEE', 'E', 'E', 'OF', 'OF', 'N', 'N', 'OF', 'OF', 'D', 'D', 'D', 'E', 'OF', 'OF', 'D', 'D', 'D', 'OF', 'OF', 'D', 'D', 'C', 'PE', 'E', 'N', 'V', 'V', 'D', 'D', 'V'],
    ['문재현', 'NFF', 'N', 'N', 'OF', 'OF', 'E', 'E', 'OF', 'OF', 'N', 'N', 'OF', 'OF', 'OF', 'E', 'E', 'E', 'E', 'OF', 'C', 'E', 'PE', 'V', 'D', 'D', 'E', 'E', 'V', 'V', 'N', 'N'],
    ['류하린', 'DEF', 'OF', 'OF', 'OF', 'N', 'N', 'OF', 'OF', 'E', 'E', 'E', 'OF', 'OF', 'N', 'N', 'OF', 'C', 'PE', 'N', 'N', 'V', 'V', 'E', 'E', 'E', 'V', 'V', 'D', 'D', 'D', 'D'],
    ['장민석', 'FDD', 'OF', 'OF', 'N', 'N', 'OF', 'OF', 'D', 'D', 'D', 'D', 'OF', 'OF', 'E', 'E', 'E', 'E', 'OF', 'OF', 'C', 'E', 'E', 'E', 'PE', 'V', 'E', 'N', 'N', 'V', 'V', 'E'],
    ['홍예은', 'DDN', 'OF', 'OF', 'OF', 'D', 'E', 'N', 'OF', 'OF', 'E', 'E', 'OF', 'OF', 'D', 'D', 'OF', 'C', 'E', 'E', 'PE', 'PE', 'E', 'N', 'N', 'V', 'V', 'D', 'D', 'D', 'V', 'V']
  ]};

const DUTIES=['D','E','N'];
const DUTY_INFO={
  D:{label:'Day',time:'07:00–15:30'},
  E:{label:'Evening',time:'15:00–22:30'},
  N:{label:'Night',time:'22:00–07:30'}
};
const DEFAULT_SETTINGS={rule:'micu-v1'};
const DB_NAME='fireEvacuationRosterDB_v0617';
const DB_VERSION=1;
const ROSTER_SCHEMA_VERSION=3;
const STORE='rosters';
const ACTIVE_ROSTER_KEY='fireEvacuation.activeRosterId.v0617';

let roster=buildRosterFromSample();
let rosterRecords=[];
const sampleRoster=roster;
let selectedDate=new Date();
let selectedDuty=getDutyFromClock(selectedDate);
let calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
let settings={...DEFAULT_SETTINGS};
let dataSource='sample';
let sourceFileName='샘플 데이터';
let pendingRoster=null,pendingFileName='',pendingFileBlob=null;
let editMode=false;
let manualAssignments={};
let draftAssignments={};
let editDirty=false;
let toastTimer=null;

const $ = id => document.getElementById(id);

function buildRosterFromSample(){
  const all=[];
  SAMPLE.groups.forEach(g=>g.people.forEach(name=>all.push({name,group:g.name})));
  const shifts={};
  for(let day=1;day<=30;day++){
    shifts[String(day)]=SAMPLE.rows.map(r=>r[day+1]||'');
  }
  return {id:rosterKey(SAMPLE.year,SAMPLE.month),year:SAMPLE.year,month:SAMPLE.month,all,shifts,groups:SAMPLE.groups,maxDay:30,schemaVersion:ROSTER_SCHEMA_VERSION};
}

function normalizeDuty(v){
  // 근무자로 인정되는 코드는 D / E / N / NC뿐이다.
  // NV, OF, C, PE, V 등은 어떤 경우에도 근무자로 변환하지 않는다.
  const code=String(v??'').trim().toUpperCase();
  if(code==='NC') return 'N';
  if(code==='D'||code==='E'||code==='N') return code;
  return null;
}

function groupClass(group){
  return group==='Charge'?'charge':group==='중간년차'?'mid':'junior';
}
function groupIndex(group, rosterRef=roster){
  return rosterRef.groups.findIndex(g=>g.name===group);
}

function getActiveRosterId(){
  return AppStorage.getActiveId() || localStorage.getItem(ACTIVE_ROSTER_KEY);
}

function setActiveRosterId(id){
  AppStorage.setActiveId(id);
  if(id) localStorage.setItem(ACTIVE_ROSTER_KEY,id);
  else localStorage.removeItem(ACTIVE_ROSTER_KEY);
}

function getActiveRosterRecord(){
  const id=getActiveRosterId();
  return id ? rosterRecords.find(r=>r.id===id) || null : null;
}

function getRosterForDate(date){
  const year=date.getFullYear(), month=date.getMonth()+1;
  const active=getActiveRosterRecord();
  // 저장된 근무표는 날짜가 같다는 이유만으로 자동 적용하지 않는다.
  // 사용자가 명시적으로 '사용'한 근무표만 활성 근무표로 취급한다.
  if(active){
    if(active.year===year && active.month===month) return recordToRoster(active);
    return null;
  }
  if(sampleRoster.year===year && sampleRoster.month===month) return sampleRoster;
  return null;
}

function getOnDuty(date,duty, rosterRef=getRosterForDate(date)){
  if(!rosterRef || date.getFullYear()!==rosterRef.year || date.getMonth()+1!==rosterRef.month) return [];
  const arr=rosterRef.shifts[String(date.getDate())]||[];
  return rosterRef.all.map((p,i)=>({...p,duty:normalizeDuty(arr[i])}))
    .filter(p=>p.duty===duty);
}

function getDutyFromClock(date){
  // 야간근무(N)는 시작일 기준으로 표시한다.
  // 22:00~익일 07:30은 전날 날짜의 N 근무로 취급한다.
  // 경계: 07:30 D 시작 / 15:00 E 시작 / 22:00 N 시작.
  const mins=date.getHours()*60+date.getMinutes();
  if(mins>=450 && mins<900) return 'D';       // 07:30–14:59
  if(mins>=900 && mins<1320) return 'E';      // 15:00–21:59
  return 'N';                                 // 22:00–07:29
}


function renderCurrentClock(){
  const now=new Date();
  const hh=String(now.getHours()).padStart(2,'0');
  const mm=String(now.getMinutes()).padStart(2,'0');
  const yyyy=now.getFullYear();
  const mo=String(now.getMonth()+1).padStart(2,'0');
  const dd=String(now.getDate()).padStart(2,'0');
  const dow=['일','월','화','수','목','금','토'][now.getDay()];
  $('currentTime').textContent=`${hh}:${mm}`;
  $('currentDate').textContent=`${yyyy}.${mo}.${dd} (${dow})`;
}

function render(){
  const y=selectedDate.getFullYear(),m=selectedDate.getMonth()+1,d=selectedDate.getDate();
  const dow=['일','월','화','수','목','금','토'][selectedDate.getDay()];
  $('dateSmall').textContent=`${m}월 ${d}일 ${dow}요일`;
  $('dateMain').textContent=`${y}년 ${m}월 ${d}일`;
  $('dutyPill').textContent=selectedDuty;
  $('dutyTime').textContent=DUTY_INFO[selectedDuty].time;
  document.querySelectorAll('.duty-buttons button').forEach(b=>b.classList.toggle('active',b.dataset.duty===selectedDuty));
  const dateRoster=getRosterForDate(selectedDate);
  const staff=getOnDuty(selectedDate,selectedDuty,dateRoster);
  $('staffCount').textContent=`${staff.length}명`;
  $('fileStatus').textContent=dateRoster ? (dateRoster===sampleRoster ? '샘플 데이터' : (rosterRecords.find(r=>r.year===dateRoster.year&&r.month===dateRoster.month)?.fileName || '저장된 근무표')) : '근무표 없음';
  $('sourceMeta').textContent=dateRoster ? (dateRoster===sampleRoster ? '현재 기본 데이터' : `${dateRoster.year}년 ${dateRoster.month}월 근무표`) : `${y}년 ${m}월 근무표 없음`;
  $('ruleStatus').textContent='MICU 기본 규칙';
  $('printMeta').textContent=`${y}년 ${m}월 ${d}일 · ${selectedDuty} · ${DUTY_INFO[selectedDuty].label}`;
  $('editModeBadge').textContent=editMode ? (editDirty?'수정 중 · 변경됨':'수정 모드') : '기본 규칙';
  $('editHint').textContent=editMode ? (editDirty?'변경사항이 있어. 완료하면 현재 배치에 적용돼.':'수정 모드: 각 역할의 이름을 클릭해서 직접 바꿀 수 있어.') : '';
  renderStaff(staff,dateRoster);
  renderAssignments(staff,dateRoster);
  renderCalendar();
}

function renderStaff(staff,dateRoster){
  const el=$('staffList');
  el.innerHTML='';
  if(!dateRoster){
    el.innerHTML='<div class="notice">해당 날짜의 근무표가 없습니다.</div>';
    return;
  }
  if(!staff.length){
    el.innerHTML='<div class="notice">해당 날짜/듀티의 근무자가 없어. 다른 듀티나 날짜를 선택해봐.</div>';
    return;
  }
  staff.forEach(p=>{
    const row=document.createElement('div');
    row.className='staff-row';
    row.innerHTML=`<div class="staff-left">
      <span class="rank-dot ${groupClass(p.group)}"></span>
      <div><div class="staff-name">${p.name}</div><div class="group-label">${p.group}</div></div>
    </div><span class="duty-tag">${p.duty}</span>`;
    el.appendChild(row);
  });
}

function renderAssignments(staff,dateRoster){
  const el=$('assignmentList');
  el.innerHTML='';
  if(!dateRoster){
    ['통보연락반','소화반','대피유도반'].forEach(role=>addAssignment(role,'근무표 없음','해당 날짜의 근무표가 없습니다.','support',`${selectedDate.getFullYear()}-${selectedDate.getMonth()+1}-${selectedDate.getDate()}-${selectedDuty}`,role,0));
    return;
  }
  if(!staff.length){
    ['통보연락반','소화반','대피유도반'].forEach(role=>addAssignment(role,'배치 인원 없음','해당 날짜/듀티의 근무자가 없습니다.','support',`${dateRoster.year}-${dateRoster.month}-${selectedDate.getDate()}-${selectedDuty}`,role,0));
    return;
  }

  // MICU 실제 확인 규칙: 근무자 전체를 선임순으로 정렬한다.
  // 1번 = 통보연락반 / 2~3번 = 소화반 / 4번 이하 = 대피유도반.
  const ordered=[...staff].sort((a,b)=>
    groupIndex(a.group,dateRoster)-groupIndex(b.group,dateRoster) ||
    dateRoster.all.findIndex(x=>x.name===a.name)-dateRoster.all.findIndex(x=>x.name===b.name)
  );

  const keyBase=`${getRosterIdForRoster(dateRoster)}|${dateRoster.year}-${dateRoster.month}-${selectedDate.getDate()}-${selectedDuty}`;
  const activeAssignments=editMode?draftAssignments:manualAssignments;
  const getManual=(role,slot,fallback)=>activeAssignments[`${keyBase}|${role}|${slot}`] ?? fallback;
  const used=new Set();

  const notification=ordered[0];
  if(notification){
    used.add(notification.name);
    addAssignment(
      '통보연락반',
      getManual('통보연락반',0,notification.name),
      '근무자 중 최선임',
      'notification',keyBase,'통보연락반',0
    );
  }

  const fireStaff=ordered.slice(1,3);
  fireStaff.forEach(p=>used.add(p.name));
  const fireNames=fireStaff.map((p,i)=>getManual('소화반',i,p.name));
  addAssignment(
    '소화반',
    fireNames.length ? fireNames : ['배치 인원 없음'],
    '차선임 · 3번째 선임',
    'fire',keyBase,'소화반',0
  );

  // 대피유도반은 실제 MICU 편성상 항상 패널을 표시한다.
  // 4번째 이하 근무자가 없더라도 패널 자체는 유지하고, 배치 인원만 없다고 표시한다.
  const evacuation=ordered.slice(3);
  const names=evacuation.map((p,i)=>{
    used.add(p.name);
    return getManual('대피유도반',i,p.name);
  });
  addAssignment(
    '대피유도반',
    names.length ? names : ['배치 인원 없음'],
    '4번째 이하 간호사 · 현재 근무표에는 간호사만 포함',
    'evacuation wide',keyBase,'대피유도반',0
  );

  // 실제 MICU에서는 사원·의사도 대피유도반에 포함된다.
  // 현재 데이터 구조에는 해당 직종이 없으므로 별도 인원을 추정하거나 생성하지 않는다.
}

function addAssignment(role,names,reason,cls,keyBase,slotRole,slot){
  const el=document.createElement('div');
  el.className=`assignment ${cls}${editMode?' edit-mode':''}`;
  const values=Array.isArray(names) ? names.map(v=>String(v??'—')) : [String(names??'—')];
  const rolePrefix=`${keyBase}|${slotRole}|`;
  const activeAssignments=editMode?draftAssignments:manualAssignments;
  const roleModified=Object.keys(activeAssignments).some(key=>key.startsWith(rolePrefix));
  const editable=editMode && values[0]!=='인원 부족' && values[0]!=='배치 인원 없음' && values.length>0;

  const personHtml=values.map((value,index)=>{
    const actualSlot=slot+index;
    const canEdit=editMode && value!=='인원 부족' && value!=='배치 인원 없음';
    return canEdit
      ? `<span class="editable-name" contenteditable="true" data-role="${slotRole}" data-slot="${actualSlot}" spellcheck="false">${escapeHtml(value)}</span>`
      : `<span class="assignment-name">${escapeHtml(value)}</span>`;
  }).join(' <span class="name-separator" aria-hidden="true">·</span> ');

  el.innerHTML=`<div class="assignment-head"><div class="role">${role}${roleModified?'<span class="modified-badge">수정됨</span>':''}</div>${editMode?`<button type="button" class="reset-role-btn" data-role="${slotRole}" title="${role}의 수정사항 초기화">↺ 초기화</button>`:''}</div>
    <div class="person">${personHtml}</div>
    <div class="reason">${escapeHtml(reason)}</div>`;
  $('assignmentList').appendChild(el);

  if(editable){
    el.querySelectorAll('.editable-name').forEach(node=>{
      node.addEventListener('input',()=>{
        const key=`${keyBase}|${slotRole}|${node.dataset.slot}`;
        const value=node.textContent.replace(/\s+/g,' ').trim();
        draftAssignments[key]=value||'—';
        editDirty=true;
        $('editModeBadge').textContent='수정 중 · 변경됨';
        $('editHint').textContent='변경사항이 있어. 완료하면 현재 배치에 적용돼.';
        const badge=el.querySelector('.modified-badge');
        if(badge) badge.hidden=false;
        else if(!el.querySelector('.modified-badge')){
          const roleEl=el.querySelector('.role');
          if(roleEl) roleEl.insertAdjacentHTML('beforeend','<span class="modified-badge">수정됨</span>');
        }
      });
    });
  }
  if(editMode){
    const resetBtn=el.querySelector('.reset-role-btn');
    resetBtn?.addEventListener('click',()=>{
      if(!confirm(`${slotRole}의 수정사항을 초기화할까?\n자동 배치 상태로 돌아가.`)) return;
      const prefix=`${keyBase}|${slotRole}|`;
      Object.keys(draftAssignments).forEach(key=>{
        if(key.startsWith(prefix)) delete draftAssignments[key];
      });
      editDirty=JSON.stringify(draftAssignments)!==JSON.stringify(manualAssignments);
      showToast(`${slotRole} 수정사항을 초기화했어.`);
      render();
    });
  }
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function addEmpty(role){
  const el=document.createElement('div');
  el.className='assignment support';
  el.innerHTML=`<div class="role">${role}</div><div class="person">인원 부족</div>
    <div class="reason">현재 듀티에서 배정 가능한 인원이 부족함</div>`;
  $('assignmentList').appendChild(el);
}

function renderCalendar(){
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();
  const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),prevDays=new Date(y,m,0).getDate();
  const today=new Date();
  const todayKey=`${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
  let html=`<div class="cal-head"><button id="prevMonth">‹</button><div class="cal-title">${y}년 ${m+1}월</div><button id="nextMonth">›</button></div>
    <div class="cal-tools"><button id="todayBtn" class="calendar-today" type="button">오늘</button></div>
    <div class="cal-grid">${['일','월','화','수','목','금','토'].map(x=>`<div class="cal-week">${x}</div>`).join('')}`;
  const start=first.getDay();

  // 달력에 보이는 앞/뒤 달의 날짜도 클릭 가능하게 한다.
  // 날짜 선택은 근무표 존재 여부와 독립적이므로 어느 달의 날짜든 선택할 수 있다.
  for(let i=start-1;i>=0;i--){
    const day=prevDays-i;
    const date=new Date(y,m-1,day);
    const key=`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
    const sel=date.toDateString()===selectedDate.toDateString();
    const isToday=key===todayKey;
    html+=`<button class="cal-day muted ${sel?'selected ':''}${isToday?'today':''}" data-date="${key}" aria-current="${isToday?'date':'false'}">${day}</button>`;
  }
  for(let day=1;day<=days;day++){
    const key=`${y}-${m+1}-${day}`;
    const sel=y===selectedDate.getFullYear()&&m===selectedDate.getMonth()&&day===selectedDate.getDate();
    const isToday=key===todayKey;
    html+=`<button class="cal-day ${sel?'selected ':''}${isToday?'today':''}" data-date="${key}" aria-current="${isToday?'date':'false'}">${day}</button>`;
  }
  const total=Math.ceil((start+days)/7)*7;
  const nextCount=total-start-days;
  for(let day=1;day<=nextCount;day++){
    const date=new Date(y,m+1,day);
    const key=`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
    const sel=date.toDateString()===selectedDate.toDateString();
    const isToday=key===todayKey;
    html+=`<button class="cal-day muted ${sel?'selected ':''}${isToday?'today':''}" data-date="${key}" aria-current="${isToday?'date':'false'}">${day}</button>`;
  }
  html+='</div>';
  $('calendar').innerHTML=html;

  // 달력 내부 조작은 바깥 클릭 닫기 이벤트로 전달되지 않게 한다.
  // renderCalendar()가 내부 DOM을 다시 만들어도 calendar 컨테이너 자체는 유지된다.
  $('calendar').onclick=(e)=>e.stopPropagation();

  $('prevMonth').onclick=(e)=>{
    e.stopPropagation();
    calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);
    renderCalendar();
  };
  $('nextMonth').onclick=(e)=>{
    e.stopPropagation();
    calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);
    renderCalendar();
  };
  const goToToday=()=>{
    const now=new Date();
    selectedDate=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    selectedDuty=getDutyFromClock(now);
    if(selectedDuty==='N' && (now.getHours()*60+now.getMinutes())<450){
      selectedDate.setDate(selectedDate.getDate()-1);
    }
    calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
    render();
  };
  $('todayQuickBtn').onclick=()=>{goToToday();showToast('오늘 날짜와 현재 듀티로 이동했어.');};
  $('todayBtn').onclick=(e)=>{
    e.stopPropagation();
    goToToday();
    $('calendar').classList.remove('hidden');
    $('dateButton').setAttribute('aria-expanded','true');
  };
  $('calendar').querySelectorAll('[data-date]').forEach(b=>b.onclick=(e)=>{
    e.stopPropagation();
    if(!maybeLeaveEdit('날짜를 변경')) return;
    const [yy,mm,dd]=b.dataset.date.split('-').map(Number);
    selectedDate=new Date(yy,mm-1,dd);
    calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);

    // 날짜를 선택해도 달력 팝업은 닫지 않는다.
    // 선택한 날짜의 본 화면 정보만 갱신하고, 해당 월의 달력을 계속 보여준다.
    render();
    $('calendar').classList.remove('hidden');
    $('dateButton').setAttribute('aria-expanded','true');
  });
}

function moveDuty(dir){
  if(!maybeLeaveEdit('듀티를 변경')) return;
  let idx=DUTIES.indexOf(selectedDuty)+dir;
  if(idx<0){
    selectedDate=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),selectedDate.getDate()-1);
    idx=2;
  }
  if(idx>=3){
    selectedDate=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),selectedDate.getDate()+1);
    idx=0;
  }
  selectedDuty=DUTIES[idx];
  render();
}

function nextDay(){
  if(!maybeLeaveEdit('다음 날로 이동')) return;
  selectedDate=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),selectedDate.getDate()+1);
  selectedDuty='D';
  render();
}

function extractMonthYear(fileName){
  const s=fileName.replace(/\.[^.]+$/,'');
  let m=s.match(/(20\d{2})\D{0,4}(1[0-2]|0?[1-9])\D*(?:월)?/);
  if(m) return {year:Number(m[1]),month:Number(m[2])};
  m=s.match(/(20\d{2})[._-](1[0-2]|0?[1-9])/);
  if(m) return {year:Number(m[1]),month:Number(m[2])};
  m=s.match(/(20\d{2})(0[1-9]|1[0-2])/);
  if(m) return {year:Number(m[1]),month:Number(m[2])};
  return null;
}

function parseWorkbook(ws){
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
  const headerIndex=rows.findIndex(r=>r.some(v=>String(v).trim()==='1'));
  if(headerIndex<0) throw new Error('날짜 행(1, 2, 3...)을 찾지 못했어.');

  const header=rows[headerIndex];
  const dayCols=[];
  for(let c=0;c<header.length;c++){
    const raw=header[c];
    const n=(typeof raw==='number') ? raw : Number(String(raw).trim());
    if(Number.isInteger(n)&&n>=1&&n<=31) dayCols.push([n,c]);
  }
  if(!dayCols.length) throw new Error('날짜 열을 찾지 못했어.');

  // 근무표 형식이 월별로 조금 달라질 수 있으므로 이름 열을 고정하지 않는다.
  // 날짜 첫 열보다 앞쪽에서 실제 사람 이름처럼 보이는 열을 자동 탐지한다.
  const firstDayCol=dayCols[0][1];
  const preDayCols=Math.max(0,firstDayCol);
  const hangulName=/^[가-힣]{2,4}$/;
  let nameCol=-1;
  let bestScore=-1;
  for(let c=0;c<preDayCols;c++){
    let score=0;
    for(let r=headerIndex+1;r<rows.length;r++){
      const v=String(rows[r]?.[c]??'').trim();
      if(!v || v==='index') continue;
      if(hangulName.test(v)) score++;
    }
    if(score>bestScore){bestScore=score;nameCol=c;}
  }
  // 날짜가 바로 첫 열이면 이름은 통상 날짜 열의 왼쪽(0번 열)이다.
  if(nameCol<0) nameCol=Math.max(0,firstDayCol-1);
  if(bestScore<=0 && firstDayCol>0) nameCol=firstDayCol-1;

  const dataRows=rows.slice(headerIndex+1)
    .filter(r=>String(r?.[nameCol]??'').trim())
    .filter(r=>String(r?.[nameCol]??'').trim()!=='index');

  const all=dataRows.map(r=>({name:String(r[nameCol]??'').trim(),group:''})).filter(p=>p.name);
  const groups=[
    {name:'Charge',people:[]},
    {name:'중간년차',people:[]},
    {name:'저연차',people:[]}
  ];

  all.forEach((p,i)=>{
    p.group=i<8?'Charge':i<14?'중간년차':'저연차';
    groups[i<8?0:i<14?1:2].people.push(p.name);
  });

  const shifts={};
  for(const [day,c] of dayCols){
    shifts[String(day)]=dataRows.map(r=>String(r[c]??'').trim());
  }
  return {all,groups,shifts,maxDay:Math.max(...dayCols.map(x=>x[0])),schemaVersion:ROSTER_SCHEMA_VERSION};
}

function rosterKey(year,month){return `${year}-${String(month).padStart(2,'0')}`}

async function openDB(){
  return AppStorage.openDB();
}

async function saveRosterRecord(record){
  return AppStorage.saveRoster(record);
}

async function getRosterRecords(){
  try{ await AppStorage.openDB(); await AppStorage.restoreMirrorToIndexedDB(); }catch(e){}
  const raw=(await AppStorage.listRosters()).sort((a,b)=>a.year-b.year||a.month-b.month);
  const upgraded=[];
  for(const record of raw) upgraded.push(await migrateRosterRecord(record));
  return upgraded;
}

async function deleteRosterRecord(id){
  await AppStorage.deleteOverridesForRoster(id);
  await AppStorage.deleteRoster(id);
  const remaining = await AppStorage.getRoster(id);
  if(remaining){
    throw new Error('근무표 삭제가 완료되지 않았어. 다시 시도해줘.');
  }
  return true;
}

async function migrateRosterRecord(record){
  if(record?.schemaVersion===ROSTER_SCHEMA_VERSION) return record;
  if(record?.sourceBlob instanceof Blob){
    try{
      const data=await record.sourceBlob.arrayBuffer();
      const wb=XLSX.read(data,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const parsed=parseWorkbook(ws);
      const upgraded={...record,...parsed,schemaVersion:ROSTER_SCHEMA_VERSION};
      await saveRosterRecord(upgraded);
      return upgraded;
    }catch(err){
      console.warn('기존 근무표 재파싱 실패:',record.fileName,err);
    }
  }
  return record;
}

function getRosterIdForRoster(rosterRef){
  if(!rosterRef) return null;
  return rosterRef.id || rosterKey(rosterRef.year,rosterRef.month);
}

async function loadOverridesForRoster(rosterIdValue){
  manualAssignments={};
  if(!rosterIdValue) return;
  const records=(await AppStorage.listOverrides()).filter(x=>x.rosterId===rosterIdValue);
  records.forEach(x=>{ manualAssignments[x.contextKey]=x.name; });
}

async function persistManualOverrides(rosterIdValue, assignments){
  if(!rosterIdValue) return;
  await AppStorage.deleteOverridesForRoster(rosterIdValue);
  const entries=Object.entries(assignments);
  for(const [contextKey,name] of entries){
    const parts=contextKey.split('|');
    const dateKey=parts.slice(1,4).join('-');
    const duty=parts[4] || '';
    const role=parts[5] || '';
    const slot=parts[6] || '0';
    await AppStorage.saveOverride({
      id:AppStorage.makeOverrideId(rosterIdValue,dateKey,duty,role,slot),
      rosterId:rosterIdValue,
      contextKey,
      dateKey,duty,role,slot:Number(slot),name,
      updatedAt:new Date().toISOString()
    });
  }
}

function recordToRoster(record){
  return {
    id:record.id || rosterKey(record.year,record.month),
    year:record.year,month:record.month,all:record.all,
    groups:record.groups,shifts:record.shifts,maxDay:record.maxDay,schemaVersion:record.schemaVersion||1
  };
}

async function renderRosterLibrary(){
  const list=$('rosterList');
  const records=await getRosterRecords();
  list.innerHTML='';

  if(!records.length){
    list.innerHTML='<div class="empty-roster">저장된 근무표가 아직 없어.</div>';
    return;
  }

  records.forEach(record=>{
    const active=getActiveRosterId()===record.id;
    const item=document.createElement('div');
    item.className=`roster-item ${active?'active':''}`;
    item.innerHTML=`<div class="roster-main">
      <div class="roster-month">${record.year}년 ${record.month}월 ${active?'· 사용 중':''}</div>
      <div class="roster-file">${record.fileName}</div>
    </div>
    <div class="roster-actions">
      <button class="use">사용</button>
      <button class="delete">삭제</button>
    </div>`;

    item.querySelector('.use').onclick=async()=>{
      if(!maybeLeaveEdit('근무표를 변경')) return;
      await activateRoster(record, false);
      $('rosterPanel').classList.add('hidden');
      showToast(`${record.year}년 ${record.month}월 근무표를 사용 중이야.`);
    };
    item.querySelector('.delete').onclick=async()=>{
      if(!confirm(`${record.year}년 ${record.month}월 근무표를 삭제할까?`)) return;
      const wasActive=getActiveRosterId()===record.id;
      try{
        await deleteRosterRecord(record.id);
        rosterRecords=rosterRecords.filter(r=>r.id!==record.id);
        if(wasActive){
          setActiveRosterId(null);
          resetToSampleOrCurrent();
          showToast(`${record.year}년 ${record.month}월 근무표를 삭제했어. 샘플 데이터로 전환했어.`);
        }else{
          showToast(`${record.year}년 ${record.month}월 근무표를 삭제했어.`);
        }
        await renderRosterLibrary();
      }catch(err){
        alert(`근무표 삭제에 실패했어.\n${err.message||err}`);
        await renderRosterLibrary();
      }
    };
    list.appendChild(item);
  });
}

function resetToSampleOrCurrent(){
  roster=buildRosterFromSample();
  dataSource='sample';
  sourceFileName='샘플 데이터';
  const now=new Date();
  selectedDuty=getDutyFromClock(now);
  const dutyDate=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  if(selectedDuty==='N' && (now.getHours()*60+now.getMinutes())<450){
    dutyDate.setDate(dutyDate.getDate()-1);
  }
  selectedDate=dutyDate;
  calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
  render();
}

async function activateRoster(record, goToFirstDay=true){
  roster=recordToRoster(record);
  const idx=rosterRecords.findIndex(r=>r.id===record.id);
  if(idx>=0) rosterRecords[idx]=record; else rosterRecords.push(record);
  setActiveRosterId(record.id);
  await loadOverridesForRoster(record.id);
  draftAssignments={...manualAssignments};
  dataSource='file';
  sourceFileName=record.fileName;
  if(goToFirstDay){
    selectedDate=new Date(record.year,record.month-1,1);
    selectedDuty='D';
  }
  calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
  render();
}

async function loadWorkbook(file){
  const data=await file.arrayBuffer();
  const wb=XLSX.read(data,{type:'array'});
  const ws=wb.Sheets[wb.SheetNames[0]];
  const parsed=parseWorkbook(ws);
  const info=extractMonthYear(file.name);

  if(!info){
    const now=new Date();
    pendingRoster=parsed;
    pendingFileName=file.name;
    pendingFileBlob=new Blob([data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    $('importYear').value=now.getFullYear();
    $('importMonth').value=now.getMonth()+1;
    $('monthYearPanel').classList.remove('hidden');
    return;
  }

  await persistImportedRoster(parsed,info.year,info.month,file.name,data);
}

async function persistImportedRoster(parsed,year,month,fileName,arrayBuffer){
  const record={
    id:rosterKey(year,month),
    year,month,fileName,
    importedAt:new Date().toISOString(),
    all:parsed.all,groups:parsed.groups,shifts:parsed.shifts,maxDay:parsed.maxDay,schemaVersion:ROSTER_SCHEMA_VERSION,
    // Uploaded workbook is stored only in the browser's local IndexedDB; it is never bundled into the app distribution.
    sourceBlob:new Blob([arrayBuffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
  };
  const existing=rosterRecords.find(r=>r.year===year&&r.month===month);
  if(existing){
    const ok=confirm(`${year}년 ${month}월 근무표가 이미 있어. 기존 근무표를 새 파일로 교체할까?`);
    if(!ok) return false;
    // 같은 월의 근무표를 교체하면 이전 근무표 기준 수동 배치가 남지 않도록 정리한다.
    const replacedRosterId=record.id;
    Object.keys(manualAssignments).forEach(key=>{if(key.startsWith(`${replacedRosterId}|`)) delete manualAssignments[key]});
    draftAssignments={...manualAssignments};
    await AppStorage.deleteOverridesForRoster(replacedRosterId);
  }
  await saveRosterRecord(record);
  const idx=rosterRecords.findIndex(r=>r.year===year&&r.month===month);
  if(idx>=0) rosterRecords[idx]=record; else rosterRecords.push(record);

  // 저장과 사용을 분리한다. 다른 월을 저장해도 현재 사용 중인 근무표는 바뀌지 않는다.
  // 다만 현재 활성 근무표를 같은 월의 새 파일로 교체한 경우에는 활성 데이터만 갱신한다.
  if(getActiveRosterId()===record.id){
    roster=recordToRoster(record);
    dataSource='file';
    sourceFileName=record.fileName;
    await loadOverridesForRoster(record.id);
    draftAssignments={...manualAssignments};
    render();
  }
  await renderRosterLibrary();
  showToast(`${year}년 ${month}월 근무표를 저장했어. '사용'을 눌러 적용할 수 있어.`);
  return true;
}

async function finalizePendingImport(){
  const year=Number($('importYear').value);
  const month=Number($('importMonth').value);
  if(!year||month<1||month>12||!pendingRoster) return;

  const data=await pendingRoster;
  const saved=await persistImportedRoster(pendingRoster,year,month,pendingFileName,
    pendingFileBlob ? await pendingFileBlob.arrayBuffer() : new ArrayBuffer(0));
  if(saved===false) return;

  pendingRoster=null;
  pendingFileName='';
  pendingFileBlob=null;
  $('monthYearPanel').classList.add('hidden');
  $('rosterPanel').classList.add('hidden');
}

async function init(){
  const now=new Date();
  selectedDuty=getDutyFromClock(now);
  const dutyDate=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  if(selectedDuty==='N' && (now.getHours()*60+now.getMinutes())<450){
    dutyDate.setDate(dutyDate.getDate()-1);
  }
  selectedDate=dutyDate;
  calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);

  try{
    const records=await getRosterRecords();
    rosterRecords=records;
    let active=records.find(r=>r.id===getActiveRosterId())||null;
    if(active){
      roster=recordToRoster(active);
      dataSource='file';
      sourceFileName=active.fileName;
      await loadOverridesForRoster(active.id);
      draftAssignments={...manualAssignments};
    }
  }catch(err){
    console.warn('근무표 저장소를 사용할 수 없어 샘플 데이터를 사용해.',err);
  }
  render();
}

function refreshToNow(){
  const now=new Date();

  // Prefer a stored roster for the current month if one exists.
  getRosterRecords().then(records=>{
    rosterRecords=records;
    const active=records.find(r=>r.id===getActiveRosterId());

    if(active){
      roster=recordToRoster(active);
      dataSource='file';
      sourceFileName=active.fileName;
      loadOverridesForRoster(active.id).then(()=>{
        draftAssignments={...manualAssignments};
        render();
      }).catch(()=>render());
      return;
    }else{
      roster=buildRosterFromSample();
      dataSource='sample';
      sourceFileName='샘플 데이터';
    }

    selectedDuty=getDutyFromClock(now);
    const dutyDate=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    if(selectedDuty==='N' && (now.getHours()*60+now.getMinutes())<450){
      dutyDate.setDate(dutyDate.getDate()-1);
    }
    selectedDate=dutyDate;
    calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
    render();
  }).catch(()=>{
    selectedDuty=getDutyFromClock(now);
    const dutyDate=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    if(selectedDuty==='N' && (now.getHours()*60+now.getMinutes())<450){
      dutyDate.setDate(dutyDate.getDate()-1);
    }
    selectedDate=dutyDate;
    calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
    render();
  });
}

function getCurrentManualKeyBase(){
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth()+1;
  const day = selectedDate.getDate();
  const active=getActiveRosterRecord();
  const rosterIdValue=active?.id || (roster && roster.id) || rosterKey(year,month);
  return `${rosterIdValue}|${year}-${month}-${day}-${selectedDuty}`;
}

function showToast(message){
  const el=$('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),2200);
}

function hasManualForCurrent(){
  const base=getCurrentManualKeyBase();
  return Object.keys(manualAssignments).some(key=>key.startsWith(`${base}|`));
}

function maybeLeaveEdit(action){
  if(!editMode || !editDirty) return true;
  return confirm(`현재 수정 중인 변경사항이 있어.\n${action}해도 될까?`);
}

function setToday(){
  const now=new Date();
  selectedDate=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  selectedDuty=getDutyFromClock(now);
  if(selectedDuty==='N' && (now.getHours()*60+now.getMinutes())<450) selectedDate.setDate(selectedDate.getDate()-1);
  calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
}

/* UI bindings */

$('printBtn').onclick=()=>{
  if(!getRosterForDate(selectedDate) || !getOnDuty(selectedDate,selectedDuty).length){
    alert('현재 듀티에 근무자가 없어. 인쇄할 배치가 없어.');
    return;
  }
  window.print();
};

$('editBtn').onclick=()=>{
  if(editMode){
    if(!maybeLeaveEdit('수정을 종료')) return;
    draftAssignments={...manualAssignments};
    editMode=false;
    editDirty=false;
    $('editActions').classList.add('hidden');
    showToast('수정 모드를 종료했어.');
  }else{
    draftAssignments={...manualAssignments};
    editMode=true;
    editDirty=false;
    $('editActions').classList.remove('hidden');
  }
  render();
};

$('saveManualBtn').onclick=async()=>{
  const active=getActiveRosterRecord();
  manualAssignments={...draftAssignments};
  try{
    await persistManualOverrides(active?.id || (roster && roster.id) || null, manualAssignments);
    editMode=false;
    editDirty=false;
    $('editActions').classList.add('hidden');
    showToast('수정사항을 저장했어.');
    render();
  }catch(err){
    alert(`수정사항 저장에 실패했어.\n${err.message||err}`);
  }
};


$('refreshBtn').onclick=()=>{if(!maybeLeaveEdit('현재 날짜로 새로고침')) return; refreshToNow(); showToast('현재 날짜와 듀티로 새로고침했어.');};

$('rosterButton').onclick=async()=>{
  if(!maybeLeaveEdit('근무표 보관함으로 이동')) return;
  await renderRosterLibrary();
  $('rosterPanel').classList.remove('hidden');
};

$('closeRoster').onclick=()=>$('rosterPanel').classList.add('hidden');
$('importRosterBtn').onclick=()=>$('fileInput').click();

$('fileInput').onchange=e=>{
  const f=e.target.files[0];
  if(f) loadWorkbook(f).then(()=>showToast('근무표를 확인했어.')).catch(err=>{
    const msg=String(err?.message||err||'알 수 없는 오류');
    let detail='파일 형식이나 근무표 구조를 확인해줘.';
    if(/date|날짜/i.test(msg)) detail='날짜 열 또는 날짜 행을 찾지 못했어.';
    else if(/name|이름/i.test(msg)) detail='이름 열을 찾지 못했어.';
    else if(/sheet|worksheet/i.test(msg)) detail='읽을 수 있는 시트가 없어.';
    alert(`근무표를 읽지 못했어.\n${detail}\n\n원인: ${msg}`);
  });
  e.target.value='';
};

$('dateButton').onclick=()=>{
  $('calendar').classList.toggle('hidden');
  $('dateButton').setAttribute('aria-expanded',$('calendar').classList.contains('hidden')?'false':'true');
  calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
  renderCalendar();
};

document.addEventListener('click',e=>{
  if(!e.target.closest('.date-control') && !e.target.closest('.calendar')){
    $('calendar').classList.add('hidden');
    $('dateButton').setAttribute('aria-expanded','false');
  }
});

const OVERLAY_IDS=['helpPanel','settingsPanel','rosterPanel','monthYearPanel'];
OVERLAY_IDS.forEach(id=>{
  const overlay=$(id);
  if(!overlay) return;
  overlay.addEventListener('click',e=>{
    if(e.target===overlay) overlay.classList.add('hidden');
  });
});

document.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;

  // 날짜 팝업은 overlay가 아니므로 먼저 닫는다.
  const calendar=$('calendar');
  if(calendar && !calendar.classList.contains('hidden')){
    e.preventDefault();
    calendar.classList.add('hidden');
    $('dateButton').setAttribute('aria-expanded','false');
    return;
  }

  // 여러 overlay가 겹쳐 있을 경우 가장 위에 열린 것 하나만 닫는다.
  for(let i=OVERLAY_IDS.length-1;i>=0;i--){
    const el=$(OVERLAY_IDS[i]);
    if(el && !el.classList.contains('hidden')){
      e.preventDefault();
      el.classList.add('hidden');
      return;
    }
  }
});

document.querySelectorAll('.duty-buttons button').forEach(b=>{
  b.onclick=()=>{if(!maybeLeaveEdit('듀티를 변경')) return; selectedDuty=b.dataset.duty; render()};
});

$('nextDuty').onclick=()=>moveDuty(1);
$('prevDuty').onclick=()=>moveDuty(-1);
$('nextDayBtn').onclick=nextDay;

$('helpBtn').onclick=()=>{
  $('helpPanel').classList.remove('hidden');
};
$('closeHelp').onclick=()=>$('helpPanel').classList.add('hidden');
$('closeHelp2').onclick=()=>$('helpPanel').classList.add('hidden');

$('settingsBtn').onclick=()=>$('settingsPanel').classList.remove('hidden');
$('ruleStatusCard').onclick=()=>$('settingsPanel').classList.remove('hidden');
$('closeSettings').onclick=()=>$('settingsPanel').classList.add('hidden');

$('closeSettings2').onclick=()=>$('settingsPanel').classList.add('hidden');

$('closeMonthYear').onclick=()=>{
  $('monthYearPanel').classList.add('hidden');
  pendingRoster=null;
  pendingFileName='';
  pendingFileBlob=null;
};

$('applyMonthYear').onclick=()=>{
  finalizePendingImport().catch(err=>alert(`근무표 저장에 실패했어.\n${err.message}`));
};

renderCurrentClock();
setInterval(renderCurrentClock,1000);
init();



/* v0.6.17 storage readiness marker */
(async()=>{try{await AppStorage.openDB(); window.__micuStorageReady=true;}catch(e){window.__micuStorageReady=false;}})();
