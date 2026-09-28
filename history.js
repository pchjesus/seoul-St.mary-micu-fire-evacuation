/* History is read on demand; opening/filtering/exporting never produces audit noise. */
(() => {
  let rows=[], visibleLimit=100, loadId=0, ready=false, returnFocus=null;
  const panel=$('historyPanel');
  const criteria=()=>({from:$('historyFrom').value,to:$('historyTo').value,action:$('historyAction').value,environment:$('historyEnvironment').value});
  const invalid=()=>criteria().from && criteria().to && criteria().from>criteria().to;
  const filtered=()=>Audit.filter(rows,criteria());
  function populateSelect(id,entries){
    const select=$(id),value=select.value;
    select.replaceChildren(new Option('전체',''));
    entries.forEach(([key,label])=>select.add(new Option(label,key)));
    if(entries.some(([key])=>key===value)) select.value=value;
  }
  function renderHistory(){
    const matches=invalid()?[]:filtered();
    $('historyExportFiltered').disabled=!ready || invalid() || !matches.length;
    $('historyExportAll').disabled=!ready || !rows.length;
    $('historyCount').textContent=invalid()?'시작일이 종료일보다 늦어. 날짜를 확인해줘.':`${matches.length}건 / 전체 ${rows.length}건`;
    const list=$('historyList');
    list.replaceChildren();
    if(!ready) return;
    if(!matches.length){
      const empty=document.createElement('p');empty.className='history-empty';
      empty.textContent=invalid()?'날짜 범위를 확인해줘.':rows.length?'조건에 맞는 이력이 없어.':'아직 기록된 이력이 없어. v0.7.2 이후 저장한 변경부터 기록돼.';
      list.appendChild(empty);
    }
    for(const [label,items] of Audit.group(matches.slice(0,visibleLimit),$('historyGroup').value)){
      const section=document.createElement('section');section.className='history-group';
      const heading=document.createElement('h3');heading.textContent=label;section.appendChild(heading);
      for(const row of items){
        const card=document.createElement('article');card.className='history-event';
        const e=escapeHtml;
        card.innerHTML=`<div class="history-event-head"><strong>${e(Audit.labels[row.action] || row.action)}</strong><span class="history-result ${row.result==='실패'?'failed':''}">${e(row.result)}${row.pending?' · 이력 저장 대기':''}</span></div>
          <div class="history-target">${e(row.target || '')}</div>
          <div class="history-meta">${e(Audit.timeLabel(row))}<br>${e(Audit.envLabel(row))} · v${e(row.appVersion)}${row.rosterId?`<br>${e(row.rosterId)} · ${e(row.context || '')}`:''}</div>
          ${row.before!==undefined || row.after!==undefined?`<dl class="history-changes"><div><dt>변경 전</dt><dd>${e(row.before || '—')}</dd></div><div><dt>변경 후</dt><dd>${e(row.after || '—')}</dd></div></dl>`:''}
          ${row.detail?`<p class="history-detail">${e(row.detail)}</p>`:''}`;
        section.appendChild(card);
      }
      list.appendChild(section);
    }
    $('historyMore').hidden=matches.length<=visibleLimit;
    $('historyMore').textContent=`더 보기 (${Math.min(visibleLimit,matches.length)} / ${matches.length}건)`;
  }
  async function load(){
    const id=++loadId;ready=false;
    $('historyMessage').textContent='이력을 읽고 있어…';renderHistory();
    try{
      const result=await Audit.list();
      if(id!==loadId) return;
      rows=result;ready=true;
      populateSelect('historyAction',Object.entries(Audit.labels).filter(([key])=>rows.some(row=>row.action===key)));
      populateSelect('historyEnvironment',[...new Set(rows.map(Audit.envLabel))].sort().map(value=>[value,value]));
      $('historyMessage').textContent=Audit.pendingCount?'저장 대기 이력은 현재 창에만 있어. 이력 저장 재시도를 누르거나 Excel로 보관해줘.':'이 브라우저의 기록이야. 근무표를 삭제·교체해도 이력은 남아. 사이트 데이터를 지우면 이력도 삭제돼.';
      renderHistory();
    }catch(error){
      if(id!==loadId) return;
      rows=[];
      $('historyMessage').textContent=`이력을 읽지 못했어. 다시 불러오기를 눌러줘. ${error.message}`;
      renderHistory();
    }
  }
  function close(){
    panel.classList.add('hidden');document.body.classList.remove('history-open');
    returnFocus?.focus();
  }
  $('historyBtn').onclick=()=>{
    returnFocus=document.activeElement;visibleLimit=100;
    panel.classList.remove('hidden');document.body.classList.add('history-open');
    $('closeHistory').focus();load();
  };
  $('closeHistory').onclick=close;
  panel.onclick=event=>{if(event.target===panel)close();};
  $('historyReload').onclick=load;
  ['historyFrom','historyTo','historyAction','historyEnvironment','historyGroup'].forEach(id=>$(id).onchange=()=>{visibleLimit=100;renderHistory();});
  $('historyResetFilters').onclick=()=>{
    ['historyFrom','historyTo','historyAction','historyEnvironment'].forEach(id=>$(id).value='');
    $('historyGroup').value='date';visibleLimit=100;renderHistory();
  };
  $('historyMore').onclick=()=>{visibleLimit+=100;renderHistory();};
  function download(all){
    if(!ready || (!all && invalid()))return;
    const selected=all?rows:filtered();
    if(!selected.length)return;
    try{
      XLSX.writeFile(Audit.exportWorkbook(selected),`MICU_수정이력_${Audit.dayKey(new Date())}_${all?'전체':'필터'}.xlsx`,{compression:true});
      $('historyMessage').textContent=`${selected.length}건의 Excel 다운로드를 요청했어. 브라우저의 다운로드 목록에서 확인해줘.`;
    }catch(error){$('historyMessage').textContent=`내려받기를 시작하지 못했어. 다시 시도해줘. ${error.message}`;}
  }
  $('historyExportFiltered').onclick=()=>download(false);
  $('historyExportAll').onclick=()=>download(true);
  async function retry(){
    $('retryAuditBtn').disabled=true;$('historyRetry').disabled=true;
    try{await Audit.retry();if(!panel.classList.contains('hidden'))await load();}
    finally{$('retryAuditBtn').disabled=false;$('historyRetry').disabled=false;}
  }
  $('retryAuditBtn').onclick=retry;
  $('historyRetry').onclick=retry;
  Audit.subscribe(state=>{
    $('auditWarning').hidden=!state.pending;$('historyRetry').hidden=!state.pending;
    $('auditStatus').textContent=state.pending?`수정 이력 ${state.pending}건이 아직 저장되지 않았어. 이 창을 닫거나 새로고침하면 대기 이력이 사라질 수 있어. ${state.error}`:'';
    if(!panel.classList.contains('hidden'))load();
  });
  document.addEventListener('keydown',event=>{
    if(panel.classList.contains('hidden'))return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
    if(event.key==='Tab'){
      const items=[...panel.querySelectorAll('button,input,select')].filter(el=>!el.disabled&&!el.hidden&&el.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
    }
  },true);
})();
