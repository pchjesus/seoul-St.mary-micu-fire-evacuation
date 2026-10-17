/* Personnel changes are separate from the imported source workbook. */
let personnelDraft = null;
let personnelAssignmentsDraft = {};
let personnelDirty = false;
let editingPersonId = null;

function personnelScope(state=personnelDraft) {
  return state.contexts[contextId()] ||= {added:[],excluded:[]};
}
function markPersonnelDirty() {
  personnelDirty = true;
  $('personnelHint').textContent = '변경사항이 있어. 아래 저장 버튼을 누르면 반영돼.';
}
function personKindLabel(person) {
  return person.kind === 'doctor' ? '의사' : person.kind === 'staff' ? '사원' : `간호사 · ${person.group}`;
}
function resetPersonForm() {
  editingPersonId = null;
  $('personForm').reset();
  const groups=[...RosterModel.rulesFor(getRosterForDate(selectedDate)).groupOrder].reverse();
  $('personGroup').replaceChildren(...groups.map(group=>new Option(group,group)));
  $('personGroup').disabled = false;
  $('applyPersonBtn').textContent = '+ 인원 추가';
  $('cancelPersonEdit').hidden = true;
}
function renderPersonnel() {
  const current = getRosterForDate(selectedDate);
  const staff = getOnDuty(selectedDate,selectedDuty,current,personnelDraft);
  const list = $('personnelList');
  list.replaceChildren();
  if (!staff.length) list.textContent = '현재 사용할 수 있는 인원이 없어. 아래에서 추가할 수 있어.';
  staff.forEach(person => {
    const row = document.createElement('div');
    row.className = 'personnel-row';
    row.innerHTML = `<div><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml(personKindLabel(person))} · ${person.id.startsWith('source:')?'근무표 인원':'추가 인원'}</small></div><div class="personnel-row-actions"><button type="button" class="edit-person">수정</button><button type="button" class="delete-person">삭제</button></div>`;
    row.querySelector('.edit-person').onclick = () => {
      editingPersonId = person.id;
      $('personName').value = person.name;
      $('personKind').value = person.kind;
      const group=person.group || $('personGroup').options[0]?.value;
      if(group && ![...$('personGroup').options].some(option=>option.value===group)) $('personGroup').add(new Option(group,group));
      $('personGroup').value = group;
      $('personGroup').disabled = person.kind !== 'nurse';
      $('applyPersonBtn').textContent = '수정 적용';
      $('cancelPersonEdit').hidden = false;
      $('personName').focus();
    };
    row.querySelector('.delete-person').onclick = () => {
      if (!confirm(`${person.name}은(는) 현재 배치되어 있습니다. 삭제하면 해당 배정도 해제됩니다.\n선택한 날짜·듀티에서만 제외하며 원본 근무표는 유지합니다.`)) return;
      const scope = personnelScope();
      if (person.id.startsWith('source:')) scope.excluded.push(person.id);
      else scope.added = scope.added.filter(p => p.id !== person.id);
      const prefix = `${current.id}|${contextId()}|`;
      Object.keys(personnelAssignmentsDraft).forEach(key => {
        if (key.startsWith(prefix) && personnelAssignmentsDraft[key]?.personId === person.id) delete personnelAssignmentsDraft[key];
      });
      if (editingPersonId === person.id) resetPersonForm();
      markPersonnelDirty();
      renderPersonnel();
    };
    list.appendChild(row);
  });
  $('restorePeopleBtn').hidden = !personnelScope().excluded.length;
}
function closePersonnel() {
  if (savePending) return;
  if ((personnelDirty || $('personName').value.trim()) && !confirm('인원 관리의 저장하지 않은 입력을 버리고 닫을까?')) return;
  personnelDirty = false;
  $('personnelPanel').classList.add('hidden');
  $('managePeopleBtn').focus();
}
$('managePeopleBtn').onclick = () => {
  if (!storageReady || !hasRosterDay(selectedDate) || !maybeLeaveEdit('인원 관리로 이동')) return;
  personnelDraft = structuredClone(personnel);
  personnelAssignmentsDraft = structuredClone(manualAssignments);
  personnelDirty = false;
  resetPersonForm();
  $('personnelContext').textContent = `${selectedDate.getFullYear()}년 ${selectedDate.getMonth()+1}월 ${selectedDate.getDate()}일 · ${selectedDuty}`;
  $('personnelHint').textContent = '추가·삭제는 이 날짜와 듀티에만 적용돼. 이름·직종·선임 그룹 수정은 이 근무표 전체에 적용돼.';
  renderPersonnel();
  render();
  $('personnelPanel').classList.remove('hidden');
  $('personName').focus();
};
$('personKind').onchange = () => { $('personGroup').disabled = $('personKind').value !== 'nurse'; };
$('cancelPersonEdit').onclick = resetPersonForm;
$('personForm').onsubmit = event => {
  event.preventDefault();
  if (savePending) return;
  const name = $('personName').value.trim().replace(/\s+/g,' ');
  if (!name || name.length > 40) { $('personName').focus(); return; }
  const kind = $('personKind').value;
  const group = $('personGroup').value;
  const profile = {name,kind,group};
  if (editingPersonId) {
    personnelDraft.profiles[editingPersonId] = profile;
    Object.values(personnelAssignmentsDraft).forEach(value => {
      if (value?.personId === editingPersonId) value.name = name;
    });
  } else {
    const uuid = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16)).join('-');
    personnelScope().added.push({id:`added:${uuid}`, ...profile});
  }
  markPersonnelDirty();
  resetPersonForm();
  renderPersonnel();
};
$('restorePeopleBtn').onclick = () => {
  personnelScope().excluded = [];
  markPersonnelDirty();
  renderPersonnel();
};
$('savePeopleBtn').onclick = async () => {
  if ($('personName').value.trim()) {
    $('personnelHint').textContent = '입력 중인 인원을 먼저 추가하거나 수정 적용해줘.';
    $('personName').focus();
    return;
  }
  const source = getRosterForDate(selectedDate);
  const id = source.id;
  const people = structuredClone(personnelDraft);
  const assignments = rekeyAssignments(structuredClone(personnelAssignmentsDraft),source,people);
  await runSavedAction(async () => {
    const state = await persistManualOverrides(id,assignments,people);
    manualAssignments = state.assignments;
    draftAssignments = structuredClone(manualAssignments);
    personnel = state.personnel;
    stateRevision = state.revision;
    personnelDirty = false;
    $('personnelPanel').classList.add('hidden');
    render();
    showToast('✓ 인원 변경사항을 저장했어.');
  });
};
$('closePersonnel').onclick = closePersonnel;
$('personnelPanel').onclick = event => { if (event.target === $('personnelPanel')) closePersonnel(); };
document.addEventListener('keydown',event => {
  if (!$('personnelPanel').classList.contains('hidden')) {
    if (event.key === 'Escape') { event.stopImmediatePropagation(); closePersonnel(); }
    if (event.key === 'Tab') {
      const focusable = [...$('personnelPanel').querySelectorAll('button,input,select')].filter(el=>!el.disabled&&!el.hidden);
      const first=focusable[0], last=focusable.at(-1);
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  }
},true);
