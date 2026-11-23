/*
 * 신청서(개발 및 운영계획서) 입력 폼
 * - 유형 탐색 결과에서 "신청서 작성하기"를 누르면 열립니다.
 * - 입력 내용은 이 브라우저(localStorage)에 자동 저장됩니다.
 * - JSON으로 내보내고 불러올 수 있고, hwpx 내려받기는 js/hwpx-export.js 가 맡습니다.
 */
(function () {
  const STORAGE_KEY = 'lcc-application-draft-v1';
  const WEEKS = 15;

  // ---------- 상태 ----------
  function emptyModule(kind) {
    if (kind === 'pbl') return { content: '', goal: '', title: '', role: '', scenario: '' };
    if (kind === 'pjbl') return { topic: '', goal: '', weeks: '', activity: '' };
    return {
      content: '', goal: '',
      pre: { session: '', mode: '', topic: '', objective: '', extra: '', body: '' },
      elements: {}, stages: { pre: '', preEval: '', intro: '', dev: '', close: '', post: '' },
    };
  }

  function emptyData() {
    return {
      overview: {
        courseType: '', grade: '', size: '', sizeOver: '', mode: '', modeCount: '',
        split: '', splitCount: '', dept: '', courseNo: '', nameKo: '', nameEn: '',
        credit: '', lecture: '', practice: '', exempt: '', exemptYear: '', exemptTerm: '',
        room: '', objective: '',
        need1: '', need2: '', need3: '', need4: '',
      },
      applicants: [{ name: '', affil: '', office: '', mobile: '', email: '' }],
      consent: '',
      basic: { purpose: '', ic: '', method: '', participation: '', team: '' },
      evalOverall: { mid: '', final: '', attend: '', quiz: '', etc: '' },
      evalDetail: {},
      interactions: {
        tl: [{ session: '', method: '', media: '' }, { session: '', method: '', media: '' }],
        ll: [{ session: '', method: '', media: '' }, { session: '', method: '', media: '' }],
      },
      weeks: Array.from({ length: WEEKS }, () => ({ content: '', method: '', detail: '' })),
      modules: { pbl: [emptyModule('pbl'), emptyModule('pbl')], pjbl: [emptyModule('pjbl')], fl: [emptyModule('fl')] },
      checklist: {},
    };
  }

  let typeKey = null;
  let data = emptyData();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && saved.data) data = deepMerge(emptyData(), saved.data);
    } catch (e) { /* 저장소를 쓸 수 없는 환경이면 새로 시작 */ }
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    setSaveStatus('저장 중…');
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: typeKey, savedAt: new Date().toISOString(), data }));
        setSaveStatus('이 브라우저에 자동 저장됨 · ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        setSaveStatus('자동 저장을 쓸 수 없습니다. JSON 내보내기로 보관해 주세요.');
      }
    }, 300);
  }

  function setSaveStatus(t) {
    const el = document.getElementById('save-status');
    if (el) el.textContent = t;
  }

  function deepMerge(base, src) {
    if (Array.isArray(base)) return Array.isArray(src) ? src.map((v, i) => (base[i] !== undefined ? deepMerge(base[i], v) : v)) : base;
    if (base && typeof base === 'object') {
      const out = { ...base };
      if (src && typeof src === 'object') for (const k of Object.keys(src)) out[k] = k in base ? deepMerge(base[k], src[k]) : src[k];
      return out;
    }
    return src === undefined ? base : src;
  }

  function getPath(path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), data);
  }
  function setPath(path, value) {
    const keys = path.split('.');
    let o = data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null) o[keys[i]] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = value;
  }

  // ---------- 작은 HTML 도우미 ----------
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = () => FORM_TYPES[typeKey];

  function guess(key) {
    const note = GUESS_NOTES[key];
    if (!note) return '';
    return `<span class="guess" tabindex="0" title="${esc(note)}" data-note="${esc(note)}">추정</span>`;
  }

  function hint(t) { return t ? `<p class="hint">${t}</p>` : ''; }

  function input(path, opts = {}) {
    const v = getPath(path) ?? '';
    const type = opts.type || 'text';
    const cls = 'inp' + (opts.cls ? ' ' + opts.cls : '');
    const ph = opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : '';
    const extra = type === 'number' ? ' inputmode="numeric" min="0"' : '';
    return `<input type="${type}" class="${cls}" data-path="${path}" value="${esc(v)}"${ph}${extra} aria-label="${esc(opts.label || path)}" />`;
  }

  function textarea(path, opts = {}) {
    const v = getPath(path) ?? '';
    const ph = opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : '';
    return `<textarea class="inp" rows="${opts.rows || 3}" data-path="${path}"${ph} aria-label="${esc(opts.label || path)}">${esc(v)}</textarea>`;
  }

  function radios(path, options, label) {
    const v = getPath(path) ?? '';
    return `<div class="chips" role="radiogroup" aria-label="${esc(label || path)}">${options.map(o =>
      `<label class="chip"><input type="radio" name="${path}" data-path="${path}" value="${esc(o)}" ${v === o ? 'checked' : ''}/><span>${esc(o)}</span></label>`
    ).join('')}</div>`;
  }

  function row(label, body, opts = {}) {
    return `<div class="frow${opts.req ? ' req' : ''}"><div class="flabel">${label}${opts.guess ? guess(opts.guess) : ''}</div><div class="fbody">${body}${hint(opts.hint)}</div></div>`;
  }

  function section(id, title, body, sub) {
    return `<section id="${id}" class="fsec"><h3 class="fsec-title">${title}</h3>${sub ? `<p class="fsec-sub">${sub}</p>` : ''}${body}</section>`;
  }

  // ---------- 섹션 렌더 ----------
  function renderOverview() {
    const o = 'overview';
    const ov = data.overview;
    return section('sec-overview', 'Ⅰ. 개요', [
      row('교과유형', radios(`${o}.courseType`, ['전공필수', '전공선택', '교양'], '교과유형'), { req: true }),
      row('수강학년', radios(`${o}.grade`, ['1학년', '2학년', '3학년', '4학년'], '수강학년'), { req: true }),
      row('수강규모', radios(`${o}.size`, ['10명~20명', '21명~30명', '30명 초과'], '수강규모') +
        `<div class="cond ${ov.size === '30명 초과' ? '' : 'hidden'}" data-show-when="${o}.size=30명 초과">${input(`${o}.sizeOver`, { type: 'number', cls: 'w-24', placeholder: '인원', label: '30명 초과 인원' })} 명</div>`, { req: true }),
      row('운영형태', radios(`${o}.mode`, ['단독', '코티칭', '팀티칭'], '운영형태') +
        `<div class="cond ${ov.mode && ov.mode !== '단독' ? '' : 'hidden'}" data-show-when="${o}.mode!=단독">${input(`${o}.modeCount`, { type: 'number', cls: 'w-24', placeholder: '인원', label: '참여 교원 수' })} 명</div>`,
        { req: true, hint: '코티칭: 2명 이상 교원 전원이 함께 출석해 가르침(통합교양 융·복합 영역) · 팀티칭: 2명 이상이 수업시간을 나눠 교대로 가르침' }),
      row('분반여부', radios(`${o}.split`, ['예', '아니오'], '분반여부') +
        `<div class="cond ${ov.split === '예' ? '' : 'hidden'}" data-show-when="${o}.split=예">${input(`${o}.splitCount`, { type: 'number', cls: 'w-24', placeholder: '개수', label: '분반 수' })} 개 분반</div>`, { req: true }),
      row('개설학과(부)(전공)', input(`${o}.dept`, { label: '개설학과' }), { req: true }),
      row('학수번호', input(`${o}.courseNo`, { cls: 'w-48', label: '학수번호' })),
      row('교과목명', `<div class="grid2">${input(`${o}.nameKo`, { placeholder: '(국문)', label: '교과목명 국문' })}${input(`${o}.nameEn`, { placeholder: '(영문)', label: '교과목명 영문' })}</div>`, { req: true }),
      row('학점 - 강의 - 실습', `<div class="flex items-center gap-2 flex-wrap">${input(`${o}.credit`, { type: 'number', cls: 'w-20', placeholder: '학점', label: '학점' })}<span>-</span>${input(`${o}.lecture`, { type: 'number', cls: 'w-20', placeholder: '강의', label: '강의 시간' })}<span>-</span>${input(`${o}.practice`, { type: 'number', cls: 'w-20', placeholder: '실습', label: '실습 시간' })}</div>`, { req: true, guess: 'credit' }),
      row('개설심의 제외 교과목 여부<br><small>(승인 후 2년 이내)</small>', radios(`${o}.exempt`, ['예', '아니오'], '개설심의 제외') +
        `<div class="cond ${ov.exempt === '예' ? '' : 'hidden'}" data-show-when="${o}.exempt=예">${input(`${o}.exemptYear`, { type: 'number', cls: 'w-24', placeholder: '2025', label: '승인 학년도' })} 학년도 ${input(`${o}.exemptTerm`, { type: 'number', cls: 'w-16', placeholder: '1', label: '승인 학기' })} 학기</div>`,
        { hint: '* 교수자 변경 혹은 강의계획서 변경 시 심의 대상 · * 24학년도 2학기 심의 승인 교과목까지 제외 인정' }),
      row('구분', `<span class="fixed-val">${esc(T().fullTitle)}</span>`),
      row('전용강의실 사용', radios(`${o}.room`, ['예', '아니오'], '전용강의실 사용')),
      row('수업목표', textarea(`${o}.objective`, { rows: 3, label: '수업목표' }), { req: true }),
      row('교과목 개설 필요성',
        `<div class="stack">
          <label class="sublabel">1. ${esc(T().code)} 교과목으로서의 특징</label>${textarea(`${o}.need1`, { rows: 3 })}
          <label class="sublabel">2. 전공특성(필요성)</label>${textarea(`${o}.need2`, { rows: 3 })}
          <label class="sublabel">3. 학습자특성</label>${textarea(`${o}.need3`, { rows: 3, placeholder: '※ 예상 학습자들의 배경지식, 학습자중심수업의 경험 등 기재' })}
          <label class="sublabel">4. 기대효과</label>${textarea(`${o}.need4`, { rows: 3 })}
        </div>`, { req: true }),
    ].join(''));
  }

  function renderApplicants() {
    const list = data.applicants.map((a, i) => `
      <div class="card">
        <div class="card-head"><strong>신청자 ${i + 1}</strong>${data.applicants.length > 1 ? `<button type="button" class="link-btn" data-action="remove-applicant" data-index="${i}">삭제</button>` : ''}</div>
        <div class="grid2">
          <label class="sublabel">성명${input(`applicants.${i}.name`, { label: '성명' })}</label>
          <label class="sublabel">소속${input(`applicants.${i}.affil`, { label: '소속' })}</label>
          <label class="sublabel">연구실 전화${input(`applicants.${i}.office`, { type: 'tel', label: '연구실 전화' })}</label>
          <label class="sublabel">핸드폰${input(`applicants.${i}.mobile`, { type: 'tel', label: '핸드폰' })}</label>
          <label class="sublabel col-span-full">e-mail${input(`applicants.${i}.email`, { type: 'email', label: 'e-mail' })}</label>
        </div>
      </div>`).join('');
    return section('sec-applicant', '신청자 정보' + guess('applicants'),
      list + `<button type="button" class="add-btn" data-action="add-applicant">+ 신청자 추가</button>` +
      `<div class="consent">
        <p><strong>※ 개인정보수집활용 동의(필수)</strong><br>본인은 학습자중심수업 교과목 개발 및 운영의 공모에 지원함에 있어 제출한 인적사항 및 강의계획서 등의 자료가 학습자중심수업 교과목 개발 및 운영 지원을 위해 활용될 필요가 있다는 것을 이해하고 있으며, 이를 위해 본인의 정보를 교육혁신처에 제공하는데 동의합니다.</p>
        ${radios('consent', ['동의함', '동의하지 않음'], '개인정보 동의')}
      </div>`,
      '교수자가 여러 명일 경우 모든 사람의 정보를 기재합니다.');
  }

  function renderBasic() {
    const c = T().code;
    const rows = [
      row(`${c} 도입 필요성 및 목적`, textarea('basic.purpose', { rows: 4 }), { req: true }),
    ];
    if (T().ic) rows.push(row('현장연계(IC) 계획', textarea('basic.ic', { rows: 4, placeholder: '예: 연계 기업·기관, 기업 담당자의 참여 방식(문제 제시, 중간 피드백, 결과 평가 등), 참여 주차' }), { req: true, guess: 'ic' }));
    rows.push(
      row('수업방식', textarea('basic.method', { rows: 3, placeholder: `※ 강의식 수업, 토론, ${c} 개별수업, ${c} 단체수업 등 수업에 적용할 수업방식 기재` }), { req: true }),
      row('학습자 개인별 참여 방안', textarea('basic.participation', { rows: 3, placeholder: `※ ${c} 학습에 있어서 학습자의 역할 및 수업 참여 방안` }), { req: true }),
      row('역할 배정 및 팀 구성 방법', textarea('basic.team', { rows: 3 }), { req: true }),
    );
    return section('sec-basic', 'Ⅱ. 세부운영계획 — 가. 기본정보', rows.join(''));
  }

  function renderEval() {
    const ov = [['mid', '중간'], ['final', '기말'], ['attend', '출석'], ['quiz', '수시'], ['etc', '기타']];
    const overall = `
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>평가항목</th>${ov.map(([, l]) => `<th>${l}</th>`).join('')}<th>총합</th></tr></thead>
        <tbody><tr><th>비율(%)</th>${ov.map(([k, l]) => `<td>${input(`evalOverall.${k}`, { type: 'number', cls: 'num', label: l + ' 비율' })}</td>`).join('')}<td><span class="sum" id="sum-overall">0</span></td></tr></tbody>
      </table></div>
      ${hint('위 평가항목 중 선택하여 평가 비율을 제시하되, 총합이 100이 되도록 구성')}`;

    const rows = T().evalRows;
    const base = `evalDetail.${typeKey}`;
    let lastCat = null;
    const detail = `
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>평가항목</th><th>세부항목</th><th>평가자</th><th>비율(%)</th></tr></thead>
        <tbody>${rows.map((r, i) => {
          const catCell = r.cat !== lastCat ? `<td class="cat">▪ ${esc(r.cat)}</td>` : '<td class="cat cont"></td>';
          lastCat = r.cat;
          const item = r.editable ? input(`${base}.${i}.item`, { placeholder: '세부항목', label: '기타 세부항목' }) : `▪ ${esc(r.item)}`;
          const who = r.editable || r.whoEditable ? input(`${base}.${i}.who`, { placeholder: '평가자', label: '평가자' }) : esc(r.who);
          return `<tr>${catCell}<td>${item}</td><td>${who}</td><td>${input(`${base}.${i}.pct`, { type: 'number', cls: 'num', label: '비율' })}</td></tr>`;
        }).join('')}
        <tr><th colspan="3">총합</th><td><span class="sum" id="sum-detail">0</span></td></tr></tbody>
      </table></div>
      ${hint(`위에서 제시한 ${esc(T().code)} 평가항목 중 선택하여 평가 비율을 제시하되, 총합이 100이 되도록 구성`)}`;

    return section('sec-eval', '나. 평가 계획',
      `<h4 class="h4">전체 수업 평가 계획</h4>${overall}<h4 class="h4">${esc(T().code)} 수업 평가 계획${guess('evalDetail')}</h4>${detail}`);
  }

  function interactionTable(key, title) {
    const list = data.interactions[key];
    return `<h4 class="h4">${title}</h4>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th class="w-24">차시</th><th>방법</th><th>활용 매체</th><th class="w-12"></th></tr></thead>
        <tbody>${list.map((r, i) => `<tr>
          <td>${input(`interactions.${key}.${i}.session`, { placeholder: '예: 3주차', label: '차시' })}</td>
          <td>${textarea(`interactions.${key}.${i}.method`, { rows: 2, label: '방법' })}</td>
          <td>${input(`interactions.${key}.${i}.media`, { placeholder: '예: LMS 토론방', label: '활용 매체' })}</td>
          <td>${list.length > 1 ? `<button type="button" class="link-btn" data-action="remove-interaction" data-key="${key}" data-index="${i}" aria-label="행 삭제">✕</button>` : ''}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      <button type="button" class="add-btn" data-action="add-interaction" data-key="${key}">+ 행 추가</button>`;
  }

  function renderInteraction() {
    const teacher = T().ic ? '교수자/기업 담당자·학습자 상호작용 및 피드백 방안' : '교수자·학습자 상호작용 및 피드백 방안';
    return section('sec-interaction', '다. 상호작용 및 피드백 계획' + guess('interaction'),
      interactionTable('tl', teacher) + interactionTable('ll', '학습자·학습자 상호작용 및 피드백 방안'),
      '교수자·학습자, 학습자 상호 간의 상호작용 및 피드백 방안을 명시합니다(승인기준).');
  }

  function renderWeeks() {
    const c = T().code;
    const listId = 'method-options';
    const opts = [T().sampleWeekMethod, '강의', '토론', '실습', '발표', '중간고사', '기말고사'];
    return section('sec-weeks', '라. 수업 진행 계획' + guess('weeks'),
      `<datalist id="${listId}">${opts.map(o => `<option value="${esc(o)}"></option>`).join('')}</datalist>
      <div class="lc-counter" id="lc-counter"></div>
      <div class="tbl-wrap"><table class="tbl weeks">
        <thead><tr><th class="w-12">주차</th><th>${typeKey === 'PBL' || typeKey === 'PJBL' ? '수업 내용' : '강의 내용'}</th><th class="w-36">수업방식</th><th>${typeKey === 'PBL' || typeKey === 'PJBL' ? '세부내용' : '수업 진행 세부내용'}</th></tr></thead>
        <tbody>${data.weeks.map((w, i) => `<tr>
          <th>${i + 1}</th>
          <td>${textarea(`weeks.${i}.content`, { rows: 2, label: `${i + 1}주차 내용`, placeholder: i === 1 ? '예: 오리엔테이션' : '' })}</td>
          <td><input list="${listId}" class="inp" data-path="weeks.${i}.method" value="${esc(w.method)}" aria-label="${i + 1}주차 수업방식" placeholder="${i === 1 ? '강의' : ''}"/></td>
          <td>${textarea(`weeks.${i}.detail`, { rows: 2, label: `${i + 1}주차 세부내용` })}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      ${hint('강의 개설 시 강의계획서에 수업주차의 세부 내용을 명시해야 합니다(승인기준). 제공 양식 대신 본인 수업에 맞는 개별 양식도 사용 가능합니다.')}`,
      `${esc(c)} 수업 진행 예정 주(차시)의 수업방식에 <strong>${esc(T().sampleWeekMethod)}</strong>를 표기합니다. 한 학기 수업 분량의 최소 40%(6주) 이상을 학습자중심수업으로 진행하도록 권장합니다.`);
  }

  function renderModules() {
    const kind = T().moduleKind;
    const list = data.modules[kind];
    const c = T().code;
    let title, sub;
    if (kind === 'pbl') {
      title = `2. ${c === 'IC-PBL' ? 'PBL' : 'PBL'}모듈 작성 (PBL 문제·시나리오)`;
      sub = T().minModules >= 2 ? '제작한 PBL 문제·시나리오 개수만큼 작성합니다(최소 2개 이상).' : '제작한 PBL 문제·시나리오 개수만큼 작성합니다.';
    } else if (kind === 'pjbl') {
      title = '2. PjBL모듈 작성 (PjBL 조별활동 내용)';
      sub = '프로젝트 최종 산출물 도출을 위한 조별활동 주제(내용)를 기술합니다.';
    } else {
      title = '2. FL 수업구성';
      sub = '진행할 FL 수업 수만큼 작성합니다.';
    }
    const label = kind === 'fl' ? 'FL 수업구성' : (kind === 'pbl' ? 'PBL 모듈' : 'PjBL 모듈');
    const cards = list.map((m, i) => {
      const p = `modules.${kind}.${i}`;
      let body;
      if (kind === 'pbl') {
        body = [
          row(typeKey === 'IC_PBL' ? '학습 내용과 관련된 실제적 맥락 연결' : '학습 내용', textarea(`${p}.content`, { rows: 2, placeholder: '※ 본 PBL 모듈의 학습내용 (교과목 전체 내용이 아님)' }), { req: true }),
          row('핵심 학습 목표', textarea(`${p}.goal`, { rows: 2, placeholder: '※ 본 PBL 모듈을 통해 성취하고자 하는 학습목표 (교과목 전체 목표가 아님)' }), { req: true }),
          row('PBL 문제 시나리오 제목', input(`${p}.title`), { req: true }),
          row('문제 상황 속 학습자(주인공) 역할', input(`${p}.role`), { req: true }),
          row('문제 상황 시나리오', textarea(`${p}.scenario`, { rows: 6, placeholder: '※ 해당 학습내용 및 학습목표를 반영한 실제적이고 시의성 있는 문제 상황을 기술' }), { req: true }),
        ].join('');
      } else if (kind === 'pjbl') {
        body = [
          row('프로젝트 주제', textarea(`${p}.topic`, { rows: 2, placeholder: '※ 본 PjBL 모듈의 주제 (교과목 전체 내용이 아님)' }), { req: true }),
          row('프로젝트 목표', textarea(`${p}.goal`, { rows: 2, placeholder: '※ 본 PjBL 모듈을 통해 성취하고자 하는 목표 (교과목 전체 목표가 아님)' }), { req: true }),
          row('프로젝트 소요주간', input(`${p}.weeks`, { cls: 'w-32', placeholder: '예: 3주' }), { req: true }),
          row('조별활동 내용', textarea(`${p}.activity`, { rows: 7, placeholder: '예시를 프로젝트 주제와 목표에 맞게 수정해 구체적으로 작성\n1. 조별 프로젝트 주제 정하기(토의를 통한 주제 선정, 주제망 작성 등)\n2. 조별 프로젝트 활동 계획하기(활동 계획, 개별 학습자 역할 분담 등)\n3. 프로젝트 수행하기(문헌연구, 프로젝트 수행, 산출물 자료 정리, 결과 분석 등)\n4. 프로젝트 발표하기(발표 준비, 발표, 공유 및 피드백)' }), { req: true }),
        ].join('');
      } else {
        const stageRows = FL_STAGES.map(s => {
          const checks = s.elements.map((e, ei) => {
            const path = `${p}.elements.${s.key}_${ei}`;
            return `<label class="chk"><input type="checkbox" data-path="${path}" ${getPath(path) ? 'checked' : ''}/> ${esc(e)}</label>`;
          }).join('');
          return `<tr><th>${esc(s.label)}</th><td>${checks}</td><td>${textarea(`${p}.stages.${s.key}`, { rows: 3, label: s.label + ' 교수·학습활동' })}</td></tr>`;
        }).join('');
        body = [
          row('학습내용', textarea(`${p}.content`, { rows: 2, placeholder: '※ 본 FL 모듈의 학습내용 (교과목 전체 내용이 아님)' }), { req: true }),
          row('핵심학습 목표', textarea(`${p}.goal`, { rows: 2, placeholder: '※ 본 FL 모듈을 통해 성취하고자 하는 학습목표 (교과목 전체 목표가 아님)' }), { req: true }),
          row('사전학습계획', `<div class="grid2">
              <label class="sublabel">차시${input(`${p}.pre.session`, { placeholder: '예: 4주차' })}</label>
              <label class="sublabel">수업방식${input(`${p}.pre.mode`, { placeholder: '※ 동영상, PDF자료 등' })}</label>
            </div>
            <label class="sublabel">사전학습주제${input(`${p}.pre.topic`, { placeholder: '※ 해당 차시에서 진행할 수업 주제' })}</label>
            <label class="sublabel">사전학습목표${input(`${p}.pre.objective`, { placeholder: '※ 사전학습에서 달성할 교육 목표 기재' })}</label>
            <label class="sublabel">추가자료${input(`${p}.pre.extra`, { placeholder: '※ 추가자료가 있을 경우 기재' })}</label>
            <label class="sublabel">수업내용${textarea(`${p}.pre.body`, { rows: 3 })}</label>`, { req: true }),
          `<h4 class="h4">FL 단계별 학습 활동${guess('flElements')}</h4>
           <div class="tbl-wrap"><table class="tbl">
             <thead><tr><th class="w-40">FL 단계</th><th class="w-56">학습 활동 요소 (해당 항목 체크)</th><th>교수·학습활동<br><small>(학습자료 제시형태, 학습, 문제풀이, 토론, 프로젝트, 평가 등)</small></th></tr></thead>
             <tbody>${stageRows}</tbody>
           </table></div>`,
        ].join('');
      }
      return `<div class="card module">
        <div class="card-head"><strong>${i + 1}) ${label} ${i + 1}</strong>${list.length > 1 ? `<button type="button" class="link-btn" data-action="remove-module" data-index="${i}">삭제</button>` : ''}</div>
        ${body}
      </div>`;
    }).join('');
    const slots = window.HwpxExport ? window.HwpxExport.SLOTS.modules[typeKey] : list.length;
    const warn = (list.length < T().minModules ? `<p class="warn">이 서식은 모듈을 최소 ${T().minModules}개 작성해야 합니다.</p>` : '') +
      (list.length > slots ? `<p class="warn">hwpx 서식에는 ${label} 칸이 ${slots}개뿐이라 ${slots + 1}번째부터는 내려받은 파일에 들어가지 않습니다. 한글에서 표를 복사해 붙여 넣어 주세요.</p>` : '');
    return section('sec-modules', title + guess('modules'), warn + cards + `<button type="button" class="add-btn" data-action="add-module">+ ${label} 추가</button>`, sub);
  }

  function renderChecklist() {
    const items = T().checklist;
    const base = `checklist.${typeKey}`;
    let last = null;
    return section('sec-check', `학습자중심수업(${esc(T().code)}) 진단 체크리스트` + guess('checklist'),
      `<div class="tbl-wrap"><table class="tbl">
        <thead><tr><th class="w-40">평가항목</th><th>문항</th><th class="w-32">진단여부</th></tr></thead>
        <tbody>${items.map((it, i) => {
          const g = it.group !== last ? esc(it.group) : '';
          last = it.group;
          return `<tr><td class="cat ${g ? '' : 'cont'}">${g}</td><td>${esc(it.q)}</td><td>${radios(`${base}.${i}`, ['예', '아니오'], it.q)}</td></tr>`;
        }).join('')}</tbody>
      </table></div>`,
      '제출 전 준비사항을 미리 점검해 부실한 수업 운영을 사전에 방지하기 위한 자가 진단입니다.');
  }

  // ---------- 전체 화면 ----------
  const NAV = [
    ['sec-overview', 'Ⅰ. 개요'], ['sec-applicant', '신청자'], ['sec-basic', '가. 기본정보'], ['sec-eval', '나. 평가'],
    ['sec-interaction', '다. 상호작용'], ['sec-weeks', '라. 진행계획'], ['sec-modules', '2. 모듈'], ['sec-check', '진단'],
  ];

  function renderForm(key) {
    typeKey = key;
    const app = document.getElementById('app-content');
    document.getElementById('progress-container').classList.add('hidden');
    document.querySelector('main').classList.add('wide');
    const t = T();
    app.innerHTML = `
      <div class="fade-in form-root">
        <div class="form-top">
          <div>
            <span class="type-pill">${esc(t.code)}</span>
            <h2 class="form-title">학습자중심수업 개발 및 운영계획서</h2>
            <p class="form-subtitle">${esc(t.file)} 기준 · 입력 내용은 이 브라우저에 자동 저장됩니다.</p>
          </div>
          <div class="form-actions">
            <label class="sr-only" for="type-switch">유형 바꾸기</label>
            <select id="type-switch" class="inp w-auto">${Object.entries(FORM_TYPES).map(([k, v]) => `<option value="${k}" ${k === key ? 'selected' : ''}>서식${v.formNo} ${esc(v.code)}</option>`).join('')}</select>
            <button type="button" class="btn-ghost" data-action="back-explorer">← 유형 탐색</button>
          </div>
        </div>

        <div class="guess-legend"><span class="guess">추정</span> 표시는 원본 서식에서 바로 읽히지 않아 웹 입력용으로 추정·보완한 부분입니다. 표시에 마우스를 올리거나 누르면 이유가 보입니다.</div>

        <nav class="form-nav" aria-label="신청서 목차">${NAV.map(([id, l]) => `<a href="#${id}" data-nav="${id}">${l}</a>`).join('')}</nav>

        <div class="fill-meter"><div class="fill-bar"><div id="fill-bar" style="width:0%"></div></div><span id="fill-text">작성률 0%</span></div>

        <form id="app-form" onsubmit="return false" novalidate>
          ${renderOverview()}
          ${renderApplicants()}
          ${renderBasic()}
          ${renderEval()}
          ${renderInteraction()}
          ${renderWeeks()}
          ${renderModules()}
          ${renderChecklist()}
        </form>

        <div class="form-footer">
          <span id="save-status" class="save-status">이 브라우저에 자동 저장됩니다.</span>
          <div class="form-footer-btns">
            <button type="button" class="btn-ghost" data-action="export-json">JSON 내보내기</button>
            <label class="btn-ghost cursor-pointer">JSON 불러오기<input type="file" accept="application/json,.json" id="import-json" class="hidden"/></label>
            <button type="button" class="btn-ghost danger" data-action="reset">모두 지우기</button>
            <button type="button" class="btn-primary" data-action="preview">초안 미리보기</button>
            <button type="button" class="btn-primary" data-action="download-hwpx">hwpx 내려받기</button>
          </div>
        </div>
      </div>`;
    updateComputed();
    window.scrollTo({ top: 0 });
  }

  function rerender() {
    const y = window.scrollY;
    renderForm(typeKey);
    window.scrollTo({ top: y });
  }

  // ---------- 계산 표시 ----------
  const num = v => (v === '' || v == null || isNaN(+v) ? 0 : +v);

  function paintSum(id, total) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = total;
    el.classList.toggle('ok', total === 100);
    el.classList.toggle('bad', total !== 100 && total !== 0);
  }

  function lcWeekCount() {
    const t = T();
    const keys = [t.code, t.sampleWeekMethod, t.code.replace('IC-', '')].map(s => s.toLowerCase());
    return data.weeks.filter(w => {
      const m = (w.method || '').toLowerCase();
      return m && keys.some(k => m.includes(k));
    }).length;
  }

  function fillRatio() {
    const t = T();
    const ov = data.overview;
    const req = [ov.courseType, ov.grade, ov.size, ov.mode, ov.split, ov.dept, ov.nameKo, ov.credit, ov.objective, ov.need1, ov.need2, ov.need3, ov.need4,
      data.applicants[0].name, data.applicants[0].affil, data.applicants[0].email, data.consent,
      data.basic.purpose, data.basic.method, data.basic.participation, data.basic.team];
    if (t.ic) req.push(data.basic.ic);
    let filled = req.filter(v => String(v || '').trim()).length;
    let total = req.length;
    // 평가 2개, 진행계획(6주 이상), 상호작용, 모듈, 체크리스트
    const ovSum = Object.values(data.evalOverall).reduce((a, b) => a + num(b), 0);
    const dSum = (data.evalDetail[typeKey] || []).reduce((a, r) => a + num(r && r.pct), 0);
    total += 6;
    if (ovSum === 100) filled++;
    if (dSum === 100) filled++;
    if (lcWeekCount() >= 6) filled++;
    if (data.interactions.tl.some(r => r.method.trim()) && data.interactions.ll.some(r => r.method.trim())) filled++;
    const mods = data.modules[t.moduleKind];
    const modOk = mods.length >= t.minModules && mods.every(m => Object.values(m).some(v => typeof v === 'string' && v.trim()));
    if (modOk) filled++;
    const ck = data.checklist[typeKey] || [];
    if (t.checklist.every((_, i) => ck[i])) filled++;
    return Math.round((filled / total) * 100);
  }

  function updateComputed() {
    paintSum('sum-overall', Object.values(data.evalOverall).reduce((a, b) => a + num(b), 0));
    paintSum('sum-detail', (data.evalDetail[typeKey] || []).reduce((a, r) => a + num(r && r.pct), 0));
    const lc = document.getElementById('lc-counter');
    if (lc) {
      const n = lcWeekCount();
      lc.innerHTML = `학습자중심(${esc(T().sampleWeekMethod)}) 주차: <strong>${n}주</strong> / 권장 6주 이상 ${n >= 6 ? '<span class="ok-badge">충족</span>' : '<span class="bad-badge">부족</span>'}`;
    }
    const r = fillRatio();
    const bar = document.getElementById('fill-bar');
    if (bar) bar.style.width = r + '%';
    const ft = document.getElementById('fill-text');
    if (ft) ft.textContent = `작성률 ${r}%`;
    document.querySelectorAll('[data-show-when]').forEach(el => {
      const rule = el.getAttribute('data-show-when');
      const neg = rule.includes('!=');
      const [p, v] = rule.split(neg ? '!=' : '=');
      const cur = getPath(p) || '';
      el.classList.toggle('hidden', neg ? !cur || cur === v : cur !== v);
    });
  }

  // ---------- 미리보기 ----------
  function nl(s) { return esc(s).replace(/\n/g, '<br>'); }
  function val(s) { return s && String(s).trim() ? nl(s) : '<span class="empty">(미작성)</span>'; }

  function buildPreview() {
    const t = T(), ov = data.overview, b = data.basic;
    const pick = (cur, opts) => opts.map(o => `${cur === o ? '■' : '□'} ${o}`).join('&nbsp;&nbsp;');
    const sizeTxt = pick(ov.size, ['10명~20명', '21명~30명', '30명 초과']) + (ov.size === '30명 초과' && ov.sizeOver ? ` (${esc(ov.sizeOver)}명)` : '');
    const modeTxt = pick(ov.mode, ['단독', '코티칭', '팀티칭']) + (ov.mode && ov.mode !== '단독' && ov.modeCount ? ` (${esc(ov.modeCount)}명)` : '');
    const splitTxt = pick(ov.split, ['예', '아니오']) + (ov.split === '예' && ov.splitCount ? ` (${esc(ov.splitCount)}개 분반)` : '');
    const exTxt = pick(ov.exempt, ['예', '아니오']) + (ov.exempt === '예' ? ` (${esc(ov.exemptYear)}학년도 ${esc(ov.exemptTerm)}학기)` : '');
    const evRows = t.evalRows.map((r, i) => {
      const d = (data.evalDetail[typeKey] || [])[i] || {};
      return `<tr><td>${esc(r.cat)}</td><td>${esc(r.editable ? d.item || '' : r.item)}</td><td>${esc(r.editable || r.whoEditable ? d.who || '' : r.who)}</td><td class="c">${esc(d.pct || '')}</td></tr>`;
    }).join('');
    const inter = key => data.interactions[key].map(r => `<tr><td>${esc(r.session)}</td><td>${nl(r.method)}</td><td>${esc(r.media)}</td></tr>`).join('');
    const mods = data.modules[t.moduleKind].map((m, i) => {
      if (t.moduleKind === 'pbl') return `<h4>${i + 1}) PBL 모듈 ${i + 1}</h4><table><tr><th>${typeKey === 'IC_PBL' ? '학습 내용과 관련된 실제적 맥락 연결' : '학습 내용'}</th><td>${val(m.content)}</td></tr><tr><th>핵심 학습 목표</th><td>${val(m.goal)}</td></tr><tr><th rowspan="3">문제 상황 시나리오</th><td>PBL 문제 시나리오 제목: ${val(m.title)}</td></tr><tr><td>문제 상황 속 학습자(주인공) 역할: ${val(m.role)}</td></tr><tr><td>${val(m.scenario)}</td></tr></table>`;
      if (t.moduleKind === 'pjbl') return `<h4>${i + 1}) PjBL 모듈 ${i + 1}</h4><table><tr><th>프로젝트 주제</th><td>${val(m.topic)}</td></tr><tr><th>프로젝트 목표</th><td>${val(m.goal)}</td></tr><tr><th>프로젝트 소요주간</th><td>${val(m.weeks)}</td></tr><tr><th>조별활동 내용</th><td>${val(m.activity)}</td></tr></table>`;
      const st = FL_STAGES.map(s => `<tr><th>${esc(s.label)}</th><td>${s.elements.map((e, ei) => `${m.elements[`${s.key}_${ei}`] ? '☑' : '☐'} ${esc(e)}`).join('<br>')}</td><td>${val(m.stages[s.key])}</td></tr>`).join('');
      return `<h4>${i + 1}) FL 수업구성 ${i + 1}</h4><table><tr><th>학습내용</th><td colspan="2">${val(m.content)}</td></tr><tr><th>핵심학습 목표</th><td colspan="2">${val(m.goal)}</td></tr>
        <tr><th>사전학습계획</th><td colspan="2">차시: ${val(m.pre.session)} / 수업방식: ${val(m.pre.mode)}<br>사전학습주제: ${val(m.pre.topic)}<br>사전학습목표: ${val(m.pre.objective)}<br>추가자료: ${val(m.pre.extra)}<br>수업내용: ${val(m.pre.body)}</td></tr>
        <tr><th>FL 단계</th><th>학습 활동 요소</th><th>교수·학습활동</th></tr>${st}</table>`;
    }).join('');
    const ck = data.checklist[typeKey] || [];
    return `
      <h1>2026학년도 2학기 학습자중심수업 개발 및 운영 계획서(${esc(t.code)}용_${esc(t.name)})</h1>
      <h2>Ⅰ. 개요</h2>
      <table>
        <tr><th>교과유형</th><td>${pick(ov.courseType, ['전공필수', '전공선택', '교양'])}</td></tr>
        <tr><th>수강학년</th><td>${pick(ov.grade, ['1학년', '2학년', '3학년', '4학년'])}</td></tr>
        <tr><th>수강규모</th><td>${sizeTxt}</td></tr>
        <tr><th>운영형태</th><td>${modeTxt}</td></tr>
        <tr><th>분반여부</th><td>${splitTxt}</td></tr>
        <tr><th>개설학과(부)(전공)</th><td>${val(ov.dept)} &nbsp;/&nbsp; 학수번호: ${val(ov.courseNo)}</td></tr>
        <tr><th>교과목명</th><td>(국문) ${val(ov.nameKo)}<br>(영문) ${val(ov.nameEn)}<br>학점-강의-실습: ${esc(ov.credit || '')}-${esc(ov.lecture || '')}-${esc(ov.practice || '')}</td></tr>
        <tr><th>개설심의 제외 교과목 여부</th><td>${exTxt}</td></tr>
        <tr><th>구분</th><td>${esc(t.fullTitle)}</td></tr>
        <tr><th>전용강의실 사용</th><td>${pick(ov.room, ['예', '아니오'])}</td></tr>
        <tr><th>수업목표</th><td>${val(ov.objective)}</td></tr>
        <tr><th>교과목 개설 필요성</th><td>1. ${esc(t.code)}교과목으로서의 특징<br>${val(ov.need1)}<br>2. 전공특성(필요성)<br>${val(ov.need2)}<br>3. 학습자특성<br>${val(ov.need3)}<br>4. 기대효과<br>${val(ov.need4)}</td></tr>
      </table>
      <h3>신청자 정보</h3>
      <table>${data.applicants.map(a => `<tr><th>성명</th><td>${val(a.name)} (서명)</td></tr><tr><th>소속</th><td>${val(a.affil)}</td></tr><tr><th>Tel</th><td>연구실: ${esc(a.office)} &nbsp; 핸드폰: ${esc(a.mobile)}</td></tr><tr><th>e-mail</th><td>${val(a.email)}</td></tr>`).join('')}</table>
      <p>※ 개인정보수집활용 동의(필수): ${pick(data.consent, ['동의함', '동의하지 않음'])}</p>

      <h2>Ⅱ. 세부운영계획서</h2>
      <h3>1. 수업 계획 세부 내용</h3>
      <h4>가. 기본정보</h4>
      <table>
        <tr><th>${esc(t.code)} 도입 필요성 및 목적</th><td>${val(b.purpose)}</td></tr>
        ${t.ic ? `<tr><th>현장연계(IC) 계획</th><td>${val(b.ic)}</td></tr>` : ''}
        <tr><th>수업방식</th><td>${val(b.method)}</td></tr>
        <tr><th>학습자 개인별 참여 방안</th><td>${val(b.participation)}</td></tr>
        <tr><th>역할 배정 및 팀 구성 방법</th><td>${val(b.team)}</td></tr>
      </table>
      <h4>나. 평가 계획</h4>
      <table><tr><th>평가항목</th><th>중간</th><th>기말</th><th>출석</th><th>수시</th><th>기타</th><th>총합</th></tr>
        <tr><th>비율(%)</th>${['mid', 'final', 'attend', 'quiz', 'etc'].map(k => `<td class="c">${esc(data.evalOverall[k])}</td>`).join('')}<td class="c">${Object.values(data.evalOverall).reduce((a, v) => a + num(v), 0)}</td></tr></table>
      <p>- ${esc(t.code)} 수업 평가 계획</p>
      <table><tr><th>평가항목</th><th>세부항목</th><th>평가자</th><th>비율(%)</th></tr>${evRows}
        <tr><th colspan="3">총합</th><td class="c">${(data.evalDetail[typeKey] || []).reduce((a, r) => a + num(r && r.pct), 0)}</td></tr></table>
      <h4>다. 상호작용 및 피드백 계획</h4>
      <p>${t.ic ? '교수자/기업 담당자·학습자' : '교수자·학습자'} 상호작용 및 피드백 방안</p>
      <table><tr><th>차시</th><th>방법</th><th>활용 매체</th></tr>${inter('tl')}</table>
      <p>학습자·학습자 상호작용 및 피드백 방안</p>
      <table><tr><th>차시</th><th>방법</th><th>활용 매체</th></tr>${inter('ll')}</table>
      <h4>라. 수업 진행 계획</h4>
      <table><tr><th>주차</th><th>수업 내용</th><th>수업방식</th><th>세부내용</th></tr>
        ${data.weeks.map((w, i) => `<tr><td class="c">${i + 1}</td><td>${nl(w.content)}</td><td class="c">${esc(w.method)}</td><td>${nl(w.detail)}</td></tr>`).join('')}</table>
      <h3>2. ${t.moduleKind === 'fl' ? 'FL 수업구성' : t.moduleKind === 'pbl' ? 'PBL모듈 작성(PBL 문제·시나리오)' : 'PjBL모듈 작성(PjBL 조별활동 내용)'}</h3>
      ${mods}
      <h2>학습자중심수업(${esc(t.code)}) 진단 체크리스트</h2>
      <table><tr><th>평가항목</th><th>문항</th><th>예</th><th>아니오</th></tr>
        ${t.checklist.map((it, i) => `<tr><td>${esc(it.group)}</td><td>${esc(it.q)}</td><td class="c">${ck[i] === '예' ? '○' : ''}</td><td class="c">${ck[i] === '아니오' ? '○' : ''}</td></tr>`).join('')}</table>
      <p>위와 같이 학습자중심수업(${esc(t.code)}) 점검사항을 확인하였습니다.</p>
      <p class="r">년 &nbsp;&nbsp; 월 &nbsp;&nbsp; 일<br>교수자 ${esc(data.applicants[0].name)} (서명 또는 인)</p>
      <p><strong>교육혁신처장 귀하</strong></p>`;
  }

  function openPreview() {
    const modal = document.getElementById('preview-modal');
    document.getElementById('preview-body').innerHTML = buildPreview();
    modal.classList.remove('hidden');
    document.body.classList.add('previewing');
  }
  function closePreview() {
    document.getElementById('preview-modal').classList.add('hidden');
    document.body.classList.remove('previewing');
  }

  // ---------- 이벤트 ----------
  function onInput(e) {
    const el = e.target;
    const path = el.getAttribute && el.getAttribute('data-path');
    if (!path) return;
    let v;
    if (el.type === 'checkbox') v = el.checked;
    else v = el.value;
    setPath(path, v);
    save();
    updateComputed();
  }

  function onClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
      const g = e.target.closest('.guess');
      if (g && g.dataset.note) showToast(g.dataset.note);
      return;
    }
    const a = btn.dataset.action;
    const i = +btn.dataset.index;
    const kind = typeKey && T().moduleKind;
    switch (a) {
      case 'add-applicant': data.applicants.push({ name: '', affil: '', office: '', mobile: '', email: '' }); break;
      case 'remove-applicant': data.applicants.splice(i, 1); break;
      case 'add-interaction': data.interactions[btn.dataset.key].push({ session: '', method: '', media: '' }); break;
      case 'remove-interaction': data.interactions[btn.dataset.key].splice(i, 1); break;
      case 'add-module': data.modules[kind].push(emptyModule(kind)); break;
      case 'remove-module':
        if (!confirmSoft(btn, '이 모듈의 내용을 삭제할까요? 한 번 더 누르면 삭제됩니다.')) return;
        data.modules[kind].splice(i, 1); break;
      case 'back-explorer': backToExplorer(); return;
      case 'preview': openPreview(); return;
      case 'close-preview': closePreview(); return;
      case 'print-preview': window.print(); return;
      case 'download-hwpx': downloadHwpx(btn); return;
      case 'export-json': exportJson(); return;
      case 'reset':
        if (!confirmSoft(btn, '입력한 내용을 모두 지웁니다. 한 번 더 누르면 지워집니다.')) return;
        data = emptyData(); save(); rerender(); showToast('입력 내용을 모두 지웠습니다.'); return;
      default: return;
    }
    save();
    rerender();
  }

  // 브라우저 확인창(confirm) 대신 두 번 누르기 확인
  function confirmSoft(btn, msg) {
    if (btn.dataset.armed === '1') return true;
    btn.dataset.armed = '1';
    const old = btn.textContent;
    btn.textContent = '한 번 더 누르면 실행';
    showToast(msg);
    setTimeout(() => { btn.dataset.armed = ''; btn.textContent = old; }, 3000);
    return false;
  }

  let toastTimer = null;
  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 4000);
  }

  async function downloadHwpx(btn) {
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = '만드는 중…';
    try {
      const notes = await window.HwpxExport.download(typeKey, data);
      showToast(notes.length ? 'hwpx를 내려받았습니다. ' + notes.join(' ') : 'hwpx를 내려받았습니다. 한글에서 열어 확인해 주세요.');
    } catch (e) {
      showToast('hwpx를 만들지 못했습니다. ' + (e && e.message ? e.message : ''));
    } finally {
      btn.disabled = false;
      btn.textContent = old;
    }
  }

  function exportJson() {
    const t = T();
    const blob = new Blob([JSON.stringify({ app: 'lcc-application', version: 1, type: typeKey, data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const name = (data.overview.nameKo || '신청서').replace(/[\\/:*?"<>|]/g, '');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}_${t.code}_초안.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importJson(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result);
        if (!obj || !obj.data) throw new Error('형식');
        data = deepMerge(emptyData(), obj.data);
        if (obj.type && FORM_TYPES[obj.type]) typeKey = obj.type;
        save(); rerender(); showToast('불러왔습니다.');
      } catch (e) { showToast('이 파일은 불러올 수 없습니다. 이 웹앱에서 내보낸 JSON인지 확인해 주세요.'); }
    };
    r.readAsText(file);
  }

  function backToExplorer() {
    document.querySelector('main').classList.remove('wide');
    window.renderStart();
  }

  function onChange(e) {
    if (e.target.id === 'type-switch') { save(); renderForm(e.target.value); try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: typeKey, data })); } catch (_) {} return; }
    if (e.target.id === 'import-json' && e.target.files[0]) { importJson(e.target.files[0]); return; }
    onInput(e);
  }

  document.addEventListener('input', e => { if (e.target.closest('#app-form')) onInput(e); });
  document.addEventListener('change', e => { if (e.target.closest('#app-content') || e.target.closest('#app-form')) onChange(e); });
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePreview(); });

  load();

  // 탐색기에서 쓰는 진입점
  window.openApplicationForm = function (key) { renderForm(key); };
  window.getCurrentDraft = function () { return { type: typeKey, data }; };
  window.getSavedDraftType = function () {
    try { const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); return s && s.type; } catch (e) { return null; }
  };
})();
