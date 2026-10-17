/* Fictional training fixture; never an operational roster. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../domain/roster-model.js'));
  else root.SampleRoster=factory(root.RosterModel);
})(globalThis,model=>{
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

function buildRosterFromSample(){
  const all=[];
  SAMPLE.groups.forEach(g=>g.people.forEach(name=>all.push({name,group:g.name})));
  const shifts={};
  for(let day=1;day<=30;day++){
    shifts[String(day)]=SAMPLE.rows.map(r=>r[day+1]||'');
  }
  return {id:'sample:'+model.rosterKey(SAMPLE.year,SAMPLE.month),year:SAMPLE.year,month:SAMPLE.month,all,shifts,groups:SAMPLE.groups,maxDay:30,schemaVersion:3};
}

return {build:buildRosterFromSample};
});
