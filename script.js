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
const ROSTER_SCHEMA_VERSION=3;

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
let activeRosterId=null;
let personnel=null;
let stateRevision=0;
let savePending=false;
let storageReady=false;

const $ = id => document.getElementById(id);

function buildRosterFromSample(){
  const all=[];
  SAMPLE.groups.forEach(g=>g.people.forEach(name=>all.push({name,group:g.name})));
  const shifts={};
  for(let day=1;day<=30;day++){
    shifts[String(day)]=SAMPLE.rows.map(r=>r[day+1]||'');
  }
  return {id:'sample:'+rosterKey(SAMPLE.year,SAMPLE.month),year:SAMPLE.year,month:SAMPLE.month,all,shifts,groups:SAMPLE.groups,maxDay:30,schemaVersion:ROSTER_SCHEMA_VERSION};
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

function getActiveRosterId(){ return activeRosterId; }
async function setActiveRosterId(id){
  await AppStorage.setActiveId(id);
  activeRosterId=id;
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

function hasRosterDay(date,rosterRef=getRosterForDate(date)){
  return Boolean(rosterRef && date.getFullYear()===rosterRef.year && date.getMonth()+1===rosterRef.month && Array.isArray(rosterRef.shifts?.[String(date.getDate())]));
}

function personId(rosterRef,index){ return `source:${rosterRef.id}:${index}`; }
function contextId(date=selectedDate,duty=selectedDuty){ return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}-${duty}`; }
function getOnDuty(date,duty,rosterRef=getRosterForDate(date),people=personnel){
  if(!rosterRef || date.getFullYear()!==rosterRef.year || date.getMonth()+1!==rosterRef.month) return [];
  const arr=rosterRef.shifts[String(date.getDate())]||[];
  const state=people?.id===rosterRef.id ? people : AppStorage.emptyPersonnel(rosterRef.id);
  const scope=state.contexts[contextId(date,duty)] || {added:[],excluded:[]};
  const source=rosterRef.all.map((p,i)=>({...p,id:personId(rosterRef,i),kind:'nurse',order:i,duty:normalizeDuty(arr[i])})).filter(p=>p.duty===duty);
  return [...source,...scope.added.map((p,i)=>({...p,duty,order:rosterRef.all.length+i}))]
    .filter(p=>!scope.excluded.includes(p.id)).map(p=>({...p,...state.profiles[p.id]}));
}
function automaticGroups(staff,rosterRef){
  const nurses=staff.filter(p=>p.kind==='nurse').sort((a,b)=>groupIndex(a.group,rosterRef)-groupIndex(b.group,rosterRef)||a.order-b.order);
  return {'통보연락반':nurses.slice(0,1),'소화반':nurses.slice(1,3),'대피유도반':[...nurses.slice(3),...staff.filter(p=>p.kind!=='nurse')]};
}
function rekeyAssignments(assignments,source,people){
  const result={};
  for(const [key,value] of Object.entries(assignments)){
    const [id,context]=key.split('|');
    if(typeof value==='string'){ result[key]=value; continue; }
    const match=/^(\d+)-(\d+)-(\d+)-([DEN])$/.exec(context);
    if(!match || id!==source.id) continue;
    const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
    const groups=automaticGroups(getOnDuty(date,match[4],source,people),source);
    for(const [role,staff] of Object.entries(groups)){
      const slot=staff.findIndex(person=>person.id===value.personId);
      if(slot>=0) result[`${id}|${context}|${role}|${slot}`]=value;
    }
  }
  return result;
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
  const missingDay=Boolean(dateRoster && !hasRosterDay(selectedDate,dateRoster));
  const staff=missingDay?[]:getOnDuty(selectedDate,selectedDuty,dateRoster);
  $('staffCount').textContent=missingDay?'확인 불가':`${staff.length}명`;
  $('fileStatus').textContent=dateRoster ? (dateRoster===sampleRoster ? '샘플 데이터' : (rosterRecords.find(r=>r.year===dateRoster.year&&r.month===dateRoster.month)?.fileName || '저장된 근무표')) : '근무표 없음';
  $('sourceMeta').textContent=dateRoster ? (dateRoster===sampleRoster ? '현재 기본 데이터' : `${dateRoster.year}년 ${dateRoster.month}월 근무표`) : `${y}년 ${m}월 근무표 없음`;
  if(missingDay) $('sourceMeta').textContent+=` · ${d}일 자료 없음`;
  $('ruleStatus').textContent='MICU 기본 규칙';
  $('printMeta').textContent=`${y}년 ${m}월 ${d}일 · ${selectedDuty} · ${DUTY_INFO[selectedDuty].label}`;
  $('editModeBadge').textContent=editMode ? (editDirty?'수정 중 · 변경됨':'수정 모드') : '기본 규칙';
  $('editHint').textContent=editMode ? (editDirty?'변경사항이 있어. 저장 후 확인이 끝나면 적용돼.':'수정 모드: 각 역할의 이름을 클릭해서 직접 바꿀 수 있어.') : '';
  renderStaff(staff,dateRoster);
  renderAssignments(staff,dateRoster);
  renderCalendar();
  $('managePeopleBtn').disabled=!dateRoster || missingDay || !storageReady || savePending;
  $('editBtn').disabled=!dateRoster || missingDay || !storageReady || savePending;
}

function renderStaff(staff,dateRoster){
  const el=$('staffList');
  el.innerHTML='';
  if(!dateRoster){
    el.innerHTML='<div class="notice">해당 날짜의 근무표가 없습니다.</div>';
    return;
  }
  if(!hasRosterDay(selectedDate,dateRoster)){
    el.innerHTML=`<div class="notice">근무표에 ${selectedDate.getDate()}일 날짜 열이 없어 근무 인원을 확인할 수 없어. 해당 날짜가 포함된 근무표를 다시 불러와줘.</div>`;
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
      <div><div class="staff-name">${escapeHtml(p.name)}</div><div class="group-label">${escapeHtml(p.kind==='doctor'?'의사':p.kind==='staff'?'사원':p.group)}</div></div>
    </div><span class="duty-tag">${p.duty}</span>`;
    el.appendChild(row);
  });
}

function renderAssignments(staff,dateRoster){
  $('assignmentList').innerHTML='';
  const keyBase=`${dateRoster?.id || 'none'}|${contextId()}`;
  const activeAssignments=editMode?draftAssignments:manualAssignments;
  const missingDay=Boolean(dateRoster && !hasRosterDay(selectedDate,dateRoster));
  const groups=dateRoster&&!missingDay?automaticGroups(staff,dateRoster):{'통보연락반':[],'소화반':[],'대피유도반':[]};
  const reasons={'통보연락반':'간호사 중 최선임','소화반':'간호사 중 차선임 · 3번째 선임','대피유도반':'4번째 이하 간호사 · 사원 · 의사'};
  const classes={'통보연락반':'notification','소화반':'fire','대피유도반':'evacuation wide'};
  for(const [role,people] of Object.entries(groups)){
    const names=people.map((person,index)=>{
      const atSlot=activeAssignments[`${keyBase}|${role}|${index}`];
      // Identity survives automatic slot changes after adding/removing personnel.
      const own=Object.entries(activeAssignments).find(([key,value])=>key.startsWith(keyBase+'|') && value?.personId===person.id)?.[1];
      return own?.name ?? (typeof atSlot==='string'?atSlot:person.name);
    });
    const emptyLabel=missingDay?'근무 자료 없음':dateRoster?'배치 인원 없음':'근무표 없음';
    const reason=missingDay?'해당 날짜의 원본 근무 자료를 확인해줘.':dateRoster?reasons[role]:'해당 날짜의 근무표가 없습니다.';
    addAssignment(role,names.length?names:[emptyLabel],reason,classes[role],keyBase,role,0,people);
  }
}

function addAssignment(role,names,reason,cls,keyBase,slotRole,slot,people=[]){
  const el=document.createElement('div');
  el.className=`assignment ${cls}${editMode?' edit-mode':''}`;
  const values=Array.isArray(names) ? names.map(v=>String(v??'—')) : [String(names??'—')];
  const rolePrefix=`${keyBase}|${slotRole}|`;
  const activeAssignments=editMode?draftAssignments:manualAssignments;
  const belongsToRole=(key,value)=>key.startsWith(keyBase+'|') && (typeof value==='string'?key.startsWith(rolePrefix):people.some(p=>p.id===value?.personId));
  const roleModified=Object.entries(activeAssignments).some(([key,value])=>belongsToRole(key,value));
  const editable=editMode && values[0]!=='인원 부족' && values[0]!=='배치 인원 없음' && values.length>0;

  const personHtml=values.map((value,index)=>{
    const actualSlot=slot+index;
    const canEdit=editMode && Boolean(people[index]);
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
        const person=people[Number(node.dataset.slot)];
        Object.keys(draftAssignments).forEach(old=>{if(old.startsWith(keyBase+'|') && draftAssignments[old]?.personId===person.id) delete draftAssignments[old]});
        draftAssignments[key]={personId:person.id,name:value||'—'};
        editDirty=true;
        $('editModeBadge').textContent='수정 중 · 변경됨';
        $('editHint').textContent='변경사항이 있어. 저장 후 확인이 끝나면 적용돼.';
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
        if(belongsToRole(key,draftAssignments[key])) delete draftAssignments[key];
      });
      editDirty=JSON.stringify(draftAssignments)!==JSON.stringify(manualAssignments);
      showToast(`${slotRole} 초기화를 준비했어. 저장하면 반영돼.`);
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
    if(!maybeLeaveEdit('오늘 날짜로 이동')) return;
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
  let m=s.match(/(?:^|\D)(20\d{2})\D{1,4}(1[0-2]|0?[1-9])(?!\d)/);
  if(m) return {year:Number(m[1]),month:Number(m[2])};
  m=s.match(/(?:^|\D)(20\d{2})(0[1-9]|1[0-2])(?!\d)/);
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
  if(!all.length) throw new Error('근무표에서 인원을 찾지 못했어. 이름 열과 날짜 행을 확인해줘.');
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
  return (await AppStorage.listRosters()).sort((a,b)=>a.year-b.year||a.month-b.month);
}
async function deleteRosterRecord(id){
  const record=rosterRecords.find(row=>row.id===id);
  return Audit.perform(auditContext(record,'근무표 삭제','근무표 전체'),[
    {action:'roster_deleted',before:record?.fileName || id,after:'삭제',detail:'근무표와 관련 수정사항·추가 인원 삭제. 수정 이력은 유지.'}
  ],()=>AppStorage.deleteRoster(id));
}

function getRosterIdForRoster(rosterRef){
  if(!rosterRef) return null;
  return rosterRef.id || rosterKey(rosterRef.year,rosterRef.month);
}

async function readOverridesForRoster(id,source){
  const state=await AppStorage.readState(id);
  if(source){
    for(const [key,value] of Object.entries(state.assignments)){
      if(typeof value!=='string') continue;
      const [,context,role,slot]=key.split('|');
      const match=/^(\d+)-(\d+)-(\d+)-([DEN])$/.exec(context);
      if(!match) continue;
      const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
      const people=getOnDuty(date,match[4],source,state.personnel);
      const person=automaticGroups(people,source)[role]?.[Number(slot)];
      if(person) state.assignments[key]={personId:person.id,name:value};
    }
  }
  state.assignments=source?rekeyAssignments(state.assignments,source,state.personnel):state.assignments;
  return state;
}
function applyOverridesState(state){
  manualAssignments=state.assignments;
  personnel=state.personnel;
  stateRevision=state.revision;
}
async function loadOverridesForRoster(id){
  const source=id===sampleRoster.id?sampleRoster:rosterRecords.find(row=>row.id===id);
  applyOverridesState(await readOverridesForRoster(id,source));
}
async function persistManualOverrides(id,assignments,people=personnel){
  const source=id===sampleRoster.id?sampleRoster:rosterRecords.find(row=>row.id===id);
  const before={assignments:manualAssignments,personnel:personnel||AppStorage.emptyPersonnel(id)};
  const after={assignments,personnel:people||AppStorage.emptyPersonnel(id)};
  return Audit.perform(auditContext(source,'배치·인원 저장'),stateEvents(source,before,after),
    ()=>AppStorage.saveState(id,assignments,after.personnel,stateRevision));
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
      <div class="roster-file">${escapeHtml(record.fileName)}</div>
    </div>
    <div class="roster-actions">
      <button class="use">사용</button>
      <button class="delete">삭제</button>
    </div>`;

    item.querySelector('.use').onclick=async()=>{
      if(!maybeLeaveEdit('근무표를 변경')) return;
      if(!await runSavedAction(async()=>{ await activateRoster(record, false); },auditContext(record,'근무표 사용','근무표 전체'))) return;
      $('rosterPanel').classList.add('hidden');
      showToast(`${record.year}년 ${record.month}월 근무표를 사용 중이야.`);
    };
    item.querySelector('.delete').onclick=async()=>{
      if(!maybeLeaveEdit('근무표를 삭제')) return;
      if(!confirm(`${record.year}년 ${record.month}월 근무표와 관련 수정사항·추가 인원을 삭제할까?`)) return;
      await runSavedAction(async()=>{
        const wasActive=getActiveRosterId()===record.id;
        await deleteRosterRecord(record.id);
        rosterRecords=rosterRecords.filter(r=>r.id!==record.id);
        if(wasActive){
          activeRosterId=null;
          await loadOverridesForRoster(sampleRoster.id);
          draftAssignments={...manualAssignments};
          resetToSampleOrCurrent();
        }
        await renderRosterLibrary();
        showToast('근무표를 삭제했어.');
      });
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
  const fresh=await AppStorage.getRoster(record.id);
  if(!fresh) throw new Error('이 근무표가 다른 탭에서 삭제됐어. 보관함을 다시 열어줘.');
  const state=await readOverridesForRoster(fresh.id,fresh);
  const date=goToFirstDay?new Date(fresh.year,fresh.month-1,1):selectedDate;
  const duty=goToFirstDay?'D':selectedDuty;
  const events=[{action:'roster_selected',before:activeRosterId || '샘플 근무표',after:fresh.id}];
  if(hasRosterDay(date,fresh)) events.push({action:'auto_assignment',target:'근무표 적용',after:Object.entries(automaticGroups(getOnDuty(date,duty,fresh,state.personnel),fresh)).map(([role,staff])=>`${role}: ${staff.map(p=>p.name).join(', ') || '없음'}`).join('\n'),detail:'자동 계산 결과. 저장된 수동 override가 있으면 최종 화면에 우선 적용.'});
  await Audit.perform(auditContext(fresh,'근무표 사용',contextId(date,duty)),events,()=>setActiveRosterId(fresh.id));
  const idx=rosterRecords.findIndex(r=>r.id===record.id);
  if(idx>=0) rosterRecords[idx]=fresh; else rosterRecords.push(fresh);
  applyOverridesState(state);
  roster=recordToRoster(fresh);
  draftAssignments={...manualAssignments};
  dataSource='file';
  sourceFileName=fresh.fileName;
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
    return false;
  }

  return persistImportedRoster(parsed,info.year,info.month,file.name,data);
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
  const existing=await AppStorage.getRoster(record.id);
  if(existing && !confirm(`${year}년 ${month}월 근무표를 교체할까? 이 근무표의 수동 수정사항과 추가·제외 인원도 초기화돼.`)) return false;
  const events=[{action:existing?'roster_replaced':'roster_registered',before:existing?.fileName || '',after:fileName,detail:`${year}년 ${month}월 · ${parsed.all.length}명 · 날짜 열 ${Object.keys(parsed.shifts).length}개`}];
  if(existing) events.push({action:'data_reset',target:'근무표 관련 수정사항',before:'이전 배치 수정·추가/제외 인원·프로필',after:'초기화',detail:'같은 월 근무표 교체에 따른 초기화. 수정 이력은 유지.'});
  await Audit.perform(auditContext(record,'근무표 저장','근무표 전체'),events,()=>AppStorage.saveRoster(record,Boolean(existing)));
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
  if(!Number.isInteger(year)||year<2000||year>2100||!Number.isInteger(month)||month<1||month>12){
    throw new Error('연도는 2000~2100, 월은 1~12 사이의 정수로 입력해줘.');
  }
  if(!pendingRoster) throw new Error('먼저 근무표 파일을 선택해줘.');
  const saved=await persistImportedRoster(pendingRoster,year,month,pendingFileName,
    pendingFileBlob ? await pendingFileBlob.arrayBuffer() : new ArrayBuffer(0));
  if(saved===false) return false;

  pendingRoster=null;
  pendingFileName='';
  pendingFileBlob=null;
  $('monthYearPanel').classList.add('hidden');
  $('rosterPanel').classList.add('hidden');
  return true;
}

async function init(){
  storageReady=false;
  updateStorageStatus('저장소를 확인하고 있어.');
  setToday();
  try{
    await AppStorage.initialize();
    rosterRecords=await getRosterRecords();
    activeRosterId=await AppStorage.getActiveId();
    const active=getActiveRosterRecord();
    roster=active?recordToRoster(active):sampleRoster;
    dataSource=active?'file':'sample';
    sourceFileName=active?.fileName||'샘플 데이터';
    await loadOverridesForRoster(roster.id);
    draftAssignments={...manualAssignments};
    storageReady=true;
    updateStorageStatus('이 브라우저에 저장 · v'+APP_VERSION);
  }catch(error){
    console.error('저장소 복원 실패:',error);
    updateStorageStatus(`저장 데이터를 불러오지 못했어. ${error.message}`,true);
  }
  window.__micuStorageReady=storageReady;
  render();
}

async function refreshToNow(){
  const records=await getRosterRecords();
  const id=await AppStorage.getActiveId();
  const active=records.find(row=>row.id===id);
  const state=await readOverridesForRoster(active?.id||sampleRoster.id,active||sampleRoster);
  rosterRecords=records;
  applyOverridesState(state);
  activeRosterId=active?.id||null;
  roster=active?recordToRoster(active):sampleRoster;
  dataSource=active?'file':'sample';
  sourceFileName=active?.fileName||'샘플 데이터';
  draftAssignments={...manualAssignments};
  updateStorageStatus('이 브라우저에 저장 · v'+APP_VERSION);
  setToday();
  render();
}

function updateStorageStatus(message,error=false){
  $('storageStatus').textContent=message;
  $('storageStatus').classList.toggle('error',error);
  $('retryStorageBtn').hidden=storageReady || !error;
}
async function runSavedAction(action,failureContext={operation:'변경 저장'}){
  if(savePending) return false;
  if(!storageReady){ updateStorageStatus('저장소를 사용할 수 없어. 저장소 다시 연결을 눌러줘.',true); await Audit.recordFailure(failureContext,new Error('운영 저장소 연결 안 됨')); return false; }
  const completedBefore=Audit.completedCount;
  savePending=true;
  updateStorageStatus('저장 중… 완료 확인 후 다시 읽어 검증하고 있어.');
  const controls=[...document.querySelectorAll('button,input,select')].map(node=>[node,node.disabled]);
  controls.forEach(([node])=>node.disabled=true);
  document.querySelectorAll('[contenteditable="true"]').forEach(node=>node.contentEditable='false');
  document.body.setAttribute('aria-busy','true');
  try{
    const result=await action();
    if(result===false){ updateStorageStatus('저장을 완료하지 않았어. 입력을 확인한 뒤 다시 저장해줘.'); return false; }
    updateStorageStatus(`✓ 저장 확인 완료 · ${new Date().toLocaleTimeString('ko-KR')} · v${APP_VERSION}`);
    return true;
  }catch(error){
    console.error('저장 작업 오류:',error);
    if(Audit.completedCount>completedBefore){
      updateStorageStatus(`데이터 저장은 확인했지만 화면 갱신에 실패했어. 새로고침해줘. ${error.message}`,true);
      showToast('데이터 저장 완료 · 화면을 새로고침해줘.');
      return false;
    }
    await Audit.recordFailure(failureContext,error);
    updateStorageStatus(`⚠ 저장하지 못했어. 다시 시도해줘. ${error.message}`,true);
    if(!$('personnelPanel').classList.contains('hidden')) $('personnelHint').textContent=`⚠ 저장하지 못했어. 입력 내용은 유지돼. ${error.message}`;
    showToast('⚠ 수정사항을 저장하지 못했어. 다시 시도해줘.');
    return false;
  }finally{
    savePending=false;
    document.body.removeAttribute('aria-busy');
    controls.forEach(([node,disabled])=>node.disabled=disabled);
    render();
  }
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
  if(savePending) return false;
  if(editMode && editDirty && !confirm(`현재 수정 중인 변경사항이 있어.\n저장하지 않고 ${action}할까?`)) return false;
  const wasEditing=editMode;
  editMode=false;
  editDirty=false;
  draftAssignments={...manualAssignments};
  $('editActions').classList.add('hidden');
  if(wasEditing) render();
  return true;
}

function setToday(){
  const now=new Date();
  selectedDate=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  selectedDuty=getDutyFromClock(now);
  if(selectedDuty==='N' && (now.getHours()*60+now.getMinutes())<450) selectedDate.setDate(selectedDate.getDate()-1);
  calendarCursor=new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1);
}

function hasUnsavedWork(){
  const enteringPerson=!$('personnelPanel').classList.contains('hidden') && Boolean($('personName').value.trim());
  return (typeof Audit!=='undefined' && Audit.pendingCount>0) || editDirty || savePending || (typeof personnelDirty!=='undefined' && personnelDirty) || enteringPerson;
}
function cancelPendingImport(){
  $('monthYearPanel').classList.add('hidden');
  pendingRoster=null;
  pendingFileName='';
  pendingFileBlob=null;
}

/* UI bindings */

$('printBtn').onclick=()=>{
  const current=getRosterForDate(selectedDate);
  if(current && !hasRosterDay(selectedDate,current)){
    alert('근무표에 해당 날짜의 자료가 없어. 날짜 열이 포함된 근무표를 확인해줘.');
    return;
  }
  if(!getRosterForDate(selectedDate) || !getOnDuty(selectedDate,selectedDuty).length){
    alert('현재 듀티에 근무자가 없어. 인쇄할 배치가 없어.');
    return;
  }
  window.print();
};

$('editBtn').onclick=()=>{
  if(!storageReady || !hasRosterDay(selectedDate)) return;
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
  const current=getRosterForDate(selectedDate);
  if(!current || !hasRosterDay(selectedDate,current)) return;
  const snapshot=structuredClone(draftAssignments);
  await runSavedAction(async()=>{
    const state=await persistManualOverrides(current.id,snapshot);
    manualAssignments=state.assignments;
    personnel=state.personnel;
    stateRevision=state.revision;
    editMode=false;
    editDirty=false;
    $('editActions').classList.add('hidden');
    render();
    showToast('✓ 수정사항을 저장했어.');
  });
};
$('retryStorageBtn').onclick=()=>init();
window.addEventListener('beforeunload',event=>{
  if(hasUnsavedWork()) { event.preventDefault(); event.returnValue=''; }
});
$('refreshBtn').onclick=async()=>{
  if(!maybeLeaveEdit('현재 날짜로 새로고침')) return;
  try{ await refreshToNow(); showToast('현재 날짜와 듀티로 새로고침했어.'); }
  catch(error){ updateStorageStatus(`저장 데이터를 불러오지 못했어. ${error.message}`,true); }
};
$('rosterButton').onclick=async()=>{
  if(!maybeLeaveEdit('근무표 보관함으로 이동')) return;
  try { await renderRosterLibrary(); $('rosterPanel').classList.remove('hidden'); }
  catch(error) { updateStorageStatus(`근무표를 불러오지 못했어. ${error.message}`,true); }
};

$('closeRoster').onclick=()=>$('rosterPanel').classList.add('hidden');
$('importRosterBtn').onclick=()=>$('fileInput').click();

$('fileInput').onchange=async e=>{
  const file=e.target.files[0];
  e.target.value='';
  if(file) await runSavedAction(()=>loadWorkbook(file),{operation:'근무표 파일 읽기·저장',target:file.name});
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
    if(e.target===overlay && !savePending){
      if(id==='monthYearPanel') cancelPendingImport();
      else overlay.classList.add('hidden');
    }
  });
});

document.addEventListener('keydown',e=>{
  if(e.key!=='Escape' || savePending) return;

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
      if(OVERLAY_IDS[i]==='monthYearPanel') cancelPendingImport();
      else el.classList.add('hidden');
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

$('closeMonthYear').onclick=cancelPendingImport;

$('applyMonthYear').onclick=()=>{
  runSavedAction(()=>finalizePendingImport(),{operation:'근무표 월 확인·저장',target:pendingFileName});
};

renderCurrentClock();
setInterval(renderCurrentClock,1000);
init();
