// A1 内置语义推理引擎
const ENGINE = {
  // 基于语义关联矩阵计算候选方向
  match(values, strengths, passions) {
    const results = [];
    const allFields = new Set();

    // 收集所有可能的方向
    for (const v of values) {
      const vMatrix = SEMANTIC_MATRIX[v] || {};
      for (const s of strengths) {
        const sFields = vMatrix[s] || {};
        for (const [field, score] of Object.entries(sFields)) {
          if (passions.includes(field)) {
            allFields.add(field);
          }
        }
      }
    }

    if (allFields.size === 0) {
      // 回退：返回与价值观+擅长最高匹配的领域
      for (const v of values) {
        const vMatrix = SEMANTIC_MATRIX[v] || {};
        for (const s of strengths) {
          const sFields = vMatrix[s] || {};
          for (const [field, score] of Object.entries(sFields)) {
            allFields.add(field);
          }
        }
      }
    }

    // 计算每个方向的综合得分
    for (const field of allFields) {
      let totalScore = 0;
      let matchCount = 0;
      const matchDetails = [];

      for (const v of values) {
        const vMatrix = SEMANTIC_MATRIX[v] || {};
        for (const s of strengths) {
          const sFields = vMatrix[s] || {};
          const score = sFields[field] || DEFAULT_MATRIX_SCORE;
          if (score > 0) {
            totalScore += score;
            matchCount++;
            matchDetails.push({ value: v, strength: s, score });
          }
        }
      }

      // 加权：喜欢领域匹配加分
      const passionBonus = passions.includes(field) ? 5 : 0;
      const finalScore = totalScore + passionBonus;

      results.push({
        field,
        score: finalScore,
        matchCount,
        matchDetails,
        passionMatch: passions.includes(field)
      });
    }

    // 按分数降序排列
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 8);
  },

  // 为每个结果生成人类可读的描述
  describe(result) {
    const bestMatch = result.matchDetails.sort((a, b) => b.score - a.score)[0];
    const valueWord = VALUES_POOL.find(v => v.word === bestMatch.value);
    const strengthWord = STRENGTHS_POOL.find(s => s.word === bestMatch.strength);
    const passionWord = PASSIONS_POOL.find(p => p.word === result.field);

    return {
      field: result.field,
      fieldDesc: passionWord ? passionWord.desc : '',
      formula: `用「${bestMatch.strength}」的方式，在「${result.field}」领域，实现「${bestMatch.value}」的价值`,
      score: result.score,
      passionMatch: result.passionMatch
    };
  },

  // 生成落地建议
  getPathSuggestions(field, valueWord) {
    const suggestions = {
      '心理学': ['心理咨询师 / 治疗师', '心理学科普作者 / 播客主理人', 'HR / 组织发展顾问'],
      '教育': ['教师 / 培训师', '教育内容创作者', '课程设计师'],
      '科技': ['软件开发者', '技术写作者 / 博主', '产品经理'],
      '艺术设计': ['设计师（UI/平面/品牌）', '插画师 / 自由艺术家', '创意总监'],
      '写作': ['自由撰稿人 / 作者', '内容策略师', '编剧 / 文案'],
      '商业创业': ['创业者 / 创始人', '商业顾问', '产品经理'],
      '音乐': ['音乐人 / 制作人', '音乐教师', '音频内容创作者'],
      '媒体传播': ['自媒体主理人', '品牌 / 公关专家', '播客 / 视频创作者'],
      '社会公益': ['非营利组织工作者', '社会企业创始人', '公益顾问'],
      '健康医疗': ['健康教练 / 营养师', '医学写作者', '心理健康工作者'],
      '环境生态': ['环保组织工作者', '可持续发展顾问', '环境教育者'],
      '法律政治': ['律师 / 法务', '政策分析师', '公共事务顾问'],
      '数据科学': ['数据分析师', '数据科学家', '商业智能顾问'],
      '哲学': ['哲学写作者 / 播客主理人', '教师 / 学者', '咨询顾问（伦理方向）'],
      '历史': ['历史写作者 / 播客主理人', '博物馆 / 文化机构工作者', '教师'],
      '美食烹饪': ['厨师 / 私厨', '美食博主 / 内容创作者', '餐饮创业者'],
      '体育运动': ['教练 / 培训师', '运动内容创作者', '体育管理'],
      '旅行': ['旅行博主 / 内容创作者', '旅行规划师', '文旅从业者'],
      '手工制作': ['手工艺人 / 匠人', 'DIY 内容创作者', '手作工作室主理人'],
      '时尚': ['服装 / 配饰设计师', '时尚博主 / 造型师', '品牌主理人']
    };
    return suggestions[field] || ['将该领域作为副业/兴趣开始探索', '寻找该领域的社群或线上课程', '与该领域的从业者进行信息访谈'];
  }
};
