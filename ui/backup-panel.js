/* Full-data backup UI. Restore is explicit, reviewed, and guarded by a fresh snapshot. */
const BackupPanel = (() => {
  function create({storage,audit,format,appVersion,canStart,restore}) {
    const el=id=>document.getElementById(id),panel=el('backupPanel');
    let incoming=null,baseline=null,prepared=false,busy=false,generation=0,returnFocus=null;
    const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');
    function describe(snapshot){
      const count=format.summary(snapshot);
      return `근무표 ${count.rosters}개 · 인원 변경 묶음 ${count.personnel}개 · 수동 배치 ${count.overrides}건 · 이력 ${count.logs}건\n사용 중: ${count.activeId||'샘플 / 없음'}`;
    }
    function refreshControls(){
      el('backupExport').disabled=busy;
      el('backupInput').disabled=busy;
      el('backupPrepare').disabled=busy||!incoming;
      el('backupRestore').disabled=busy||!incoming||!prepared||!el('backupConfirmed').checked;
      el('backupConfirmed').disabled=busy||!prepared;
      el('closeBackup').disabled=busy;
    }
    function resetRestore(){baseline=null;prepared=false;el('backupConfirmed').checked=false;refreshControls();}
    async function ready(){
      canStart();
      if(audit.pendingCount){await audit.retry();if(audit.pendingCount)throw new Error('이력 저장 대기가 있어. 이력 저장 재시도를 완료한 뒤 전체 백업·복원을 진행해줘.');}
    }
    async function operation(task){
      if(busy)return;
      busy=true;el('backupError').textContent='';refreshControls();
      try{await ready();await task();}
      catch(error){el('backupError').textContent=error.message;}
      finally{busy=false;refreshControls();}
    }
    function download(snapshot,prefix){
      const backup=format.create(snapshot,appVersion);
      const serialized=JSON.stringify(backup,null,2);
      format.decode(serialized); // Round-trip verification before handing a file to the browser.
      const url=URL.createObjectURL(new Blob([serialized],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download=`MICU_${prefix}_${stamp()}.json`;
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }
    el('backupBtn').onclick=async()=>{
      try{canStart();}catch(error){alert(error.message);return;}
      returnFocus=document.activeElement;generation++;incoming=null;resetRestore();
      el('backupIncoming').textContent='복원할 전체 백업(.json)을 선택해줘.';
      el('backupError').textContent='';el('backupMessage').textContent='';el('backupInput').value='';
      panel.classList.remove('hidden');el('closeBackup').focus();
      await operation(async()=>{el('backupCurrent').textContent=describe(await storage.exportSnapshot());});
    };
    el('backupExport').onclick=()=>operation(async()=>{
      const snapshot=await storage.exportSnapshot();download(snapshot,'전체백업');
      el('backupCurrent').textContent=describe(snapshot);
      el('backupMessage').textContent='검증한 백업 파일의 다운로드를 요청했어. 브라우저 다운로드 목록에서 파일이 저장됐는지 확인해줘.';
    });
    el('backupInput').onchange=()=>{
      const file=el('backupInput').files[0],token=++generation;incoming=null;resetRestore();
      el('backupMessage').textContent='';
      el('backupIncoming').textContent='백업 파일을 확인하고 있어…';
      if(!file){el('backupIncoming').textContent='복원할 파일을 선택해줘.';return;}
      operation(async()=>{
        if(file.size>format.MAX_BYTES)throw new Error('백업 파일은 20MB 이하로 선택해줘.');
        let decoded;
        try { decoded=format.decode(await file.text()); }
        catch(error) { el('backupIncoming').textContent='파일 검증에 실패했어. 현재 데이터는 변경하지 않았어.'; throw error; }
        if(token!==generation)return;
        incoming=decoded;el('backupIncoming').textContent=`백업 시각: ${decoded.createdAt}\n앱 버전: v${decoded.appVersion}\n${describe(decoded.data)}`;
        el('backupMessage').textContent='파일 검증 완료. 복원 전 현재 데이터 백업을 내려받고 보관해줘.';
      });
    };
    el('backupPrepare').onclick=()=>operation(async()=>{
      baseline=await storage.exportSnapshot();download(baseline,'복원전백업');prepared=true;
      el('backupCurrent').textContent=describe(baseline);
      el('backupMessage').textContent='복원 전 백업의 다운로드를 요청했어. 파일 저장을 확인한 뒤 아래 확인란을 선택해줘.';
    });
    el('backupConfirmed').onchange=refreshControls;
    el('backupRestore').onclick=()=>operation(async()=>{
      if(!incoming||!prepared||!el('backupConfirmed').checked)throw new Error('복원 전 백업 파일을 보관하고 확인란을 선택해줘.');
      const result=await restore(incoming.data,baseline);
      if(!result){resetRestore();el('backupError').textContent=el('storageStatus').textContent;return;}
      incoming=null;resetRestore();
      el('backupCurrent').textContent=describe(await storage.exportSnapshot());
      el('backupIncoming').textContent='복원 완료. 현재 근무표와 수정 내용을 확인해줘.';
      el('backupMessage').textContent='전체 데이터의 복원과 재읽기 검증을 완료했어. 사용 중인 다른 탭은 새로고침해줘.';
    });
    function close(){if(busy)return;generation++;panel.classList.add('hidden');incoming=null;resetRestore();returnFocus?.focus();}
    el('closeBackup').onclick=close;panel.onclick=event=>{if(event.target===panel)close();};
    document.addEventListener('keydown',event=>{
      if(panel.classList.contains('hidden'))return;
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
      if(event.key==='Tab'){
        const items=[...panel.querySelectorAll('button,input')].filter(node=>!node.disabled&&node.getClientRects().length);
        if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}
        else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus();}
      }
    },true);
    return {get busy(){return busy;}};
  }
  return {create};
})();
