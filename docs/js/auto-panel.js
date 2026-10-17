(function(){
  'use strict';
  // [자동화 화면] 샘플 모드(키 없음)와 실제 자동화 모드(개인 API 키)를 같은 확정 표로 보여 준다.
  const $=id=>document.getElementById(id);
  const api=window.CIVICTA||{},ai=api.ai,rules=window.CIVICTA_RULES;
  if(!ai||!$('automation'))return;
  const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const KEY_STORE='civicta.apiKey';
  const MAX=30;
  let items=[],mode='sample',running=false,ctx=null;

  function say(msg,isError=false){$('auto-status').textContent=msg;$('auto-status').classList.toggle('error',isError);}
  function store(){try{return window.sessionStorage;}catch(e){return null;}}

  // 모드 전환
  function setMode(next){
    mode=next;
    $('tab-sample').setAttribute('aria-selected',String(next==='sample'));$('tab-live').setAttribute('aria-selected',String(next==='live'));
    $('pane-sample').hidden=next!=='sample';$('pane-live').hidden=next!=='live';
    $('auto-mode-chip').textContent=next==='sample'?'샘플 모드 · API 키 없음':'실제 자동화 · 개인 API 키';
  }
  $('tab-sample').addEventListener('click',()=>setMode('sample'));
  $('tab-live').addEventListener('click',()=>setMode('live'));

  // 모델 목록과 키 기억(선택)
  ai.MODELS.forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=`${m.label} · 입력 $${m.inUsd}/출력 $${m.outUsd} (100만 토큰)`;$('auto-model').appendChild(o);});
  const saved=store()?.getItem(KEY_STORE);
  if(saved){$('auto-key').value=saved;$('auto-remember').checked=true;}
  function rememberKey(){const s=store();if(!s)return;try{if($('auto-remember').checked&&$('auto-key').value)s.setItem(KEY_STORE,$('auto-key').value.trim());else s.removeItem(KEY_STORE);}catch(e){}}
  $('auto-remember').addEventListener('change',rememberKey);
  $('auto-forget').addEventListener('click',()=>{$('auto-key').value='';$('auto-remember').checked=false;ctx=null;rememberKey();say('키를 지웠습니다.');});

  function updateEstimate(){
    const n=Math.min(ai.parseDoiList($('auto-dois').value).dois.length,MAX);
    $('auto-estimate').textContent=n?`${n}편 · 예상 비용 약 $${ai.estimateUsd(n,$('auto-model').value).toFixed(2)} (어림값, 실제 사용량은 실행 뒤 표시)`:'예상 비용은 DOI를 넣으면 표시됩니다.';
  }
  $('auto-dois').addEventListener('input',updateEstimate);$('auto-model').addEventListener('change',updateEstimate);

  // 확정 표
  const confClass={높음:'high',중간:'mid',낮음:'low'};
  function selectHtml(i,field,list,value,suggested){
    return `<select data-i="${i}" data-f="${field}" class="${value!==suggested?'changed':''}" aria-label="${field==='policy_stage'?'정책 단계':'HCI 차원'}">`+
      [...list,'미분류'].map(v=>`<option${v===value?' selected':''}>${html(v)}</option>`).join('')+'</select>';
  }
  function render(){
    $('auto-review-wrap').hidden=!items.length;
    $('auto-review').querySelector('tbody').innerHTML=items.map((it,i)=>{
      const s=it.suggestion,p=it.paper;
      const paperCell=`<span class="row-title">${html(p.title||'(제목 없음)')}</span><a class="row-source" target="_blank" rel="noopener noreferrer" href="https://doi.org/${encodeURI(p.doi)}">${html(p.doi)} ↗</a><span class="row-notes">${html(p.year)} · ${html(p.status)}${p.source&&p.source!=='견본'?' · '+html(p.source):''}</span>`;
      const sugCell=it.error?`<span class="err">${html(it.error)}</span>`:!s?'<span class="row-notes">제안 대기</span>':
        `<span class="conf ${confClass[s.confidence]||''}">확신도 ${html(s.confidence)}</span>${html(s.evidence_type)} · ${html(s.policy_linkage)}<span class="row-notes">${html(s.rationale)}</span>`;
      const cmp=!it.human||!s?'<span class="row-notes">비교 자료 없음</span>':
        ['policy_stage','hci_dimension'].map(f=>{const same=it.final[f]===it.human[f];return `<span class="${same?'agree':'disagree'}">${same?'일치':'다름'}</span> ${html(it.human[f])}`;}).join('<br>');
      return `<tr><td><input type="checkbox" data-i="${i}" class="pick" ${it.picked?'checked':''} ${s?'':'disabled'} aria-label="확정"></td><td>${paperCell}</td><td>${sugCell}</td>`+
        `<td>${s?selectHtml(i,'policy_stage',rules.policyStages,it.final.policy_stage,s.policy_stage):'—'}</td><td>${s?selectHtml(i,'hci_dimension',rules.hciDimensions,it.final.hci_dimension,s.hci_dimension):'—'}</td><td>${cmp}</td></tr>`;
    }).join('');
  }
  $('auto-review').addEventListener('change',ev=>{
    const t=ev.target,i=Number(t.dataset.i);if(Number.isNaN(i))return;
    if(t.classList.contains('pick'))items[i].picked=t.checked;
    else if(t.dataset.f){items[i].final[t.dataset.f]=t.value;render();}
  });
  $('auto-check-all').addEventListener('click',()=>{items.forEach(it=>{if(it.suggestion)it.picked=true;});render();});

  // ① 샘플 모드: 키·네트워크 없이 견본 제안을 불러온다.
  $('auto-sample').addEventListener('click',()=>{
    items=(window.CIVICTA_AI_SAMPLE||[]).map(it=>({...it,paper:{...it.paper},suggestion:{...it.suggestion},final:{...it.suggestion},picked:false}));
    const agree=items.filter(it=>it.final.policy_stage===it.human.policy_stage&&it.final.hci_dimension===it.human.hci_dimension).length;
    say(`견본 ${items.length}편을 불러왔습니다(API 호출 아님). 사람 코딩과 두 칸 모두 일치 ${agree}편 · 다른 곳은 표에서 고친 뒤 확정하세요.`);
    render();
  });

  // ② 실제 자동화 1단계: 초록 수집 (키 불필요)
  async function collect(){
    const {dois,bad}=ai.parseDoiList($('auto-dois').value);
    if(!dois.length){say('DOI를 한 줄에 하나씩 넣으세요.'+(bad.length?` 형식이 다른 값: ${bad.slice(0,3).join(', ')}`:''),true);return false;}
    const list=dois.slice(0,MAX);
    items=list.map(d=>({paper:{doi:d,title:'',year:'',status:'수집 중'},suggestion:null,final:null,picked:false}));render();
    for(let i=0;i<list.length;i++){
      say(`초록 수집 중… ${i+1}/${list.length}`);
      items[i].paper=await ai.fetchPaper(list[i]);render();
    }
    const got=items.filter(it=>it.paper.status==='수집됨').length;
    say(`초록 수집 완료: ${got}/${list.length}편`+(dois.length>MAX?` (앞의 ${MAX}편만)`:'')+(bad.length?` · 형식 오류로 뺀 값 ${bad.length}개`:'')+'. 초록이 없는 문헌은 제목만으로 제안을 받습니다.');
    return true;
  }
  $('auto-fetch').addEventListener('click',async()=>{if(running)return;running=true;try{await collect();}finally{running=false;}});

  // ② 실제 자동화 2단계: 개인 API 키로 코딩 제안
  $('auto-run').addEventListener('click',async()=>{
    if(running)return;running=true;
    try{
      const key=$('auto-key').value;
      try{ctx=await ai.makeClient(key);}catch(e){say(e.message||'SDK를 불러오지 못했습니다(네트워크 확인).',true);return;}
      rememberKey();
      const wanted=ai.parseDoiList($('auto-dois').value).dois.slice(0,MAX).join('|');
      if(!items.length||items.some(it=>it.paper.source==='견본')||items.map(it=>it.paper.doi).join('|')!==wanted){
        if(!(await collect()))return;   // 수집 안 했거나 DOI 목록이 바뀌었으면 먼저 수집
      }
      const model=$('auto-model').value;let cost=0,done=0,failed=0;
      const queue=items.map((it,i)=>i).filter(i=>items[i].paper.title);
      async function worker(){
        while(queue.length){
          const i=queue.shift();
          say(`AI 코딩 제안 받는 중… ${done+failed+1}/${items.length}`);
          try{
            const s=await ai.suggest(ctx,items[i].paper,model);
            items[i].suggestion=s;items[i].final={...s};items[i].error='';cost+=ai.costUsd(s.usage,model);done++;
          }catch(e){
            items[i].error=ai.explainError(e,ctx.Anthropic);failed++;
            if(e instanceof ctx.Anthropic.AuthenticationError){queue.length=0;}
          }
          render();
        }
      }
      await Promise.all([worker(),worker(),worker()]);
      if(!done)say(`제안을 받지 못했습니다(실패 ${failed}편). 표의 오류 문구를 확인하세요.`,true);
      else say(`제안 완료 ${done}편 · 실패 ${failed}편 · 이번 사용 비용 약 $${cost.toFixed(3)}. 표에서 범주를 확인·수정하고 확정하세요.`);
    }finally{running=false;}
  });

  // 확정 → 매트릭스에 추가 (사람이 체크한 문헌만)
  $('auto-apply').addEventListener('click',()=>{
    const picked=items.filter(it=>it.picked&&it.suggestion);
    if(!picked.length){say('확정할 문헌을 체크하세요.',true);return;}
    const records=picked.map((it,i)=>ai.toRecord(it,i));
    window.dispatchEvent(new CustomEvent('civicta:add-records',{detail:{records,label:`자동화 확정 ${records.length}편`}}));
    say(`${records.length}편을 매트릭스에 추가했습니다. 검토 수준은 '초록 검토', 메모에 AI 제안임을 남겼습니다.`);
    $('dashboard')?.scrollIntoView({behavior:'smooth'});
  });

  // 제안 그대로 내보내기 (확정 전 자료라 검토 수준 '검토 필요')
  $('auto-export').addEventListener('click',()=>{
    const rows=items.filter(it=>it.suggestion).map((it,i)=>({...ai.toRecord(it,i),verification:'검토 필요',
      notes:`AI 제안·미확정(${it.suggestion.model}, 확신도 ${it.suggestion.confidence}). 근거: ${it.suggestion.rationale}`}));
    if(!rows.length){say('내보낼 제안이 없습니다.',true);return;}
    if(typeof api.toCSV!=='function'){say('js/export.js(B)가 연결되지 않아 CSV 내보내기를 할 수 없습니다.',true);return;}
    const blob=new Blob([api.toCSV(rows)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='civicta-ai-suggestions.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  });

  setMode('sample');updateEstimate();
})();
