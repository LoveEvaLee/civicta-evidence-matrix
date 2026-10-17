'use strict';
// 실행: node tests/test.js
// 1차 협업 중에는 상대 담당 파일이 아직 없을 수 있다. 필요한 모듈이 없으면 그 검사는 SKIP으로 표시한다.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
global.window=global;
const loaded=[];
for(const src of ['rules.js','demo-data.js','real-data.js','js/import.js','js/normalize.js','js/matrix.js','js/export.js']){
  const p=path.resolve(__dirname,'../docs',src);
  if(fs.existsSync(p)){require(p);loaded.push(src);}
}
const A=global.CIVICTA||{};
const read=f=>fs.readFileSync(path.resolve(__dirname,'../data',f),'utf8');
let pass=0,skip=0;
function check(name,needs,fn){
  const lack=needs.filter(fn=>typeof A[fn]!=='function');
  if(lack.length){skip++;console.log('SKIP',name,'— 아직 없는 함수:',lack.join(', '));return;}
  try{fn();pass++;console.log('PASS',name);}catch(e){console.error('FAIL',name);throw e;}
}
const P=['parseCSV'],N=['validateAndNormalize'],M=['analyze'],E=['toCSV','toMarkdown'];

check('가상 예시 12건은 모두 시연용 가상자료',[],()=>{assert.equal(CIVICTA_DEMO.length,12);assert(CIVICTA_DEMO.every(r=>r.verification==='시연용 가상자료'));});
check('가상 예시: 분류 12 = 칸 합 12, 미관찰 10/20',[...N,...M],()=>{
  const m=A.analyze(A.validateAndNormalize(CIVICTA_DEMO).records);
  assert.equal(m.count,12);assert.equal(m.counted,12);assert.equal(m.cells.flat(2).length,12);assert.equal(m.gaps,10);assert.equal(m.demo,true);
});
check('실존 16편: 분류 16, 미관찰 12/20, 칸 3개 손 검산',[...P,...N,...M],()=>{
  const p=A.parseCSV(CIVICTA_REAL_CSV);assert.equal(p.warnings.length,0);
  const n=A.validateAndNormalize(p.records);assert.equal(n.warnings.length,0);
  const m=A.analyze(n.records),R=CIVICTA_RULES;
  const cell=(h,s)=>m.cells[R.hciDimensions.indexOf(h)][R.policyStages.indexOf(s)].map(r=>r.id);
  assert.equal(m.count,16);assert.equal(m.counted,16);assert.equal(m.gaps,12);assert.equal(m.demo,false);
  assert.deepEqual(cell('숙의·상호작용','숙의·공론화'),['REF-01','REF-03','REF-08','REF-11','REF-12']);
  assert.deepEqual(cell('신뢰·책임성','정책설계·결정'),['REF-05','REF-09','REF-10']);
  assert.deepEqual(cell('피드백·반영추적','집행·평가'),['REF-02']);
});
check('실존 16편: DOI가 모두 10.으로 시작하고 검토 수준은 초록 검토',[...P],()=>{
  const rows=A.parseCSV(read('real-literature.csv')).records;
  assert.equal(rows.length,16);assert(rows.every(r=>/^10\.\d{4,9}\//.test(r.doi)&&r.verification==='초록 검토'));
});
const plain=s=>s.replace(/^﻿/,'').replace(/\r\n/g,'\n');
check('real-data.js가 data/real-literature.csv와 같음',[],()=>{assert.equal(plain(CIVICTA_REAL_CSV),plain(read('real-literature.csv')));});
check('담당 파일 없이 쓰는 미리 읽어 둔 실존 16편이 CSV와 같음',[],()=>{
  assert.equal(CIVICTA_REAL.length,16);
  const ids=plain(CIVICTA_REAL_CSV).split('\n').slice(1).filter(Boolean).map(l=>l.split(',')[0]);
  assert.deepEqual(CIVICTA_REAL.map(r=>r.id),ids);
});
check('B 범위: 미리 읽어 둔 실존 16편으로 칸 손 검산·필터',[...M,'filterRecords'],()=>{
  const m=A.analyze(CIVICTA_REAL),R=CIVICTA_RULES;
  const cell=(h,s)=>m.cells[R.hciDimensions.indexOf(h)][R.policyStages.indexOf(s)].map(r=>r.id);
  assert.equal(m.counted,16);assert.equal(m.gaps,12);
  assert.deepEqual(cell('숙의·상호작용','숙의·공론화'),['REF-01','REF-03','REF-08','REF-11','REF-12']);
  assert.deepEqual(m.countsByHci.map(o=>o.value),[3,2,7,1,3]);
  assert.equal(A.filterRecords(CIVICTA_REAL,{policy_stage:'숙의·공론화'}).length,8);
});
check('B 범위: 보고서 숫자 = 집계 숫자',[...M,...E],()=>{
  const md=A.toMarkdown(CIVICTA_REAL,A.analyze(CIVICTA_REAL));
  assert(md.includes('집계 대상: 16건'));assert(md.includes('표본에서 미관찰된 조합: 12개'));
  assert(md.includes('| 숙의·상호작용 | 2 | 5 | 0 | 0 |'));assert(!md.includes('실증 분석 결과가 아닙니다'));
});
check('다른 입력: 제외 2줄·미분류 2·중복 DOI·형식·연도 경고',[...P,...N,...M],()=>{
  const p=A.parseCSV(read('other-input.csv'));
  assert.equal(p.records.length,6);
  assert(p.warnings.some(w=>w.startsWith('5줄')&&w.includes('제목')));
  assert(p.warnings.some(w=>w.startsWith('10줄')&&w.includes('열 수')));
  const n=A.validateAndNormalize(p.records),m=A.analyze(n.records);
  assert.equal(m.counted,4);assert.equal(m.unclassified,2);
  assert(n.warnings.some(w=>w.includes('T-05')&&w.includes('중복 DOI')));
  assert(n.warnings.some(w=>w.includes('T-04')&&w.includes('DOI 형식')));
  assert(n.warnings.some(w=>w.includes('T-07')&&w.includes('발행연도')));
  assert(n.warnings.some(w=>w.includes('T-02')&&w.includes('정책단계')));
});
check('따옴표 안 쉼표·줄바꿈·이중 따옴표',[...P],()=>{
  const p=A.parseCSV('id,title,year,policy_stage,hci_dimension\n"A","제목, 공론화 ""검토""\n둘째 줄",2024,의제설정,정보이해·설명');
  assert.equal(p.records.length,1);assert.equal(p.records[0].title,'제목, 공론화 "검토"\n둘째 줄');
});
check('BOM과 CRLF',[...P],()=>{assert.equal(A.parseCSV('﻿id,title,year,policy_stage,hci_dimension\r\nA,자료,2023,의제설정,접근성·포용성\r\n').records.length,1);});
check('필수 열이 없으면 멈춤',[...P],()=>{assert.throws(()=>A.parseCSV('title,year\nno,2024'),/필수 열 누락/);});
check('등록되지 않은 범주는 미분류로 남김',[...N,...M],()=>{
  const rec=A.validateAndNormalize([{id:'X',title:'검증',year:'2024',policy_stage:'UNKNOWN',hci_dimension:'정보이해·설명'}]);
  assert.equal(rec.records[0].policy_stage,'미분류');assert.equal(A.analyze(rec.records).unclassified,1);
});
check('CSV 왕복: 내보낸 CSV를 다시 넣어도 건수·분류 같음',[...P,...N,...M,...E],()=>{
  const orig=A.validateAndNormalize(A.parseCSV(CIVICTA_REAL_CSV).records).records;
  const round=A.validateAndNormalize(A.parseCSV(A.toCSV(orig)).records).records;
  assert.equal(round.length,16);assert.equal(A.analyze(round).counted,A.analyze(orig).counted);
  assert.deepEqual(round.map(r=>r.policy_stage+r.hci_dimension),orig.map(r=>r.policy_stage+r.hci_dimension));
});
check('보고서(.md)에 건수와 한계 문구',[...N,...M,...E],()=>{
  const rows=A.validateAndNormalize(CIVICTA_DEMO).records,md=A.toMarkdown(rows,A.analyze(rows));
  assert(md.includes('집계 대상: 12건'));assert(md.includes('실증 분석 결과가 아닙니다'));assert(md.includes(CIVICTA_RULES.gapInterpretation));
});
check('가상 예시 CSV와 demo-data.js가 같음',[...P],()=>{
  assert.deepEqual(A.parseCSV(read('demo-literature.csv')).records.map(r=>r.id),CIVICTA_DEMO.map(r=>r.id));
});
console.log(`\n결과: PASS ${pass} · SKIP ${skip} (불러온 파일: ${loaded.join(', ')})`);
