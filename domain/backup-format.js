/* Portable backup format and integrity checks. No DOM, IndexedDB, or network. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./roster-model.js'),require('../data/sample-roster.js'));
  else root.BackupFormat=factory(root.RosterModel,root.SampleRoster);
})(globalThis,(model,sample)=>{
  const STORES=['rosters','overrides','personnel','meta','logs'];
  const MAX_BYTES=20*1024*1024;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const text=value=>typeof value==='string';
  function requireValue(ok,message){if(!ok)throw new Error(`백업 형식 오류: ${message}`);}
  function canonical(value){
    if(Array.isArray(value))return value.map(canonical);
    if(object(value))return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));
    return value;
  }
  // SHA-256 for file corruption detection, including HTTP intranet/mobile contexts
  // where crypto.subtle is unavailable. This is not authentication or encryption.
  function sha256(value){
    const input=new TextEncoder().encode(value),length=input.length;
    const bytes=new Uint8Array(Math.ceil((length+9)/64)*64);bytes.set(input);bytes[length]=0x80;
    const view=new DataView(bytes.buffer);view.setUint32(bytes.length-8,Math.floor(length/0x20000000));view.setUint32(bytes.length-4,(length*8)>>>0);
    const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
    const k=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    const rotate=(x,n)=>(x>>>n)|(x<<(32-n)),w=new Uint32Array(64);
    for(let offset=0;offset<bytes.length;offset+=64){
      for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);
      for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=w[i-16]+(rotate(x,7)^rotate(x,18)^(x>>>3))+w[i-7]+(rotate(y,17)^rotate(y,19)^(y>>>10));}
      let [a,b,c,d,e,f,g,hh]=h;
      for(let i=0;i<64;i++){const t1=(hh+(rotate(e,6)^rotate(e,11)^rotate(e,25))+((e&f)^(~e&g))+k[i]+w[i])>>>0,t2=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))>>>0;hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
      [a,b,c,d,e,f,g,hh].forEach((value,i)=>h[i]=(h[i]+value)>>>0);
    }
    return Array.from(h,value=>value.toString(16).padStart(8,'0')).join('');
  }
  const digest=value=>sha256(JSON.stringify(canonical(value)));
  function safeTree(value,depth=0){
    requireValue(depth<=30,'데이터 중첩이 너무 깊어.');
    if(!value||typeof value!=='object')return;
    for(const [key,child] of Object.entries(value)){
      requireValue(!['__proto__','constructor','prototype'].includes(key),'허용되지 않는 속성이 있어.');
      safeTree(child,depth+1);
    }
  }
  function validateRules(rules){
    requireValue(object(rules)&&text(rules.id)&&text(rules.label),'배치 규칙 정보가 없어.');
    requireValue(object(rules.dutyCodes)&&Object.keys(rules.dutyCodes).length>0&&Object.values(rules.dutyCodes).every(v=>['D','E','N'].includes(v)),'근무 코드 규칙이 잘못됐어.');
    requireValue(Array.isArray(rules.groupOrder)&&rules.groupOrder.length>0&&rules.groupOrder.every(v=>text(v)&&v)&&new Set(rules.groupOrder).size===rules.groupOrder.length,'선임 그룹 순서가 잘못됐어.');
    requireValue(object(rules.roles)&&['notification','fire','evacuation'].every(key=>text(rules.roles[key])&&rules.roles[key]&&!rules.roles[key].includes('|'))&&new Set(Object.values(rules.roles)).size===3,'반 이름 규칙이 잘못됐어.');
    requireValue([rules.notificationCount,rules.fireCount].every(v=>Number.isInteger(v)&&v>=0&&v<=2000),'반별 인원 규칙이 잘못됐어.');
    const t=rules.dutyStarts;
    requireValue(object(t)&&[t.D,t.E,t.N].every(v=>Number.isInteger(v)&&v>=0&&v<1440)&&t.D<t.E&&t.E<t.N,'듀티 시작 시각이 잘못됐어.');
    if(rules.dutyDisplay)requireValue(object(rules.dutyDisplay)&&['D','E','N'].every(key=>text(rules.dutyDisplay[key])),'듀티 표시 시각이 잘못됐어.');
  }
  function validateSnapshot(snapshot){
    requireValue(object(snapshot)&&Object.keys(snapshot).length===STORES.length&&STORES.every(name=>Array.isArray(snapshot[name])),'필수 저장 영역이 없거나 알 수 없는 영역이 있어.');
    safeTree(snapshot);
    for(const name of STORES){
      requireValue(snapshot[name].length<=100000,'보관 건수가 허용 범위를 넘었어.');
      const ids=new Set();
      for(const row of snapshot[name]){
        requireValue(object(row)&&text(row.id)&&row.id&&!ids.has(row.id),`${name}에 ID가 없거나 중복돼 있어.`);ids.add(row.id);
      }
    }
    const sources=new Map([[sample.build().id,sample.build()]]);
    for(const roster of snapshot.rosters){
      requireValue(Number.isInteger(roster.year)&&roster.year>=2000&&roster.year<=2100&&Number.isInteger(roster.month)&&roster.month>=1&&roster.month<=12&&roster.id===model.rosterKey(roster.year,roster.month),'근무표 연월과 ID가 일치하지 않아.');
      requireValue(Array.isArray(roster.all)&&roster.all.length>0&&roster.all.length<=2000&&roster.all.every(p=>object(p)&&text(p.name)&&p.name.trim()&&p.name.length<=120&&text(p.group)),'근무표 인원 정보가 잘못됐어.');
      requireValue(Array.isArray(roster.groups)&&roster.groups.length>0&&roster.groups.every(g=>object(g)&&text(g.name)),'근무표 그룹이 잘못됐어.');
      requireValue(object(roster.shifts)&&Object.keys(roster.shifts).length>0,'근무표 날짜 자료가 없어.');
      for(const [day,values] of Object.entries(roster.shifts))requireValue(/^([1-9]|[12]\d|3[01])$/.test(day)&&Array.isArray(values)&&values.length===roster.all.length&&values.every(text),'근무표 날짜 또는 인원별 근무 코드 길이가 잘못됐어.');
      if(roster.ruleSnapshot)validateRules(roster.ruleSnapshot);
      sources.set(roster.id,roster);
    }
    const contextValid=(context,source)=>{
      const match=/^(\d{4})-(\d{1,2})-(\d{1,2})-([DEN])$/.exec(context);
      if(!match)return false;
      const [year,month,day]=match.slice(1,4).map(Number);
      return year===source.year&&month===source.month&&day>=1&&day<=new Date(year,month,0).getDate()&&Array.isArray(source.shifts[String(day)]);
    };
    const peopleByRoster=new Map([...sources].map(([id,roster])=>[id,new Set(roster.all.map((_,i)=>model.personId(roster,i)))]));
    const validatePerson=person=>requireValue(object(person)&&text(person.name)&&person.name.trim()&&person.name.length<=120&&['nurse','doctor','staff'].includes(person.kind)&&text(person.group),'인원 프로필이 잘못됐어.');
    for(const people of snapshot.personnel){
      const source=sources.get(people.id);requireValue(source&&object(people.profiles)&&object(people.contexts),'인원 정보의 근무표 또는 범위가 없어.');
      const ids=peopleByRoster.get(people.id);
      for(const [context,scope] of Object.entries(people.contexts)){
        requireValue(contextValid(context,source)&&object(scope)&&Array.isArray(scope.added)&&Array.isArray(scope.excluded),'추가·제외 인원의 날짜 범위가 잘못됐어.');
        for(const person of scope.added){validatePerson(person);requireValue(text(person.id)&&person.id.startsWith('added:')&&!ids.has(person.id),'추가 인원 ID가 중복되거나 잘못됐어.');ids.add(person.id);}
        requireValue(new Set(scope.excluded).size===scope.excluded.length&&scope.excluded.every(id=>source.all.some((_,i)=>model.personId(source,i)===id)),'제외 인원의 원본 ID가 없어.');
      }
      // Deleted additions can leave an unused profile; retaining it preserves the snapshot.
      for(const [id,person] of Object.entries(people.profiles)){validatePerson(person);requireValue(ids.has(id)||id.startsWith('added:'),'프로필의 원본 인원 ID가 없어.');}
    }
    for(const row of snapshot.overrides){
      const source=sources.get(row.rosterId),parts=String(row.contextKey).split('|');
      requireValue(source&&row.id===row.contextKey&&parts.length===4&&parts[0]===row.rosterId&&contextValid(parts[1],source)&&Object.values(model.rulesFor(source).roles).includes(parts[2])&&/^\d+$/.test(parts[3]),'수동 배치의 근무표·날짜·반 범위가 잘못됐어.');
      const value=row.value??row.name;
      requireValue(text(value)||(object(value)&&text(value.name)&&peopleByRoster.get(source.id).has(value.personId)),'수동 배치의 인원 ID 또는 이름이 잘못됐어.');
    }
    const meta=new Map(snapshot.meta.map(row=>[row.id,row.value]));
    requireValue(!meta.get('activeRosterId')||snapshot.rosters.some(row=>row.id===meta.get('activeRosterId')),'활성 근무표가 백업에 없어.');
    for(const row of snapshot.meta){
      requireValue(['activeRosterId','migration:0.7.1','storageEpoch'].includes(row.id)||row.id.startsWith('revision:'),'지원하지 않는 관리 정보가 있어.');
      if(row.id.startsWith('revision:')||row.id==='storageEpoch')requireValue(Number.isSafeInteger(row.value)&&row.value>=0,'변경 번호가 잘못됐어.');
      if(row.id==='migration:0.7.1')requireValue(row.value===true,'이전 완료 표식이 잘못됐어.');
    }
    for(const row of snapshot.logs){
      requireValue(text(row.timestamp)&&!Number.isNaN(Date.parse(row.timestamp))&&text(row.dateKey)&&/^\d{4}-\d{2}-\d{2}$/.test(row.dateKey)&&text(row.action)&&text(row.appVersion)&&text(row.operationId)&&Number.isInteger(row.sequence)&&object(row.environment),'수정 이력의 필수 정보가 잘못됐어.');
      requireValue(['성공','실패'].includes(row.result)&&['device','os','browser'].every(key=>text(row.environment[key])),'이력 결과 또는 환경이 잘못됐어.');
      for(const field of ['target','before','after','context','detail'])requireValue(row[field]===undefined||text(row[field]),'이력의 표시 값이 잘못됐어.');
    }
    return snapshot;
  }
  function create(snapshot,appVersion){
    validateSnapshot(snapshot);
    const body={format:'micu-full-backup',formatVersion:1,appVersion,createdAt:new Date().toISOString(),data:clone(snapshot)};
    const result={...body,checksum:{algorithm:'SHA-256',value:digest(body)}};
    requireValue(new TextEncoder().encode(JSON.stringify(result)).length<=MAX_BYTES,'백업 파일이 20MB를 넘어. 이력을 분리 보관하는 기능이 필요해.');
    return result;
  }
  function decode(input){
    requireValue(typeof input==='string'&&new TextEncoder().encode(input).length<=MAX_BYTES,'파일이 비어 있거나 20MB를 넘었어.');
    let file;try{file=JSON.parse(input);}catch(_){throw new Error('백업 JSON을 읽을 수 없어. 파일이 손상됐는지 확인해줘.');}
    safeTree(file);
    requireValue(object(file)&&file.format==='micu-full-backup'&&file.formatVersion===1,'지원하는 MICU 전체 백업 파일이 아니야.');
    const {checksum,...body}=file;
    requireValue(object(checksum)&&checksum.algorithm==='SHA-256'&&checksum.value===digest(body),'파일 검증값이 일치하지 않아. 손상되거나 변경된 파일이야.');
    requireValue(text(file.appVersion)&&/^0\.7\.\d+$/.test(file.appVersion)&&text(file.createdAt)&&!Number.isNaN(Date.parse(file.createdAt)),'앱 버전 또는 백업 시간이 잘못됐어.');
    validateSnapshot(file.data);
    return file;
  }
  function summary(snapshot){return {rosters:snapshot.rosters.length,personnel:snapshot.personnel.length,overrides:snapshot.overrides.length,logs:snapshot.logs.length,activeId:snapshot.meta.find(row=>row.id==='activeRosterId')?.value||null};}
  return {STORES,MAX_BYTES,canonical,digest,sha256,validateRules,validateSnapshot,create,decode,summary};
});
