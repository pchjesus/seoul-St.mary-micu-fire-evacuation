/* Pure calculations: no DOM, storage, or mutable application state. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./config.js'));
  else root.RosterModel = factory(root.MicuConfig);
})(globalThis, config => {
  const rulesFor = roster => roster?.ruleSnapshot || config.ruleProfiles[config.legacyRuleId];
  const emptyPersonnel = id => ({id,profiles:{},contexts:{}});
  const rosterKey = (year,month) => `${year}-${String(month).padStart(2,'0')}`;
  const contextId = (date,duty) => `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}-${duty}`;
  const personId = (roster,index) => `source:${roster.id}:${index}`;
  function normalizeDuty(value, rules=rulesFor()) {
    const code = String(value ?? '').trim().toUpperCase();
    return Object.hasOwn(rules.dutyCodes,code) ? rules.dutyCodes[code] : null;
  }
  function hasRosterDay(date,roster) {
    return Boolean(roster && date.getFullYear()===roster.year && date.getMonth()+1===roster.month && Array.isArray(roster.shifts?.[String(date.getDate())]));
  }
  function getOnDuty(date,duty,roster,people=emptyPersonnel(roster?.id)) {
    if (!roster || date.getFullYear()!==roster.year || date.getMonth()+1!==roster.month) return [];
    const shifts=roster.shifts[String(date.getDate())] || [];
    const state=people?.id===roster.id ? people : emptyPersonnel(roster.id);
    const scope=state.contexts[contextId(date,duty)] || {added:[],excluded:[]};
    const source=roster.all.map((person,index)=>({...person,id:personId(roster,index),kind:'nurse',order:index,duty:normalizeDuty(shifts[index],rulesFor(roster))})).filter(person=>person.duty===duty);
    return [...source,...scope.added.map((person,index)=>({...person,duty,order:roster.all.length+index}))]
      .filter(person=>!scope.excluded.includes(person.id)).map(person=>({...person,...state.profiles[person.id]}));
  }
  function automaticGroups(staff,roster) {
    const rules=rulesFor(roster);
    const rank=group => { const i=rules.groupOrder.indexOf(group); return i<0 ? rules.groupOrder.length : i; };
    const nurses=staff.filter(person=>person.kind==='nurse').sort((a,b)=>rank(a.group)-rank(b.group)||a.order-b.order);
    const first=rules.notificationCount, second=first+rules.fireCount;
    return {
      [rules.roles.notification]:nurses.slice(0,first),
      [rules.roles.fire]:nurses.slice(first,second),
      [rules.roles.evacuation]:[...nurses.slice(second),...staff.filter(person=>person.kind!=='nurse')]
    };
  }
  function rekeyAssignments(assignments,roster,people) {
    const result={};
    for (const [key,value] of Object.entries(assignments)) {
      const [id,context]=key.split('|');
      if (typeof value==='string') { result[key]=value; continue; }
      const match=/^(\d+)-(\d+)-(\d+)-([DEN])$/.exec(context);
      if (!match || id!==roster.id) continue;
      const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
      const groups=automaticGroups(getOnDuty(date,match[4],roster,people),roster);
      for (const [role,staff] of Object.entries(groups)) {
        const slot=staff.findIndex(person=>person.id===value.personId);
        if(slot>=0) result[`${id}|${context}|${role}|${slot}`]=value;
      }
    }
    return result;
  }
  function getDutyFromClock(date,rules=rulesFor()) {
    const minutes=date.getHours()*60+date.getMinutes();
    if(minutes>=rules.dutyStarts.D && minutes<rules.dutyStarts.E) return 'D';
    if(minutes>=rules.dutyStarts.E && minutes<rules.dutyStarts.N) return 'E';
    return 'N';
  }
  return {rulesFor,emptyPersonnel,rosterKey,contextId,personId,normalizeDuty,hasRosterDay,getOnDuty,automaticGroups,rekeyAssignments,getDutyFromClock};
});
