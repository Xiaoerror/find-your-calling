// A2 AI增强推理（可选模块）
const AI_ENGINE = {
  apiKey: null,
  endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  model: 'qwen-plus',

  configure(apiKey, endpoint, model) {
    this.apiKey = apiKey;
    if (endpoint) this.endpoint = endpoint;
    if (model) this.model = model;
  },

  buildPrompt(values, strengths, passions, matrixResults) {
    const topValues = values.join('、');
    const topStrengths = strengths.join('、');
    const topPassions = passions.join('、');

    const matrixSummary = matrixResults.slice(0, 5).map(r =>
      `- ${r.field}（得分: ${r.score}，${r.passionMatch ? '与喜欢领域匹配' : '非喜欢领域'}）`
    ).join('\n');

    return `你是一位深谙自我认知的职业规划顾问，正在帮助一个人探索"真正想做的事"。

请基于以下用户画像，进行深度语义推理，发现那些非显性的职业/事业方向：

【用户的核心价值观（Top）】：${topValues}
【用户擅长的方式】：${topStrengths}
【用户感兴趣的领域】：${topPassions}

【内置引擎匹配的初步方向】：
${matrixSummary}

请输出3-5个深度推理的方向，要求：
1. 每个方向包含：方向名称、为什么适合（结合价值观+擅长+兴趣的语义逻辑）、1-2种具体的实现路径
2. 重点关注内置引擎可能漏掉的非显性关联（比如"哲学+简化+追求真实"可能导向"知识科普创作者"）
3. 方向要具体可操作，不要泛泛而谈

用以下JSON格式输出（只输出JSON，不要其他文字）：
{
  "directions": [
    {
      "name": "方向名称",
      "reason": "为什么适合（50字以内）",
      "paths": ["具体路径1", "具体路径2"]
    }
  ]
}`;
  },

  async analyze(values, strengths, passions, matrixResults) {
    if (!this.apiKey) {
      throw new Error('请先配置API密钥');
    }

    const prompt = this.buildPrompt(values, strengths, passions, matrixResults);
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  }
};
