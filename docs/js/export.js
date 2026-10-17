window.CIVICTA = window.CIVICTA || {};
(function(api){
 'use strict';
 function csvCell(value){
   let s=String(value??'');
   // Office 스프레드시트에서 사용자 제공 문자열이 수식으로 실행되지 않도록 보호
   if(/^[=+@\-\t\r]/.test(s))s="'"+s;
   return '"'+s.replace(/"/g,'""')+'"';
 }
 function toCSV(rows,rules=window.CIVICTA_RULES){
   return '\uFEFF'+[rules.csvColumns.join(','),...rows.map(r=>rules.csvColumns.map(c=>csvCell(r[c])).join(','))].join('\r\n');
 }
 function toMarkdown(rows,analysis,rules=window.CIVICTA_RULES){
   const lines=[`# 시민참여 기술영향평가 문헌 비교`, ``, `- 집계 대상: ${analysis.count}건`,
     `- 주 정책단계·HCI차원이 모두 분류된 문헌: ${analysis.counted}건`, `- 미분류: ${analysis.unclassified}건`,
     `- 표본에서 미관찰된 조합: ${analysis.gaps}개`, `- 정책 반영 근거가 확인되었다고 입력된 건: ${analysis.traceable}건`,
     `- 분류 규칙 버전: ${rules.version}`, ``, `> 주의: ${rules.gapInterpretation}`,
     ...(analysis.demo?['> 주의: 가상 시연 데이터가 포함되어 있습니다. 실증 분석 결과가 아닙니다.']:[]),``,
     `| HCI 차원 / 정책단계 | ${rules.policyStages.join(' | ')} |`,`| --- | ${rules.policyStages.map(()=> '---:').join(' | ')} |`];
   rules.hciDimensions.forEach((h,i)=>lines.push(`| ${h} | ${analysis.cells[i].map(c=>c.length).join(' | ')} |`));
   lines.push('',`## 문헌별 코딩`, '| ID | 제목 | 연도 | 정책단계 | HCI 차원 | 검토 수준 | DOI |', '| --- | --- | --- | --- | --- | --- | --- |');
   rows.forEach(r=>lines.push(`| ${[r.id,r.title,r.year,r.policy_stage,r.hci_dimension,r.verification,r.doi].map(x=>String(x||'').replace(/\|/g,'\\|').replace(/\r?\n/g,' ')).join(' | ')} |`));
   return lines.join('\n');
 }
 api.toCSV=toCSV;api.toMarkdown=toMarkdown;
})(window.CIVICTA);
