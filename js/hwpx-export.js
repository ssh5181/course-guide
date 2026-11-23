/*
 * 입력값을 서식별 hwpx 템플릿(templates/form-*.hwpx)에 채워 내려받기
 *
 * 템플릿 규칙 (/mnt/project-files/hwpx-templates/README.md)
 * - 글 칸: section*.xml 안의 {{key}} 를 값으로 바꾼다(XML 이스케이프). 줄바꿈은 </hp:t><hp:lineBreak/><hp:t>
 * - 선택 칸: <hp:checkBtn name="key" value="CHECKED|UNCHECKED"> 의 value 를 바꾼다
 * - 진단 체크리스트: {{c1y}}/{{c1n}} … 에 "V"
 * - 값이 없는 {{key}} 는 빈 문자열로 지운다
 */
(function () {
  const TEMPLATE_FILE = { PBL: 'PBL', PJBL: 'PjBL', FL: 'FL', IC_PBL: 'IC-PBL', IC_PJBL: 'IC-PjBL' };

  // 템플릿에 들어가는 칸 수 (표를 늘릴 수 없는 부분)
  const SLOTS = {
    applicants: 1,
    interactions: 2,
    modules: { PBL: 2, PJBL: 1, FL: 1, IC_PBL: 1, IC_PJBL: 1 },
  };

  // 세부 평가표 행 → 템플릿 행 번호 (PBL 서식만 2행이 병합돼 r2가 없음)
  const EVAL_ROW_NO = {
    PBL: [1, 3, 4, 5, 6, 7, 8, 9],
    default: [1, 2, 3, 4, 5, 6, 7, 8],
  };

  // FL 단계별 활동 요소 체크박스 이름 (FL_STAGES 순서와 같음)
  const FL_ELEMENT_KEYS = {
    pre: ['m1_o_pre_study', 'm1_o_pre_quiz', 'm1_o_pre_note'],
    intro: ['m1_o_in_ready', 'm1_o_in_mini'],
    dev: ['m1_o_in_deep', 'm1_o_in_indiv', 'm1_o_in_team'],
    close: ['m1_o_in_feedback', 'm1_o_in_review'],
    post: ['m1_o_post_task', 'm1_o_post_reflect', 'm1_o_post_portfolio'],
  };
  const FL_STAGE_TEXT_KEYS = { pre: 'm1_pre_eval', intro: 'm1_in_intro', dev: 'm1_in_main', close: 'm1_in_wrap', post: 'm1_post' };

  const s = v => (v == null ? '' : String(v));
  const joinLines = list => list.map(s).filter(x => x.trim()).join('\n');

  // 템플릿 칸 수보다 많이 입력한 행은 마지막 칸에 줄바꿈으로 이어 붙인다
  function foldRows(rows, slots, fields) {
    const out = rows.slice(0, slots).map(r => ({ ...r }));
    while (out.length < slots) out.push({});
    for (const extra of rows.slice(slots)) {
      const last = out[slots - 1];
      for (const f of fields) last[f] = joinLines([last[f], extra[f]]);
    }
    return out;
  }

  function buildValues(typeKey, data) {
    const t = FORM_TYPES[typeKey];
    const ov = data.overview;
    const v = {};
    const pick = (cur, map) => { for (const [label, key] of Object.entries(map)) v[key] = cur === label; };

    // Ⅰ. 개요
    pick(ov.courseType, { '전공필수': 'o_type_major_req', '전공선택': 'o_type_major_elec', '교양': 'o_type_general' });
    pick(ov.grade, { '1학년': 'o_grade_1', '2학년': 'o_grade_2', '3학년': 'o_grade_3', '4학년': 'o_grade_4' });
    pick(ov.size, { '10명~20명': 'o_size_10_20', '21명~30명': 'o_size_21_30', '30명 초과': 'o_size_over30' });
    v.size_over30_n = ov.size === '30명 초과' ? s(ov.sizeOver) : '';
    pick(ov.mode, { '단독': 'o_op_single', '코티칭': 'o_op_co', '팀티칭': 'o_op_team' });
    v.op_co_n = ov.mode === '코티칭' ? s(ov.modeCount) : '';
    v.op_team_n = ov.mode === '팀티칭' ? s(ov.modeCount) : '';
    pick(ov.split, { '예': 'o_split_yes', '아니오': 'o_split_no' });
    v.split_n = ov.split === '예' ? s(ov.splitCount) : '';
    v.dept = s(ov.dept);
    v.course_code = s(ov.courseNo);
    v.course_name_ko = s(ov.nameKo);
    v.course_name_en = s(ov.nameEn);
    v.credit = s(ov.credit);
    v.hours_lecture = s(ov.lecture);
    v.hours_practice = s(ov.practice);
    pick(ov.exempt, { '예': 'o_exempt_yes', '아니오': 'o_exempt_no' });
    v.exempt_year = ov.exempt === '예' ? s(ov.exemptYear) : '';
    v.exempt_term = ov.exempt === '예' ? s(ov.exemptTerm) : '';
    v.o_kind = true;
    pick(ov.room, { '예': 'o_room_yes', '아니오': 'o_room_no' });
    v.objective = s(ov.objective);
    v.need_feature = s(ov.need1);
    v.need_major = s(ov.need2);
    v.need_learner = s(ov.need3);
    v.need_effect = s(ov.need4);

    // 신청자: 칸이 하나라 여러 명이면 각 칸에 줄을 바꿔 차례로 적는다
    const ap = data.applicants.filter(a => Object.values(a).some(x => s(x).trim()));
    v.applicant_name = joinLines(ap.map(a => a.name));
    v.applicant_affil = joinLines(ap.map(a => a.affil));
    v.tel_office = joinLines(ap.map(a => a.office));
    v.tel_mobile = joinLines(ap.map(a => a.mobile));
    v.email = joinLines(ap.map(a => a.email));
    pick(data.consent, { '동의함': 'o_consent_yes', '동의하지 않음': 'o_consent_no' });

    // Ⅱ. 가. 기본정보
    const b = data.basic;
    v.intro_need = s(b.purpose);
    if (t.ic) v.ic_plan = s(b.ic);
    v.method = s(b.method);
    v.participation = s(b.participation);
    v.team_building = s(b.team);

    // 나. 평가
    const eo = data.evalOverall;
    Object.assign(v, { eval_mid: s(eo.mid), eval_final: s(eo.final), eval_attend: s(eo.attend), eval_quiz: s(eo.quiz), eval_etc: s(eo.etc) });
    const rowNo = EVAL_ROW_NO[typeKey] || EVAL_ROW_NO.default;
    const detail = data.evalDetail[typeKey] || [];
    t.evalRows.forEach((r, i) => {
      const d = detail[i] || {};
      const n = rowNo[i];
      v[`eval_r${n}_pct`] = s(d.pct);
      if (r.editable) v[`eval_r${n}_item`] = s(d.item);
      if (r.editable || r.whoEditable) v[`eval_r${n}_rater`] = s(d.who);
    });

    // 다. 상호작용 (템플릿 2행)
    for (const [key, prefix] of [['tl', 'ti'], ['ll', 'll']]) {
      foldRows(data.interactions[key], SLOTS.interactions, ['session', 'method', 'media']).forEach((r, i) => {
        v[`${prefix}_session_${i + 1}`] = s(r.session);
        v[`${prefix}_method_${i + 1}`] = s(r.method);
        v[`${prefix}_media_${i + 1}`] = s(r.media);
      });
    }

    // 라. 15주 진행표
    data.weeks.forEach((w, i) => {
      v[`w${i + 1}_content`] = s(w.content);
      v[`w${i + 1}_mode`] = s(w.method);
      v[`w${i + 1}_detail`] = s(w.detail);
    });

    // 2. 모듈 (템플릿에 있는 개수만)
    const mods = data.modules[t.moduleKind].slice(0, SLOTS.modules[typeKey]);
    mods.forEach((m, i) => {
      const p = `m${i + 1}_`;
      if (t.moduleKind === 'pbl') {
        Object.assign(v, { [p + 'content']: s(m.content), [p + 'objective']: s(m.goal), [p + 'scenario_title']: s(m.title), [p + 'learner_role']: s(m.role), [p + 'scenario']: s(m.scenario) });
      } else if (t.moduleKind === 'pjbl') {
        Object.assign(v, { [p + 'topic']: s(m.topic), [p + 'goal']: s(m.goal), [p + 'weeks']: s(m.weeks), [p + 'team_activity']: s(m.activity) });
      } else {
        Object.assign(v, {
          m1_content: s(m.content), m1_objective: s(m.goal),
          m1_pre_session: s(m.pre.session), m1_pre_mode: s(m.pre.mode), m1_pre_topic: s(m.pre.topic),
          m1_pre_goal: s(m.pre.objective), m1_pre_extra: s(m.pre.extra), m1_pre_body: s(m.pre.body),
        });
        for (const [stage, keys] of Object.entries(FL_ELEMENT_KEYS)) keys.forEach((k, ei) => { v[k] = !!(m.elements && m.elements[`${stage}_${ei}`]); });
        for (const [stage, k] of Object.entries(FL_STAGE_TEXT_KEYS)) v[k] = s(m.stages && m.stages[stage]);
      }
    });

    // 진단 체크리스트
    const ck = data.checklist[typeKey] || [];
    t.checklist.forEach((_, i) => {
      v[`c${i + 1}y`] = ck[i] === '예' ? 'V' : '';
      v[`c${i + 1}n`] = ck[i] === '아니오' ? 'V' : '';
    });

    // 서명란: 작성일은 내려받는 날, 이름은 첫 번째 신청자
    const now = new Date();
    v.sign_year = String(now.getFullYear());
    v.sign_month = String(now.getMonth() + 1);
    v.sign_day = String(now.getDate());
    v.sign_name = s(ap[0] && ap[0].name);
    return v;
  }

  const xmlEscape = str => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // 값을 넣는 문단의 줄 배치 캐시(linesegarray)를 지워 한글이 열 때 다시 계산하게 한다.
  // 캐시를 그대로 두면 원래 빈 칸 기준의 줄 배치가 남아 여러 줄 값이 겹쳐 보일 수 있다.
  const STALE_LAYOUT = /(\{\{[A-Za-z0-9_]+\}\}(?:(?!\{\{|<hp:linesegarray)[\s\S])*)<hp:linesegarray>[\s\S]*?<\/hp:linesegarray>/g;

  function fillSection(xml, values) {
    xml = xml.replace(STALE_LAYOUT, '$1');
    xml = xml.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (_, key) => {
      let val = values[key];
      if (typeof val === 'boolean') val = val ? 'V' : '';
      return s(val).replace(/\r\n?/g, '\n').split('\n').map(xmlEscape).join('</hp:t><hp:lineBreak/><hp:t>');
    });
    xml = xml.replace(/<hp:checkBtn [^>]*>/g, tag => {
      const m = tag.match(/name="([^"]*)"/);
      if (!m || !(m[1] in values)) return tag;
      return tag.replace(/value="[A-Z]+"/, `value="${values[m[1]] ? 'CHECKED' : 'UNCHECKED'}"`);
    });
    return xml;
  }

  async function buildHwpx(typeKey, data) {
    if (typeof JSZip === 'undefined') throw new Error('압축 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.');
    const res = await fetch(`./templates/form-${TEMPLATE_FILE[typeKey]}.hwpx`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`서식 파일을 불러오지 못했습니다 (${res.status}).`);
    const src = await JSZip.loadAsync(await res.arrayBuffer());
    const values = buildValues(typeKey, data);
    const out = new JSZip();
    // 원래 순서를 지키고 mimetype 은 압축하지 않는다(hwpx 규칙)
    for (const name of Object.keys(src.files)) {
      const entry = src.files[name];
      if (entry.dir) continue;
      if (/^Contents\/section\d+\.xml$/.test(name)) {
        out.file(name, fillSection(await entry.async('string'), values), { compression: 'DEFLATE' });
      } else {
        out.file(name, await entry.async('uint8array'), { compression: name === 'mimetype' ? 'STORE' : 'DEFLATE' });
      }
    }
    return out.generateAsync({ type: 'blob', mimeType: 'application/hwp+zip' });
  }

  // 템플릿 칸보다 많이 입력해 일부가 합쳐지거나 빠지는 부분 안내
  function overflowNotes(typeKey, data) {
    const t = FORM_TYPES[typeKey];
    const notes = [];
    const apN = data.applicants.filter(a => Object.values(a).some(x => s(x).trim())).length;
    if (apN > SLOTS.applicants) notes.push(`신청자 ${apN}명은 한 칸에 줄을 바꿔 적었습니다.`);
    for (const [key, label] of [['tl', '교수자·학습자 상호작용'], ['ll', '학습자·학습자 상호작용']]) {
      if (data.interactions[key].length > SLOTS.interactions) notes.push(`${label} 3행부터는 2행 칸에 이어 적었습니다.`);
    }
    const mods = data.modules[t.moduleKind];
    const slot = SLOTS.modules[typeKey];
    if (mods.length > slot) notes.push(`서식에는 모듈 칸이 ${slot}개라 ${slot + 1}번째 모듈부터는 들어가지 않았습니다. 한글에서 모듈 표를 복사해 붙여 넣어 주세요.`);
    return notes;
  }

  async function download(typeKey, data) {
    const blob = await buildHwpx(typeKey, data);
    const t = FORM_TYPES[typeKey];
    const name = (s(data.overview.nameKo).trim() || '교과목명').replace(/[\\/:*?"<>|]/g, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `[서식${t.formNo}] 학습자중심수업 개발 및 운영계획서(${t.code})_${name}.hwpx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    return overflowNotes(typeKey, data);
  }

  window.HwpxExport = { buildValues, fillSection, buildHwpx, download, overflowNotes, SLOTS };
})();
