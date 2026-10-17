# CivicTA Evidence Matrix

**신흥기술 영향평가의 시민참여·사용자 경험·정책 반영성에 관한 근거 기반 연구공백 분석 도구**
*Participatory Technology Assessment × Human–Computer Interaction × Science & Technology Policy*

「신흥기술영향평가세미나」 7주차 2인 1조 실습 · 도구 ② 문헌 비교 매트릭스

> 신흥기술 영향평가에서 시민의 참여를 지원하는 디지털 플랫폼은 얼마나 접근 가능하고 숙의를 지원하며 시민의 의견이 실제 과학기술정책에 반영되는 과정을 얼마나 투명하게 보여 주는가?

문헌 목록 CSV를 넣으면 `docs/rules.js`의 코딩 기준대로 정리해 **HCI 차원(5) × 정책 단계(4)** 매트릭스를 만듭니다. 칸을 누르면 근거 문헌이 나오고 CSV·마크다운으로 내보낼 수도 있습니다.

## 배포 주소
- 소유자(morins): https://morins.github.io/civicta-evidence-matrix/
- 팀원(NewQuokka, fork): https://newquokka.github.io/civicta-evidence-matrix/

(⑤ 배포 단계에서 두 주소를 시크릿 창으로 확인한 뒤 이 줄을 '확인 완료'로 바꿉니다.)

## 두 가지 예시 입력
| 버튼 | 파일 | 성격 |
|---|---|---|
| **실존 문헌 16편** | `data/real-literature.csv` | DOI 16건 모두 Crossref에서 실재 확인(2026-10-17). 코딩은 **초록 기준 초안**(`초록 검토`)이며 원문 검토 전이다 |
| 가상 예시 12건 | `data/demo-literature.csv` | 화면·기능 시연용 **모의 자료**. 실존 논문이 아니다 |
| (다른 입력) | `data/other-input.csv` | 빈 줄·제목 없음·열 수 오류·미지의 범주·중복 DOI·DOI 형식·연도 오류 시험 |

기대 결과는 `data/expected.md`에 있습니다. 도구 코드와 별개로 `python tools/expected_calc.py`가 계산한 값입니다. 화면 숫자가 이 표와 같아야 완료입니다.

**실존 16편 요약** — 분류 16 · 표본 미관찰 12/20칸 · 손 검산 칸: 숙의·상호작용×숙의·공론화 = 5, 신뢰·책임성×정책설계·결정 = 3, 피드백·반영추적×집행·평가 = 1

> 0건 칸은 **이 표본에서 관찰되지 않은 조합**입니다. 분야 전체에 연구가 없다는 뜻이 아닙니다.

## 실행
1. `docs/index.html`을 더블클릭하거나 배포 주소를 엽니다. 서버·외부 요청·AI 호출이 없습니다.
2. **실존 문헌 16편 불러오기** → 매트릭스 → 칸 클릭 → 근거 문헌 확인
3. 내 자료는 **CSV 파일 선택** 또는 붙여넣기
4. **문헌 CSV 다운로드** · **분석 보고서(.md) 다운로드**
5. 검사: `node tests/test.js` (필요한 담당 파일이 아직 병합 전이면 그 검사는 SKIP)

## CSV 형식
필수 열: `id,title,year,policy_stage,hci_dimension`
```csv
id,title,year,doi,technology,policy_stage,hci_dimension,evidence_type,policy_linkage,verification,source_url,notes
```
- 정책 단계: 의제설정 / 숙의·공론화 / 정책설계·결정 / 집행·평가
- HCI 차원: 접근성·포용성 / 정보이해·설명 / 숙의·상호작용 / 피드백·반영추적 / 신뢰·책임성
- 등록되지 않은 값은 추정하지 않고 **미분류**로 남긴 뒤 경고합니다. 정의는 `planning/분류_코드북.md`

## 2인 협업
| 역할 | 누구 | 저장소 | 맡은 파일 | 하는 일 |
|---|---|---|---|---|
| **A** 과학기술정책 | NewQuokka | 팀원 (fork로 배포) | `docs/js/import.js` · `docs/js/normalize.js` | 문헌 입력·데이터 정제·분류 기준 검증 |
| **B** HCI | morins | 소유자 | `docs/js/matrix.js` · `docs/js/export.js` | 비교 매트릭스·시각화·결과 내보내기 |
| 공동 | 두 사람 | | `planning/기획안.md` · `docs/rules.js` · `docs/index.html` · `docs/js/app.js` · README | 기획안·처리 규칙·기본 화면·설명 |

- 기준(`docs/rules.js`)을 바꿀 때는 브랜치 → PR → 상대 리뷰 → 병합. 내 PR은 내가 승인하지 않습니다.
- 커밋·PR에는 `Refs #이슈번호`를 쓰고 완료 조건을 확인한 뒤 이슈를 닫습니다.

## 파일
```
docs/            GitHub Pages (main /docs)
  index.html     화면 [공동]
  rules.js       코딩 기준 [공동]
  real-data.js   실존 16편 (tools/expected_calc.py가 생성)
  demo-data.js   가상 12건
  js/import.js   CSV 읽기·줄 번호 [A]
  js/normalize.js 기준 적용·미분류·경고 [A]
  js/matrix.js   집계·필터 [B]
  js/export.js   CSV·마크다운 [B]
  js/app.js      화면 연결 [공동]
data/            예시 입력 3종과 기대 결과
planning/        기획안 · 분류 코드북 · 고도화 이슈
reports/         발표·영상·인접 팀·제출 양식
tools/           기대 결과 계산
tests/           node 검사
```

## 연구 윤리와 한계
- 도구 안에서 AI를 호출하지 않습니다. AI는 개발 단계에서만 썼습니다.
- DOI 실재 확인과 내용 코딩은 별개입니다. 실존 16편의 코딩은 초록만 읽은 초안이므로 연구 결론에 쓰려면 원문 검토가 필요합니다.
- 주 정책 단계 1개·주 HCI 차원 1개만 부여합니다. 부차 측면은 `notes`에 남깁니다.
- 공개 저장소에는 서지정보와 팀의 코딩만 둡니다. 초록 전문·비공개 자료·개인정보는 올리지 않습니다.

## 출발점 문헌
- OECD (2022), *OECD Guidelines for Citizen Participation Processes*. https://doi.org/10.1787/f765caf6-en
- Kaplan et al. (2021), *Designing Participatory Technology Assessments*. https://doi.org/10.1016/j.techfore.2021.120974
- Shin et al. (2024), *A systematic analysis of digital tools for citizen participation*. https://doi.org/10.1016/j.giq.2024.101954
- Yang et al. (2024), *The Future of HCI-Policy Collaboration*. arXiv:2409.19738 (프리프린트)
