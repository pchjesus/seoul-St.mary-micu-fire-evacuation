/* Excel/file and DOM adapter. The parser and placement model stay independent. */
const ImportReview = (() => {
  function create({save,isBusy=()=>false}) {
    const el=id=>document.getElementById(id);
    const panel=el('monthYearPanel');
    const profile=MicuConfig.parserProfiles[MicuConfig.activeParserId];
    let workbook=null, fileName='', parsed=null, returnFocus=null, generation=0;
    const columnName=index=>XLSX.utils.encode_col(index);
    function close() {
      if(isBusy())return;
      generation++;workbook=null;parsed=null;fileName='';
      panel.classList.add('hidden');returnFocus?.focus();
    }
    function groupBands() {
      return profile.groupBands.map((band,index)=>{
        if(band.count===null)return {...band};
        const raw=el('importGroups').querySelector(`[data-band="${index}"]`).value.trim();
        const count=Number(raw);
        if(!raw||!Number.isInteger(count)||count<0)throw new Error('선임 그룹 인원은 0 이상의 정수로 입력해줘.');
        return {...band,count};
      });
    }
    function read() {
      const sheet=workbook.Sheets[el('importSheet').value];
      const range=sheet['!ref']?XLSX.utils.decode_range(sheet['!ref']):{s:{r:0,c:0},e:{r:0,c:0}};
      if(range.e.r>=profile.maxRows||range.e.c>=profile.maxColumns)throw new Error('근무표 크기가 허용 범위를 넘었어. 필요한 시트만 선택해줘.');
      const header=el('importHeader').value.trim(), name=el('importNameColumn').value.trim();
      if(header && (!/^\d+$/.test(header)||Number(header)<1))throw new Error('날짜 행은 1 이상의 행 번호로 입력해줘.');
      if(name && !/^[A-Za-z]+$/.test(name))throw new Error('이름 열은 A, B처럼 열 문자로 입력해줘.');
      const selectedProfile={...profile,groupBands:groupBands()};
      const value=RosterParser.parseRows(XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',range:0}),{
        profile:selectedProfile,headerRow:header?Number(header)-1:null,nameColumn:name?XLSX.utils.decode_col(name.toUpperCase()):null
      });
      const year=Number(el('importYear').value),month=Number(el('importMonth').value);
      const monthCheck=RosterParser.validateMonth(value,year,month);
      return {...value,year,month,parserSnapshot:selectedProfile,sheetName:el('importSheet').value,
        inspection:{...value.inspection,warnings:[...value.inspection.warnings,...monthCheck.warnings]}};
    }
    function update() {
      el('importAcknowledged').checked=false;
      el('applyMonthYear').disabled=true;parsed=null;
      el('importPreview').replaceChildren();el('importWarnings').replaceChildren();
      try {
        if(!workbook)return;
        parsed=read();
        el('importSummary').textContent=`${fileName} · ${parsed.sheetName} · ${parsed.year}년 ${parsed.month}월 · ${parsed.all.length}명 · 날짜 열 ${Object.keys(parsed.shifts).length}개`;
        el('importMapping').textContent=`읽은 날짜 행: ${parsed.inspection.headerRow+1}행 / 이름 열: ${columnName(parsed.inspection.nameColumn)}열. 그룹과 이름·근무 코드를 아래에서 확인해줘.`;
        for(const warning of parsed.inspection.warnings){const li=document.createElement('li');li.textContent=warning.message;el('importWarnings').appendChild(li);}
        const table=document.createElement('table'),head=table.createTHead().insertRow();
        const days=Object.keys(parsed.shifts).map(Number).sort((a,b)=>a-b);
        ['원본 행','이름','선임 그룹',...days.map(day=>`${day}일`)].forEach(label=>{const th=document.createElement('th');th.textContent=label;head.appendChild(th);});
        const body=table.createTBody();
        parsed.all.forEach((person,index)=>{
          const row=body.insertRow();
          [parsed.inspection.sourceRows[index],person.name,person.group,...days.map(day=>parsed.shifts[day][index]||'(빈칸)')].forEach(value=>{row.insertCell().textContent=value;});
        });
        el('importPreview').appendChild(table);
        el('importDay').replaceChildren(...days.map(day=>new Option(`${day}일`,String(day))));
        showPlacement();el('importError').textContent='';
      } catch(error) {
        parsed=null;
        el('importError').textContent=error.message;
        el('importPlacement').textContent='해석 오류를 해결하면 배치 예상 결과를 확인할 수 있어.';
      }
    }
    function showPlacement() {
      if(!parsed)return;
      const day=Number(el('importDay').value),duty=el('importDuty').value;
      const source={...parsed,id:RosterModel.rosterKey(parsed.year,parsed.month)};
      const staff=RosterModel.getOnDuty(new Date(parsed.year,parsed.month-1,day),duty,source);
      const groups=RosterModel.automaticGroups(staff,source);
      el('importPlacement').textContent=Object.entries(groups).map(([role,people])=>`${role}: ${people.map(person=>person.name).join(', ')||'배치 인원 없음'}`).join('\n');
    }
    async function openFile(file) {
      if(file.size>profile.maxFileBytes)throw new Error('근무표 파일은 20MB 이하로 선택해줘.');
      const token=++generation;
      const data=await file.arrayBuffer();
      const next=XLSX.read(data,{type:'array'});
      if(token!==generation)return;
      if(!next.SheetNames.length)throw new Error('근무표 시트가 없어.');
      workbook=next;fileName=file.name;returnFocus=document.activeElement;
      const info=RosterParser.extractMonthYear(file.name),now=new Date();
      el('importYear').value=info?.year||now.getFullYear();el('importMonth').value=info?.month||now.getMonth()+1;
      el('importSheet').replaceChildren(...next.SheetNames.map(name=>new Option(name,name)));
      el('importHeader').value='';el('importNameColumn').value='';
      el('importGroups').replaceChildren();
      profile.groupBands.forEach((band,index)=>{
        if(band.count===null)return;
        const label=document.createElement('label');label.textContent=`${band.name} 인원 (위에서부터)`;
        const input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.value=band.count;input.dataset.band=String(index);input.oninput=update;
        label.appendChild(input);el('importGroups').appendChild(label);
      });
      panel.classList.remove('hidden');update();el('closeMonthYear').focus();
    }
    async function commit() {
      if(!workbook||!parsed)throw new Error('근무표 해석 오류를 먼저 확인해줘.');
      if(!el('importAcknowledged').checked)throw new Error('연월·인원·근무 코드·선임 그룹을 확인한 뒤 체크해줘.');
      const candidate=read(); // Validate the latest controls, not an old preview.
      const result=await save(candidate,candidate.year,candidate.month,fileName);
      if(result!==false){generation++;workbook=null;parsed=null;fileName='';panel.classList.add('hidden');el('rosterPanel').classList.add('hidden');returnFocus?.focus();}
      return result;
    }
    ['importYear','importMonth','importHeader','importNameColumn'].forEach(id=>el(id).oninput=update);
    el('importSheet').onchange=()=>{el('importHeader').value='';el('importNameColumn').value='';update();};
    el('importAcknowledged').onchange=()=>{el('applyMonthYear').disabled=!parsed||!el('importAcknowledged').checked;};
    el('importDay').onchange=showPlacement;el('importDuty').onchange=showPlacement;
    panel.addEventListener('keydown',event=>{
      if(event.key!=='Tab')return;
      const items=[...panel.querySelectorAll('button,input,select')].filter(node=>!node.disabled&&node.getClientRects().length);
      if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}
      else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus();}
    });
    return {openFile,commit,close,get fileName(){return fileName;},get isOpen(){return Boolean(workbook);}};
  }
  return {create};
})();
