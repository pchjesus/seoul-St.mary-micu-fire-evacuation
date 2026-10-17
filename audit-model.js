/* Translate committed model differences into human-readable audit events. */
function auditContext(source,operation,context=contextId()) {
  return {operation,rosterId:source?.id || '',target:source?.fileName || (source?.id?.startsWith('sample:')?'샘플 근무표':source?.id) || '',context};
}
function stateEvents(source,before,after,date=selectedDate,duty=selectedDuty) {
  return ChangeEvents.compare(source,before,after,date,duty);
}
