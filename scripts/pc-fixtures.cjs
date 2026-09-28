// Generate synthetic workbooks for the PC checklist; never use operational data.
// node scripts/pc-fixtures.cjs <output-directory>
const fs=require('node:fs'),path=require('node:path');
const X=require('../vendor/xlsx.full.min.js');
if(!process.argv[2]) throw Error('출력 폴더를 지정하세요.');
const output=path.resolve(process.argv[2]);fs.mkdirSync(output,{recursive:true});
function workbook(file,names,code='E'){
  const wb=X.utils.book_new();
  X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([
    ['이름',...Array.from({length:31},(_,i)=>i+1)],
    ...names.map(name=>[name,...Array(31).fill(code)])
  ]),'근무표');
  fs.writeFileSync(path.join(output,file),X.write(wb,{type:'buffer',bookType:file.endsWith('.xls')?'biff8':'xlsx'}));
}
for(const file of ['2026-09-test.xlsx','manual-month.xlsx','2026-06-test.xls'])workbook(file,['테스트가','테스트나','테스트다','테스트라']);
workbook('2026-09-replacement.xlsx',['교체가','교체나','교체다','교체라','교체마']);
workbook('2026-10-test.xlsx',['시월가','시월나','시월다','시월라'],'D');
workbook('2026-11-duplicates.xlsx',['동명이인','동명이인','<img src=x onerror=alert(1)>','기호 & 이름'],'D');
workbook('2026-12-empty.xlsx',[]);
fs.writeFileSync(path.join(output,'2026-08-invalid.xlsx'),'not a valid roster');
console.log(output);
