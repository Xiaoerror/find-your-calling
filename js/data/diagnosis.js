// 智能诊断5题
const DIAGNOSIS_QUESTIONS = [
  {
    id: 'd1',
    question: '如果现在有人问你"你这辈子最看重什么"，你能立刻说出3个吗？',
    dimension: 'values',
    options: [
      { value: 'clear', label: '能，很清楚' },
      { value: 'vague', label: '勉强能，有点模糊' },
      { value: 'unclear', label: '不能，说不上来' }
    ]
  },
  {
    id: 'd2',
    question: '回顾过去的工作或学习，你感觉自己做什么事时最得心应手、毫不费力？',
    dimension: 'strengths',
    options: [
      { value: 'clear', label: '能清晰说出' },
      { value: 'vague', label: '有点模糊的感觉' },
      { value: 'unclear', label: '完全说不上来' }
    ]
  },
  {
    id: 'd3',
    question: '有哪些事是你即使没有报酬、没有结果，也忍不住想去了解、去做的？',
    dimension: 'passions',
    options: [
      { value: 'clear', label: '很清楚' },
      { value: 'vague', label: '有一些模糊的感觉' },
      { value: 'unclear', label: '完全不知道' }
    ]
  },
  {
    id: 'd4',
    question: '你目前的迷茫更多来自"不知道自己喜欢什么"还是"喜欢的事好像做不了工作"？',
    dimension: 'myth',
    options: [
      { value: 'dont_know', label: '不知道自己喜欢什么' },
      { value: 'cant_work', label: '喜欢的事好像做不了工作' },
      { value: 'both', label: '两者都有' }
    ]
  },
  {
    id: 'd5',
    question: '你觉得自己最缺的是"方向感"还是"信心"？',
    dimension: 'mindset',
    options: [
      { value: 'direction', label: '方向感' },
      { value: 'confidence', label: '信心' },
      { value: 'both', label: '两者都缺' }
    ]
  }
];

// 根据诊断结果生成推荐路径
function generatePath(answers) {
  const path = [];
  const needsValues = answers.d1 === 'unclear' || answers.d1 === 'vague';
  const needsStrengths = answers.d2 === 'unclear' || answers.d2 === 'vague';
  const needsPassions = answers.d3 === 'unclear' || answers.d3 === 'vague';
  const needsMyth = answers.d4 === 'cant_work' || answers.d4 === 'both';

  if (needsMyth) path.push('myths');
  if (needsValues) path.push('values');
  if (needsStrengths) path.push('strengths');
  if (needsPassions) path.push('passions');

  // 如果什么都不需要但选了"两者都缺"，给完整路径
  if (path.length === 0 && (answers.d5 === 'both' || answers.d4 === 'both')) {
    path.push('myths', 'values', 'strengths', 'passions');
  }

  // 如果所有都清晰，建议直接去交叉分析，但先验证
  if (path.length === 0) {
    path.push('values', 'strengths', 'passions');
  }

  return path;
}
