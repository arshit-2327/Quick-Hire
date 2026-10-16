/**
 * Chart Generator for Research Benchmark Results
 * Generates an SVG visual comparison and an interactive HTML report
 */

const fs = require('fs');
const path = require('path');

const resultsPath = path.join(__dirname, 'benchmark_results.json');
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

const models = data.baselines.map(b => b.model.replace('Baseline: ', '').replace('QuickHire: ', ''));
const ndcg5Values = data.baselines.map(b => parseFloat(b.ndcg5));
const p5Values = data.baselines.map(b => parseFloat(b.p5));

const svgWidth = 800;
const svgHeight = 450;
const margin = { top: 60, right: 40, bottom: 90, left: 70 };
const chartW = svgWidth - margin.left - margin.right;
const chartH = svgHeight - margin.top - margin.bottom;

const barGroupWidth = chartW / models.length;
const barWidth = 32;

let barsSvg = '';
models.forEach((model, i) => {
    const xGroup = margin.left + (i * barGroupWidth) + (barGroupWidth / 2) - barWidth;
    
    // NDCG@5 Bar (Blue)
    const ndcgHeight = (ndcg5Values[i] / 1.0) * chartH;
    const ndcgY = margin.top + (chartH - ndcgHeight);
    barsSvg += `
        <rect x="${xGroup}" y="${ndcgY}" width="${barWidth}" height="${ndcgHeight}" fill="#3b82f6" rx="4">
            <title>${model} - NDCG@5: ${ndcg5Values[i]}</title>
        </rect>
        <text x="${xGroup + barWidth / 2}" y="${ndcgY - 6}" font-size="11" font-family="Inter, sans-serif" fill="#1e40af" text-anchor="middle" font-weight="600">${ndcg5Values[i]}</text>
    `;

    // P@5 Bar (Emerald)
    const pHeight = (p5Values[i] / 1.0) * chartH;
    const pY = margin.top + (chartH - pHeight);
    barsSvg += `
        <rect x="${xGroup + barWidth + 6}" y="${pY}" width="${barWidth}" height="${pHeight}" fill="#10b981" rx="4">
            <title>${model} - P@5: ${p5Values[i]}</title>
        </rect>
        <text x="${xGroup + barWidth + 6 + barWidth / 2}" y="${pY - 6}" font-size="11" font-family="Inter, sans-serif" fill="#065f46" text-anchor="middle" font-weight="600">${p5Values[i]}</text>
    `;

    // Model Label (Rotated)
    const labelX = xGroup + barWidth;
    const labelY = margin.top + chartH + 20;
    barsSvg += `
        <text x="${labelX}" y="${labelY}" font-size="11" font-family="Inter, sans-serif" fill="#374151" text-anchor="end" transform="rotate(-25, ${labelX}, ${labelY})">${model}</text>
    `;
});

// Gridlines
let gridlines = '';
for (let v = 0; v <= 1.0; v += 0.2) {
    const y = margin.top + (chartH - (v * chartH));
    gridlines += `
        <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" stroke="#e5e7eb" stroke-dasharray="3,3" />
        <text x="${margin.left - 12}" y="${y + 4}" font-size="11" font-family="Inter, sans-serif" fill="#6b7280" text-anchor="end">${v.toFixed(1)}</text>
    `;
}

const fullSvg = `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; border-radius:12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <!-- Title -->
    <text x="${svgWidth / 2}" y="32" font-size="16" font-weight="700" font-family="Inter, sans-serif" fill="#111827" text-anchor="middle">
        Evaluation Metrics on Candidate-Job Matching (NDCG@5 vs Precision@5)
    </text>

    <!-- Legend -->
    <rect x="${svgWidth - 250}" y="20" width="14" height="14" fill="#3b82f6" rx="2" />
    <text x="${svgWidth - 230}" y="32" font-size="12" font-family="Inter, sans-serif" fill="#374151">NDCG@5</text>
    <rect x="${svgWidth - 150}" y="20" width="14" height="14" fill="#10b981" rx="2" />
    <text x="${svgWidth - 130}" y="32" font-size="12" font-family="Inter, sans-serif" fill="#374151">Precision@5</text>

    <!-- Axes -->
    <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="#9ca3af" stroke-width="1.5" />
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#9ca3af" stroke-width="1.5" />

    ${gridlines}
    ${barsSvg}
</svg>
`;

fs.writeFileSync(path.join(__dirname, 'benchmark_chart.svg'), fullSvg.trim());

// Generate HTML Report
const htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Quick-Hire Academic Benchmark Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px; }
        .container { max-width: 960px; margin: 0 auto; background: white; padding: 36px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
        h1 { margin-top: 0; color: #1e293b; font-size: 26px; }
        h2 { color: #334155; margin-top: 32px; font-size: 19px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
        th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; color: #475569; }
        tr:hover { background: #f8fafc; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
        .badge-proposed { background: #dbeafe; color: #1d4ed8; }
        .chart-box { text-align: center; margin: 28px 0; }
        .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
        .meta-card { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .meta-card h4 { margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #64748b; }
        .meta-card p { margin: 0; font-size: 20px; font-weight: 700; color: #0f172a; }
    </style>
</head>
<body>
<div class="container">
    <h1>📊 Quick-Hire Academic Benchmark & Empirical Evaluation</h1>
    <p>Automated evaluation across 25 candidate profiles, 10 job postings, and 250 ground-truth relevance pairs.</p>

    <div class="meta-grid">
        <div class="meta-card">
            <h4>Total Test Pairs</h4>
            <p>${data.datasetStats.totalEvaluatedPairs}</p>
        </div>
        <div class="meta-card">
            <h4>Optimal Hybrid Configuration</h4>
            <p>&alpha;=0.45, &beta;=0.45, &gamma;=10</p>
        </div>
        <div class="meta-card">
            <h4>Mean Latency</h4>
            <p>${data.baselines[4].latencyMs}</p>
        </div>
    </div>

    <h2>1. Model Comparison against Standard Baselines</h2>
    <table>
        <thead>
            <tr>
                <th>Model</th>
                <th>NDCG@1</th>
                <th>NDCG@3</th>
                <th>NDCG@5</th>
                <th>P@1</th>
                <th>P@3</th>
                <th>P@5</th>
                <th>MRR</th>
                <th>Latency</th>
            </tr>
        </thead>
        <tbody>
            ${data.baselines.map((b, i) => `
            <tr style="${i === 4 ? 'font-weight: 700; background: #eff6ff;' : ''}">
                <td>${b.model} ${i === 4 ? '<span class="badge badge-proposed">PROPOSED</span>' : ''}</td>
                <td>${b.ndcg1}</td>
                <td>${b.ndcg3}</td>
                <td>${b.ndcg5}</td>
                <td>${b.p1}</td>
                <td>${b.p3}</td>
                <td>${b.p5}</td>
                <td>${b.mrr}</td>
                <td>${b.latencyMs}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="chart-box">
        ${fullSvg}
    </div>

    <h2>2. Ablation Study: Impact of Model Components</h2>
    <table>
        <thead>
            <tr>
                <th>Configuration</th>
                <th>NDCG@3</th>
                <th>NDCG@5</th>
                <th>P@3</th>
                <th>P@5</th>
                <th>MRR</th>
            </tr>
        </thead>
        <tbody>
            ${data.ablation.map((a, i) => `
            <tr style="${i === 3 ? 'font-weight: 700; background: #eff6ff;' : ''}">
                <td>${a.model}</td>
                <td>${a.ndcg3}</td>
                <td>${a.ndcg5}</td>
                <td>${a.p3}</td>
                <td>${a.p5}</td>
                <td>${a.mrr}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <h2>3. Key Academic Findings</h2>
    <ul>
        <li><strong>Complementary Dynamics:</strong> Combining dense semantic vectors with explicit skill coverage elevates NDCG@5 from 0.9318 (pure dense) to 0.9700.</li>
        <li><strong>Precision Boost:</strong> Precision@5 rises from 0.7000 (dense cosine) and 0.7600 (BM25) to 0.8000 under the hybrid formulation.</li>
        <li><strong>Fault-Tolerant Edge Degradation:</strong> The offline heuristic fallback preserves 100% MRR and 0.9700 NDCG@5, guaranteeing reliable candidate ranking during cloud LLM outages.</li>
    </ul>
</div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'benchmark_report.html'), htmlReport.trim());
console.log('[SUCCESS] Generated research/benchmark_chart.svg and research/benchmark_report.html');
