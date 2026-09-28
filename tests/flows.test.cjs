const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const XLSX=require('../vendor/xlsx.full.min.js');
const empty=id=>({id,profiles:{},contexts:{}});
function app(storage={}){
  const nodes={};
  const node=id=>nodes[id]||=( {value:'',textContent:'',hidden:false,classList:{contains:()=>true,add(){},remove(){},toggle(){}},focus(){}} );
  const ctx=vm.createContext({Date,console,XLSX,Blob,structuredClone,APP_VERSION:'0.7.1',document:{getElementById:node},AppStorage:{emptyPersonnel:empty,...storage}});
  vm.runInContext(fs.readFileSync('script.js','utf8').split('/* UI bindings */')[0],ctx);
  vm.runInContext('render=()=>{}; showToast=()=>{}; renderRosterLibrary=async()=>{};',ctx);
  return {run:code=>vm.runInContext(code,ctx),nodes,node};
}
function roster(count){return {id:'2026-09',year:2026,month:9,fileName:'fixture.xlsx',all:Array.from({length:count},(_,i)=>({name:`사람${i}`,group:'Charge'})),groups:[{name:'Charge'}],shifts:{'24':Array(count).fill('E')},maxDay:30};}
test('manual import rejects blank, fractional and out-of-range dates without saving',async()=>{
  let calls=0;const a=app({saveRoster:()=>calls++});a.run('pendingRoster={all:[]};');
  for(const [year,month] of [['','9'],['1999','9'],['2101','9'],['2026.5','9'],['2026',''],['2026','13'],['2026','0'],['2026','1.5']]){
    a.node('importYear').value=year;a.node('importMonth').value=month;
    await assert.rejects(a.run('finalizePendingImport()'),/정수/);
  }
  assert.equal(calls,0);
});
test('filename parser never interprets month 13 as 1 or a partial number as a date',()=>{
  const a=app();
  for(const name of ['2026-13.xlsx','2026-00.xlsx','202613.xlsx','12026-9.xlsx','2026-123.xlsx'])assert.equal(a.run(`extractMonthYear(${JSON.stringify(name)})`),null);
  for(const name of ['2026-09-test.xlsx','202609.xlsx','2026년 9월.xlsx','2026.9.xlsx'])assert.equal(a.run(`extractMonthYear(${JSON.stringify(name)}).month`),9);
});
test('empty workbook is rejected before it can replace an existing roster',()=>{
  const a=app();assert.throws(()=>a.run("parseWorkbook(XLSX.utils.aoa_to_sheet([['이름',1,2,3]]))"),/인원/);
});
test('refresh maps new source IDs against the fresh roster, preserving new staff overrides',async()=>{
  const current=roster(5),key='2026-09|2026-9-24-E|대피유도반|1';
  const a=app({listRosters:async()=>[current],getActiveId:async()=>'2026-09',readState:async()=>({assignments:{[key]:{personId:'source:2026-09:4',name:'다섯번째수정'}},personnel:empty('2026-09'),revision:7})});
  a.run(`rosterRecords=[${JSON.stringify(roster(4))}];`);await a.run('refreshToNow()');
  assert.equal(a.run('roster.all.length'),5);assert.equal(a.run(`manualAssignments[${JSON.stringify(key)}].name`),'다섯번째수정');
  assert.equal(a.run('stateRevision'),7);
});
test('failed refresh leaves previously loaded source, assignments and revision intact',async()=>{
  const a=app({listRosters:async()=>[roster(5)],getActiveId:async()=>'2026-09',readState:async()=>{throw Error('read failure')}});
  a.run(`rosterRecords=[${JSON.stringify(roster(4))}];manualAssignments={old:'retained'};stateRevision=3;`);
  await assert.rejects(a.run('refreshToNow()'),/read failure/);
  assert.equal(a.run('rosterRecords[0].all.length'),4);assert.equal(a.run('manualAssignments.old'),'retained');assert.equal(a.run('stateRevision'),3);
});
test('failed activation read does not persist or apply a different active roster',async()=>{
  let activeWrites=0;
  const a=app({getRoster:async()=>roster(5),readState:async()=>{throw Error('read failure')},setActiveId:async()=>activeWrites++});
  a.run("activeRosterId='previous';");
  await assert.rejects(a.run("activateRoster({id:'2026-09'})"),/read failure/);
  assert.equal(activeWrites,0);assert.equal(a.run('activeRosterId'),'previous');
});
test('unsubmitted personnel input warns on leaving only while its panel is open',()=>{
  const a=app();a.node('personName').value='입력중';a.node('personnelPanel').classList.contains=()=>false;
  assert.equal(a.run('hasUnsavedWork()'),true);
  a.node('personnelPanel').classList.contains=()=>true;assert.equal(a.run('hasUnsavedWork()'),false);
});

test('missing date columns remain distinct from known dates with no workers',()=>{
  const a=app();
  a.run("selectedDate=new Date(2026,9,31);roster={id:'2026-10',year:2026,month:10,all:[{name:'가상인원',group:'Charge'}],groups:[{name:'Charge'}],shifts:{'30':['OF']}};");
  assert.equal(a.run('hasRosterDay(selectedDate,roster)'),false);
  assert.equal(a.run('hasRosterDay(new Date(2026,9,30),roster)'),true);
  assert.equal(a.run("getOnDuty(new Date(2026,9,30),'D',roster).length"),0);
  a.run('renderStaff([],roster)');
  assert.match(a.node('staffList').innerHTML,/31일 날짜 열이 없어/);
  a.run('selectedDate=new Date(2026,9,30);renderStaff([],roster)');
  assert.match(a.node('staffList').innerHTML,/근무자가 없어/);
});
