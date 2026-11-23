/*
 * 학습자중심수업 개발 및 운영계획서(서식1~5) 항목 정의
 * 출처: Drive "[서식] 신청서" 폴더의 서식1(PBL)·2(PjBL)·3(FL)·4(IC-PBL)·5(IC-PjBL) .hwp
 *
 * guess: 원본 서식에서 바로 읽히지 않아 웹 입력용으로 추정·보완한 부분.
 *        화면에 '추정' 표시가 붙고, 마우스를 올리면 이유가 보입니다.
 */

// 공통 진단 체크리스트 앞부분(모든 서식 동일)
const CHECK_COMMON_HEAD = [
  { group: '학습자중심수업 구성 비율', q: '교과목이 최소 40%(6주) 이상을 학습자중심수업으로 진행되는가' },
  { group: '강좌개설의 필요성', q: '전공 특성, 교과목 특성, 학습자 특성 등 강좌 개설의 필요성이 명시되어 있는가' },
  { group: '수업설계의 구체성 및 체계성', q: '수업계획의 기본정보가 구체적으로 구성되어 있는가' },
  { group: '수업설계의 구체성 및 체계성', q: '평가계획이 구체적으로 구성되어 있는가' },
  { group: '수업설계의 구체성 및 체계성', q: '수업 진행계획이 체계적으로 구성되어 있는가' },
];

const CHECK_REALIZE = [
  { group: '학습자중심수업 실현성', q: '교실수업에서 학습자들의 개인별 참여 방안이 명시되어 있는가' },
  { group: '학습자중심수업 실현성', q: '교수자·학습자 혹은 학습자 상호 간의 상호작용 및 피드백 방안이 명시되어 있는가' },
];

const CHECK_PBL = [
  '문제로부터 학습이 시작되는가',
  '문제는 학습목표와 관련된 개념과 원리를 다루고 있는가',
  '문제해결을 위해 문제를 분석하고 정보를 찾고 계획하는 과정이 필요한가',
  '문제해결을 위한 탐색방법이 다양한가',
  '문제해결에 활용되는 자료가 현실적인가',
  '학습자의 수준에 적절한가',
  '협동이 필요한 문제인가',
].map(q => ({ group: '학습자중심수업 점검', q }));

const CHECK_PJBL = [
  '프로젝트가 실제 상황이나 현장 문제를 기반으로 시작되는가',
  '프로젝트 목표가 교과목 학습목표와 관련된 개념과 원리를 포함하고 있는가',
  '프로젝트 수행을 위해 계획 수립, 역할 분담, 정보 탐색 단계가 포함되어 있는가',
  '프로젝트 수행을 위한 탐구·조사·자료수집 방법이 다양하게 활용되는가',
  '프로젝트 산출물 제작에 활용되는 자료와 자원이 현실적이고 실현 가능한가',
  '프로젝트 주제와 난이도가 학습자의 수준과 역량에 적절한가',
  '프로젝트가 협업과 팀 기반 활동을 통해 산출물이 완성되도록 설계되어 있는가',
].map(q => ({ group: '학습자중심수업 점검', q }));

const CHECK_FL = [
  '학습자의 수준에 적절한가',
  '사전학습은 기본·핵심내용이 포함된 자료인가',
  '학습자가 사전학습을 수행하였는지 확인하는 단계가 있는가',
  '교실수업(In-class)에서 학습자들의 개인별 참여 방안이 명시되어 있는가',
  '교수자·학습자 혹은 학습자 상호 간의 상호작용 및 피드백 방안이 명시되어 있는가',
  '학습자가 수업 중 배운 내용과 과정에 대해 성찰할 수 있는 기회가 제공되는가',
  '플립러닝의 특성에 따라 적절한 평가방안이 준비되어 있는가',
].map(q => ({ group: '학습자중심수업 실현성', q }));

const CHECK_IC = [
  { group: '현장과의 연계', q: '현장의 맥락을 반영한 문제가 다루어졌는가' },
  { group: '현장과의 연계', q: '현장의 상황을 반영하여 문제가 해결되었는가' },
];

// 유형별 세부 평가표 (평가항목 / 세부항목 / 평가자)
const EVAL_TEAM = [
  { cat: '팀 활동 과정', item: '활동지', who: '교수자' },
  { cat: '팀 활동 과정', item: '동료평가(팀원 내)', who: '학생' },
  { cat: '팀 활동 결과', item: '결과물 및 발표', who: '교수자' },
  { cat: '팀 활동 결과', item: '결과물 및 발표', who: '학생' },
  { cat: '팀 활동 결과', item: '결과물 및 발표', who: '외부전문가' },
  { cat: '개인 평가', item: '성찰일지', who: '교수자' },
  { cat: '개인 평가', item: '기타', who: '교수자/학생' },
  { cat: '기타', item: '', who: '', editable: true },
];

const EVAL_FL = [
  { cat: 'Pre-class(수업 전)', item: '사전학습 참여', who: '교수자' },
  { cat: 'Pre-class(수업 전)', item: '사전학습 평가', who: '교수자' },
  { cat: 'In-class(수업 내)', item: '개인 활동', who: '', whoEditable: true },
  { cat: 'In-class(수업 내)', item: '팀 활동', who: '', whoEditable: true },
  { cat: 'In-class(수업 내)', item: '기타', who: '', whoEditable: true },
  { cat: 'Post-class(수업 후)', item: '성찰일지', who: '교수자' },
  { cat: 'Post-class(수업 후)', item: '기타', who: '교수자' },
  { cat: '기타', item: '', who: '', editable: true },
];

// FL 수업구성: 단계별 학습 활동 요소(원본은 "※ 에 V(체크)하시오")
const FL_STAGES = [
  { key: 'pre', label: '수업 전 (Pre-class)', elements: ['사전 학습', '평가(퀴즈 및 과제)', '학습노트 작성'] },
  { key: 'intro', label: '수업 내 (In-class) · 도입', elements: ['학습준비도 평가(퀴즈 및 과제 확인)', '기타(미니강의 등)'] },
  { key: 'dev', label: '수업 내 (In-class) · 전개', elements: ['심화 학습 활동(학습목표 수행과제)', '개별 활동', '팀 활동'] },
  { key: 'close', label: '수업 내 (In-class) · 마무리', elements: ['평가 및 피드백', '핵심내용 리뷰'] },
  { key: 'post', label: '수업 후 (Post-class)', elements: ['과제(사전학습 미 완료자)', '성찰 노트 작성', '러닝포트폴리오'] },
];

const FORM_TYPES = {
  PBL: {
    code: 'PBL', formNo: 1, name: '문제중심학습', fullTitle: 'PBL(문제중심학습)',
    file: '[서식1] 학습자중심수업 개발 및 운영계획서(PBL_문제중심학습)',
    ic: false, moduleKind: 'pbl', minModules: 2,
    evalRows: EVAL_TEAM,
    checklist: [...CHECK_COMMON_HEAD, ...CHECK_REALIZE, ...CHECK_PBL],
    sampleWeekMethod: 'PBL',
  },
  PJBL: {
    code: 'PjBL', formNo: 2, name: '프로젝트기반학습', fullTitle: 'PjBL(프로젝트기반학습)',
    file: '[서식2] 학습자중심수업 개발 및 운영계획서(PjBL_프로젝트기반학습)',
    ic: false, moduleKind: 'pjbl', minModules: 1,
    evalRows: EVAL_TEAM,
    checklist: [...CHECK_COMMON_HEAD, ...CHECK_REALIZE, ...CHECK_PJBL],
    sampleWeekMethod: 'PjBL',
  },
  FL: {
    code: 'FL', formNo: 3, name: '플립러닝', fullTitle: 'FL(플립러닝)',
    file: '[서식3] 학습자중심수업 개발 및 운영계획서(FL_플립러닝)',
    ic: false, moduleKind: 'fl', minModules: 1,
    evalRows: EVAL_FL,
    checklist: [...CHECK_COMMON_HEAD, ...CHECK_FL],
    sampleWeekMethod: '플립러닝',
  },
  IC_PBL: {
    code: 'IC-PBL', formNo: 4, name: '기업연계문제중심학습', fullTitle: 'IC-PBL(기업연계문제중심학습)',
    file: '[서식4] 학습자중심수업 개발 및 운영계획서(IC-PBL_기업연계문제중심학습)',
    ic: true, moduleKind: 'pbl', minModules: 1,
    evalRows: EVAL_TEAM,
    checklist: [...CHECK_COMMON_HEAD, ...CHECK_REALIZE, ...CHECK_PBL, ...CHECK_IC],
    sampleWeekMethod: 'IC-PBL',
  },
  IC_PJBL: {
    code: 'IC-PjBL', formNo: 5, name: '기업연계프로젝트기반학습', fullTitle: 'IC-PjBL(기업연계프로젝트기반학습)',
    file: '[서식5] 학습자중심수업 개발 및 운영계획서(IC-PjBL_기업연계프로젝트기반학습)',
    ic: true, moduleKind: 'pjbl', minModules: 1,
    evalRows: EVAL_TEAM,
    checklist: [...CHECK_COMMON_HEAD, ...CHECK_REALIZE, ...CHECK_PJBL, ...CHECK_IC],
    sampleWeekMethod: 'IC-PjBL',
  },
};

// 추정·보완한 부분의 설명 (화면의 '추정' 배지 툴팁)
const GUESS_NOTES = {
  tree: '캡스톤디자인 제외로 "재료비 학교 지원" 질문을 없애고, 기업 연계가 아니면 바로 PjBL로 안내하도록 바꿨습니다.',
  credit: '원본은 "학점 - 강의 - 실습" 칸입니다. 학점·강의시간·실습시간을 숫자로 나눠 받도록 했습니다.',
  applicants: '원본은 "교수자가 여러 명일 경우 모든 사람의 정보 기재"라고만 되어 있어, 신청자를 추가할 수 있게 했습니다. hwpx에는 칸이 하나라 여러 명이면 각 칸에 줄을 바꿔 차례로 적습니다. 서명은 내려받은 뒤 직접 합니다.',
  evalDetail: '원본 표는 일부 비율 칸이 병합돼 있습니다(PBL의 활동지·동료평가). 웹에서는 세부항목마다 비율을 따로 받고 합계만 100으로 확인합니다.',
  interaction: '원본은 "차시 / 방법 / 활용 매체" 예시 표(2행)입니다. 행을 추가할 수 있게 했고, hwpx에서는 3행부터 2행 칸에 줄을 바꿔 이어 적습니다.',
  weeks: '원본 표의 수업방식 칸에 적힌 PBL·강의 등은 예시라 비워 두었습니다. 학습자중심 주차 수는 수업방식에 유형명이 들어간 주차로 셉니다.',
  modules: '원본은 "제작한 개수만큼 작성(양식 수정 가능)"입니다. 모듈을 추가·삭제할 수 있지만, hwpx 서식에는 PBL 2개·나머지 유형 1개 칸만 있어 그 이상은 한글에서 표를 복사해 넣어야 합니다.',
  flElements: '원본의 "학습 활동 요소 ※ 에 V(체크)" 칸을 단계별 체크박스로 바꿨습니다.',
  checklist: '진단 체크리스트는 교수자 자가 점검이라 예/아니오 선택으로 받습니다.',
  ic: '"현장연계(IC) 계획"은 원본에 안내 문구가 없어 기업명·참여 방식 등 예시 문구를 넣었습니다.',
};
