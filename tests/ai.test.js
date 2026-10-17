'use strict';
// 실행: node tests/ai.test.js  — 네트워크·API 키 없이 자동화 로직만 검사한다(가짜 응답 사용).
const assert=require('node:assert/strict');
const path=require('node:path');
global.window=global;
for(const f of ['rules.js','ai-sample.js','js/ai.js'])require(path.resolve(__dirname,'../docs',f));
const ai=global.CIVICTA.ai,R=global.CIVICTA_RULES;
let pass=0;
async function check(name,fn){try{await fn();pass++;console.log('PASS',name);}catch(e){console.error('FAIL',name);throw e;}}

(async()=>{
await check('DOI 목록 정리: 접두 제거·중복 제거·형식 오류 분리',()=>{
  const r=ai.parseDoiList('https://doi.org/10.1145/3643057\ndoi:10.1145/3643057\n10.1016/J.GIQ.2024.101954, not-a-doi');
  assert.deepEqual(r.dois,['10.1145/3643057','10.1016/j.giq.2024.101954']);assert.deepEqual(r.bad,['not-a-doi']);
});
await check('OpenAlex 역색인 초록 복원',()=>{
  assert.equal(ai.abstractFromInverted({citizens:[0],deliberate:[1],online:[2]}),'citizens deliberate online');
});
await check('초록 수집: OpenAlex에 초록 없으면 Crossref로 채움',async()=>{
  const fake=async url=>({ok:true,json:async()=>url.includes('openalex')
    ?{title:'T',publication_year:2024,abstract_inverted_index:null,primary_location:{source:{display_name:'V'}}}
    :{message:{title:['T'],abstract:'<jats:p>Hello <b>world</b></jats:p>'}}});
  const p=await ai.fetchPaper('10.1/x',fake);
  assert.equal(p.abstract,'Hello world');assert.equal(p.status,'수집됨');assert.equal(p.source,'Crossref');
});
await check('요청: 범주 enum은 rules.js에서, Opus 기본·fallbacks 포함',()=>{
  const req=ai.buildRequest({title:'T',year:'2024',venue:'V',abstract:'A'},undefined);
  assert.equal(req.model,'claude-opus-5-5');assert.equal(req.fallbacks,'default');
  const sc=req.output_config.format.schema;
  assert.deepEqual(sc.properties.policy_stage.enum,[...R.policyStages,'미분류']);
  assert.deepEqual(sc.properties.hci_dimension.enum,[...R.hciDimensions,'미분류']);
  assert.equal(sc.additionalProperties,false);
  assert(req.messages[0].content.includes('<paper>'));
  assert.equal(ai.buildRequest({title:'T'},'claude-haiku-5-5').fallbacks,undefined);
});
await check('응답 검사: 목록 밖 값은 미분류, 거절·잘림은 오류',()=>{
  const msg=t=>({stop_reason:'end_turn',model:'m',content:[{type:'text',text:JSON.stringify(t)}]});
  const s=ai.readSuggestion(msg({policy_stage:'공론화',hci_dimension:'숙의·상호작용',evidence_type:'실증연구',policy_linkage:'x',rationale:'r',confidence:'높음'}));
  assert.equal(s.policy_stage,'미분류');assert.equal(s.hci_dimension,'숙의·상호작용');assert.equal(s.policy_linkage,'미코딩·판정 보류');
  assert.throws(()=>ai.readSuggestion({stop_reason:'refusal',content:[]}),/거절/);
  assert.throws(()=>ai.readSuggestion({stop_reason:'max_tokens',content:[]}),/잘렸/);
});
await check('키 형식이 아니면 SDK를 부르기 전에 멈춤',async()=>{
  await assert.rejects(ai.makeClient(''),/API 키 형식/);
});
await check('확정 레코드: 초록 검토 · AI 제안 메모 · 사람 수정 표시',()=>{
  const item={id:'X',paper:{doi:'10.1/x',title:'T',year:'2024'},suggestion:{policy_stage:'의제설정',hci_dimension:'접근성·포용성',model:'m',confidence:'중간',rationale:'근거'},
    final:{policy_stage:'숙의·공론화',hci_dimension:'접근성·포용성',evidence_type:'실증연구',policy_linkage:'해당 없음'}};
  const r=ai.toRecord(item,0);
  assert.equal(r.verification,'초록 검토');assert(r.notes.includes('AI 제안'));assert(r.notes.includes('사람이 범주 수정'));
});
await check('견본 6편: 실존 DOI·사람 코딩 비교 4편 일치·초록 미포함',()=>{
  const S=global.CIVICTA_AI_SAMPLE;assert.equal(S.length,6);
  assert(S.every(it=>/^10\./.test(it.paper.doi)&&it.paper.abstract===''&&it.suggestion.model.includes('API 호출 아님')));
  assert(S.every(it=>R.policyStages.includes(it.suggestion.policy_stage)&&R.hciDimensions.includes(it.suggestion.hci_dimension)));
  assert.equal(S.filter(it=>it.suggestion.policy_stage===it.human.policy_stage&&it.suggestion.hci_dimension===it.human.hci_dimension).length,4);
});
await check('비용 어림: 모델 단가 반영',()=>{
  assert(ai.estimateUsd(10,'claude-opus-5-5')>ai.estimateUsd(10,'claude-haiku-5-5'));
  assert.equal(ai.costUsd({input_tokens:1e6,output_tokens:0},'claude-sonnet-5-5'),2);
});
console.log(`\n자동화 검사: PASS ${pass}`);
})();
