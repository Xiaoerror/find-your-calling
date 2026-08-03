/* ===== PDF 生成工具 ===== */
const PDFUtil = {
  async generate() {
    const state = AppState.get();
    const name = state.userName || '探索者';
    const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

    // 构建报告HTML
    const reportHTML = `
      <div style="font-family: 'PingFang SC','Microsoft YaHei',sans-serif; max-width: 600px; margin:0 auto; padding: 40px 30px; color: #1F2937;">
        <h2 style="text-align:center; font-size:22px; margin-bottom:6px; color:#111827;">我的方向地图</h2>
        <p style="text-align:center; font-size:14px; color:#6B7280; margin-bottom:30px;">真正想做的事探索报告</p>
        <p style="font-size:13px; color:#9CA3AF; margin-bottom:24px;">${name} · ${date}</p>

        <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #E5E7EB;">
          <h3 style="font-size:13px; color:#6B7280; margin-bottom:8px;">核心价值观 Top 5</h3>
          <p style="font-size:15px; line-height:1.8;">${(state.values.top || []).map(v => v.word).join(' · ')}</p>
        </div>

        <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #E5E7EB;">
          <h3 style="font-size:13px; color:#6B7280; margin-bottom:8px;">擅长模式 Top 3</h3>
          <p style="font-size:15px; line-height:1.8;">${(state.strengths.top || []).map(s => s.word).join(' · ')}</p>
          ${state.strengths.holland ? `<p style="font-size:12px; color:#9CA3AF; margin-top:8px;">霍兰德类型：${Object.entries(state.strengths.holland).sort((a,b) => b[1]-a[1]).slice(0,2).map(([k,v]) => k+'型').join(' · ')}</p>` : ''}
        </div>

        <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #E5E7EB;">
          <h3 style="font-size:13px; color:#6B7280; margin-bottom:8px;">喜欢领域 Top 3</h3>
          <p style="font-size:15px; line-height:1.8;">${(state.passions.top || []).map(p => p.word).join(' · ')}</p>
        </div>

        ${state.crossResults && state.crossResults.length > 0 ? `
        <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #E5E7EB;">
          <h3 style="font-size:13px; color:#6B7280; margin-bottom:12px;">交叉分析 · 候选方向</h3>
          ${state.crossResults.map(r => `
            <div style="margin-bottom:10px; padding:10px 14px; border-radius:8px; background:${r.feel === 'yes' ? '#ECFDF5' : '#F9FAFB'}; border:1px solid ${r.feel === 'yes' ? '#059669' : '#E5E7EB'};">
              <p style="font-size:15px; font-weight:600; margin:0 0 4px;">${r.field} ${r.feel === 'yes' ? '✓ 有感觉' : ''}</p>
              <p style="font-size:13px; color:#6B7280; margin:0;">${r.formula}</p>
              ${r.paths ? `<p style="font-size:12px; color:#9CA3AF; margin:4px 0 0;">路径：${r.paths.join(' / ')}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div style="margin-top:30px; padding:16px; background:#EEF2FF; border-radius:10px; text-align:center;">
          <p style="font-size:14px; color:#4F46E5; margin:0;">
            下一步，你可以选择最有感觉的方向，找一件小事开始尝试。<br/>
            想做的事在心中，实现手段在社会中。—— 八木仁平
          </p>
        </div>
      </div>
    `;

    // 使用浏览器打印功能导出PDF
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>我的方向地图</title>
      <style>body { margin: 0; } @page { size: A4; margin: 0; }</style>
      </head><body>${reportHTML}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  }
};
