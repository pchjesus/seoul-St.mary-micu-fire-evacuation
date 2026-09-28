const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const XLSX = require('../vendor/xlsx.full.min.js');
function model(source=fs.readFileSync('script.js','utf8'),baseline=false){
  const ctx=vm.createContext({console,Date,XLSX,localStorage:{getItem:()=>null},document:{getElementById:()=>null},AppStorage:{emptyPersonnel:id=>({id,profiles:{},contexts:{}})}});
  vm.runInContext(source.split('/* UI bindings */')[0]+`\nglobalThis.model={sampleRoster,normalizeDuty,getOnDuty,getDutyFromClock,parseWorkbook,${baseline?'':'automaticGroups,personId,rekeyAssignments,'}};`,ctx);
  return ctx.model;
}
const m=model();
const json=v=>JSON.parse(JSON.stringify(v));
test('all 90 sample day/duty results match v0.7.0 FINAL source',()=>{
  const original=model(fs.readFileSync('tests/fixtures/v0.7.0-script.js','utf8'),true);
  for(let day=1;day<=30;day++)for(const duty of ['D','E','N']){
    const date=new Date(2026,8,day);
    const names=list=>json(list.map(({name,group,duty})=>({name,group,duty})));
    assert.deepEqual(names(m.getOnDuty(date,duty,m.sampleRoster)),names(original.getOnDuty(date,duty,original.sampleRoster)));
  }
});
test('only D E N NC are work codes; clock boundaries remain intact',()=>{
  for(const code of ['NV','OF','C','PE','V','','NNC','EFE'])assert.equal(m.normalizeDuty(code),null);
  assert.equal(m.normalizeDuty('NC'),'N');
  for(const [h,min,want] of [[7,29,'N'],[7,30,'D'],[14,59,'D'],[15,0,'E'],[21,59,'E'],[22,0,'N']])assert.equal(m.getDutyFromClock(new Date(2026,8,24,h,min)),want);
});
test('parser ignores pre-day duty codes and preserves duplicate names as separate rows',()=>{
  const ws=XLSX.utils.aoa_to_sheet([
    ['이름','이전1','이전2','이전3',1,2],
    ['홍길동','D','E','N','OF','NC'],
    ['홍길동','E','D','N','D','PE']
  ]);
  const result=m.parseWorkbook(ws);
  assert.deepEqual(json(result.shifts),{'1':['OF','D'],'2':['NC','PE']});
  const r={id:'test',year:2026,month:9,...result};
  assert.notEqual(m.personId(r,0),m.personId(r,1));
  assert.equal(m.getOnDuty(new Date(2026,8,1),'D',r).length,1);
});
test('added and excluded people are context-scoped and source is never mutated',()=>{
  const r=m.sampleRoster, before=JSON.stringify(r), date=new Date(2026,8,24);
  const original=m.getOnDuty(date,'E',r);
  const state={id:r.id,profiles:{},contexts:{'2026-9-24-E':{added:[{id:'added:1',name:'추가의사',kind:'doctor',group:'저연차'}],excluded:[original[0].id]}}};
  const actual=m.getOnDuty(date,'E',r,state);
  assert(!actual.some(p=>p.id===original[0].id));
  assert(actual.some(p=>p.id==='added:1'));
  assert(!m.getOnDuty(date,'D',r,state).some(p=>p.id==='added:1'));
  assert(!m.getOnDuty(new Date(2026,8,25),'E',r,state).some(p=>p.id==='added:1'));
  assert.equal(JSON.stringify(r),before);
});
test('rename retains ID; doctors/staff always join evacuation while nurses retain order',()=>{
  const r=m.sampleRoster,date=new Date(2026,8,24);
  const first=m.getOnDuty(date,'E',r)[0];
  const state={id:r.id,profiles:{[first.id]:{name:'바뀐이름',kind:'nurse',group:first.group}},contexts:{'2026-9-24-E':{added:[{id:'added:1',name:first.name,kind:'doctor',group:'Charge'},{id:'added:2',name:'사원',kind:'staff',group:'Charge'}],excluded:[]}}};
  const staff=m.getOnDuty(date,'E',r,state), groups=m.automaticGroups(staff,r);
  assert.equal(staff.find(p=>p.id===first.id).name,'바뀐이름');
  assert.equal(groups['통보연락반'][0].id,first.id);
  assert.equal(groups['소화반'].length,2);
  assert(groups['대피유도반'].some(p=>p.id==='added:1'));
  assert(groups['대피유도반'].some(p=>p.id==='added:2'));
});
test('empty evacuation panel remains represented with fewer than four nurses',()=>{
  const staff=m.getOnDuty(new Date(2026,8,24),'E',m.sampleRoster).slice(0,2);
  assert.deepEqual(json(m.automaticGroups(staff,m.sampleRoster)['대피유도반']),[]);
});

test('personnel rank changes move existing name overrides without losing identities or colliding',()=>{
  const r=m.sampleRoster,date=new Date(2026,8,24), staff=m.getOnDuty(date,'E',r);
  const first=staff[0],second=staff[1];
  const prefix=`${r.id}|2026-9-24-E`;
  const assignments={
    [`${prefix}|통보연락반|0`]:{personId:first.id,name:'첫번째 별칭'},
    [`${prefix}|소화반|0`]:{personId:second.id,name:'두번째 별칭'}
  };
  const state={id:r.id,profiles:{[first.id]:{name:first.name,kind:'doctor',group:first.group}},contexts:{}};
  const updated=m.rekeyAssignments(assignments,r,state);
  assert.equal(updated[`${prefix}|통보연락반|0`].personId,second.id);
  assert.equal(updated[`${prefix}|대피유도반|0`].personId,first.id);
  assert.equal(updated[`${prefix}|대피유도반|0`].name,'첫번째 별칭');
});
