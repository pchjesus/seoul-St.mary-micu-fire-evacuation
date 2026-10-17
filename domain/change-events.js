/* Compare explicit before/after models without UI or storage dependencies. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./roster-model.js'));
 else root.ChangeEvents=factory(root.RosterModel);
})(globalThis,model=>{
 const {contextId,personId,getOnDuty,automaticGroups}=model;
function stateEvents(source,before,after,date,duty) {
  const events=[];
  const currentContext=contextId(date,duty);
  const catalog=state=>{
    const people=source.all.map((person,index)=>({...person,id:personId(source,index),kind:'nurse'}));
    Object.values(state.personnel.contexts).forEach(scope=>people.push(...scope.added));
    return new Map(people.map(person=>[person.id,{...person,...state.personnel.profiles[person.id]}]));
  };
  const oldPeople=catalog(before), newPeople=catalog(after);
  const role=person=>person.kind==='doctor'?'의사':person.kind==='staff'?'사원':`간호사 · ${person.group}`;
  const personEvent=(action,id,previous,next,context)=>events.push({action,personId:id,target:next?.name || previous?.name || id,before:previous?`${previous.name} (${role(previous)})`:'',after:next?`${next.name} (${role(next)})`:'',context});
  const contexts=new Set([...Object.keys(before.personnel.contexts),...Object.keys(after.personnel.contexts)]);
  for(const context of contexts){
    const oldScope=before.personnel.contexts[context] || {added:[],excluded:[]};
    const newScope=after.personnel.contexts[context] || {added:[],excluded:[]};
    const oldAdded=new Set(oldScope.added.map(p=>p.id)),newAdded=new Set(newScope.added.map(p=>p.id));
    for(const id of newAdded) if(!oldAdded.has(id)) personEvent('person_added',id,null,newPeople.get(id),context);
    for(const id of oldAdded) if(!newAdded.has(id)) personEvent('person_deleted',id,oldPeople.get(id),null,context);
    for(const id of newScope.excluded) if(!oldScope.excluded.includes(id)) personEvent('person_deleted',id,oldPeople.get(id),null,context);
    for(const id of oldScope.excluded) if(!newScope.excluded.includes(id)) personEvent('person_restored',id,null,newPeople.get(id),context);
  }
  for(const [id,next] of newPeople){
    const previous=oldPeople.get(id);
    if(!previous) continue;
    if(previous.name!==next.name) events.push({action:'name_changed',personId:id,target:next.name,before:previous.name,after:next.name,context:'이 근무표 전체'});
    if(role(previous)!==role(next)) events.push({action:'role_changed',personId:id,target:next.name,before:role(previous),after:role(next),context:'이 근무표 전체'});
  }
  // Compare overrides by stable person ID, not by their shifted array slot.
  const overrides=state=>new Map(Object.entries(state.assignments).map(([key,value])=>{
    const [,context,role,slot]=key.split('|');
    return [`${context}|${value?.personId || `${role}|${slot}`}`,{name:typeof value==='string'?value:value.name,personId:value?.personId,context,role}];
  }));
  const oldOverrides=overrides(before),newOverrides=overrides(after);
  for(const key of new Set([...oldOverrides.keys(),...newOverrides.keys()])){
    const previous=oldOverrides.get(key),next=newOverrides.get(key),value=next || previous;
    if(previous?.name===next?.name && previous?.role===next?.role) continue;
    events.push({action:next?'manual_override':'data_reset',personId:value.personId || '',target:newPeople.get(value.personId)?.name || oldPeople.get(value.personId)?.name || value.name,before:previous?`${previous.role}: ${previous.name}`:`${value.role}: ${oldPeople.get(value.personId)?.name || '자동배치'}`,after:next?`${next.role}: ${next.name}`:'수동 수정 해제',context:value.context,detail:next?'배치 표시 이름 / 위치 변경':'해당 인원의 수동 override 제거'});
  }
  const summarize=(state,manual)=>Object.entries(automaticGroups(getOnDuty(date,duty,source,state.personnel),source)).map(([role,staff])=>`${role}: ${staff.map((person,slot)=>{const override=state.assignments[`${source.id}|${currentContext}|${role}|${slot}`];return manual&&override!==undefined?(typeof override==='string'?override:override.name):person.name;}).join(', ') || '없음'}`).join('\n');
  const oldAuto=summarize(before,false),newAuto=summarize(after,false);
  if(oldAuto!==newAuto || events.some(event=>event.action==='data_reset' && event.context===currentContext)) events.push({action:'auto_assignment',target:'현재 듀티 자동배치',before:oldAuto,after:newAuto,context:currentContext});
  const oldFinal=summarize(before,true),newFinal=summarize(after,true);
  if(oldFinal!==newFinal) events.push({action:'assignment_changed',target:'현재 듀티 최종 배치',before:oldFinal,after:newFinal,context:currentContext});
  return events;
}
return {compare:stateEvents};
});
