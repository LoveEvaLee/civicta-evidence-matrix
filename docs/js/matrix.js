window.CIVICTA = window.CIVICTA || {};
(function(api){
  'use strict';
  // 선택 열(notes·doi·technology)이 없는 레코드도 검색할 수 있게 빈 값은 ''로 본다 (Refs #3)
  function filterRecords(records,params={}){
    const q=String(params.keyword||'').toLocaleLowerCase('ko');
    return records.filter(r=>(!q || ['title','notes','doi','technology'].some(k=>String(r[k]??'').toLocaleLowerCase('ko').includes(q))) &&
     (!params.verification || params.verification==='all' || r.verification===params.verification) &&
     (!params.policy_stage || params.policy_stage==='all' || r.policy_stage===params.policy_stage) &&
     (!params.hci_dimension || params.hci_dimension==='all' || r.hci_dimension===params.hci_dimension));
  }
  function analyze(records,rules=window.CIVICTA_RULES){
    const cells=rules.hciDimensions.map(h=>rules.policyStages.map(p=>records.filter(r=>r.hci_dimension===h && r.policy_stage===p)));
    const counted=cells.flat(2).length;
    const gaps=cells.flat(1).filter(cell=>cell.length===0).length;
    const traceable=records.filter(r=>r.policy_linkage==='반영 근거 확인').length;
    const demo=records.some(r=>r.verification==='시연용 가상자료');
    return {cells, count:records.length, counted, unclassified:records.length-counted, gaps, traceable, demo,
      countsByHci:rules.hciDimensions.map((name,i)=>({name,value:cells[i].reduce((a,b)=>a+b.length,0)}))};
  }
  api.filterRecords=filterRecords;
  api.analyze=analyze;
})(window.CIVICTA);
