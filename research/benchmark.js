/**
 * Quick-Hire Academic Benchmarking Suite
 * Evaluates Information Retrieval and Ranking Algorithms on Resume-Job Matching
 * Metrics: NDCG@K, Precision@K, MRR, Latency, and Ablation Study
 */

const fs = require('fs');
const path = require('path');

const datasetPath = path.join(__dirname, 'dataset.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

// -------------------------------------------------------------
// 1. Text Preprocessing & Vocabulary
// -------------------------------------------------------------
function tokenize(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9+#.\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1);
}

// Build global vocabulary for IDF computation
const allDocs = [];
dataset.candidates.forEach(c => allDocs.push(`${c.primaryRole} ${c.skills.join(' ')} ${c.summary}`));
dataset.jobs.forEach(j => allDocs.push(`${j.title} ${j.requiredSkills.join(' ')} ${j.description}`));

const N = allDocs.length;
const docFreq = {};
allDocs.forEach(doc => {
    const tokens = new Set(tokenize(doc));
    tokens.forEach(t => {
        docFreq[t] = (docFreq[t] || 0) + 1;
    });
});

function getIDF(term) {
    const df = docFreq[term] || 0;
    return Math.log(1 + (N - df + 0.5) / (df + 0.5));
}

// -------------------------------------------------------------
// 2. Baselines and Proposed Algorithms
// -------------------------------------------------------------

// Baseline 1: BM25 Lexical Ranking
function scoreBM25(job, candidate) {
    const k1 = 1.5;
    const b = 0.75;
    const avgdl = allDocs.reduce((acc, d) => acc + tokenize(d).length, 0) / N;

    const candTokens = tokenize(`${candidate.primaryRole} ${candidate.skills.join(' ')} ${candidate.summary}`);
    const docLen = candTokens.length;

    const tf = {};
    candTokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });

    const queryTokens = tokenize(`${job.title} ${job.requiredSkills.join(' ')} ${job.description}`);
    let score = 0;

    queryTokens.forEach(t => {
        if (tf[t]) {
            const idf = getIDF(t);
            const num = tf[t] * (k1 + 1);
            const den = tf[t] + k1 * (1 - b + b * (docLen / avgdl));
            score += idf * (num / den);
        }
    });

    return score;
}

// Baseline 2: Dense Semantic Cosine Similarity (TF-IDF Vector Space / 768-dim Hash Space)
function textToVector(text, dims = 768) {
    const vec = new Float64Array(dims);
    const tokens = tokenize(text);
    tokens.forEach(t => {
        let hash = 0;
        for (let i = 0; i < t.length; i++) {
            hash = ((hash << 5) - hash) + t.charCodeAt(i);
            hash |= 0;
        }
        const idx = Math.abs(hash) % dims;
        vec[idx] += getIDF(t) || 1.0;
    });

    // Normalize
    let mag = 0;
    for (let i = 0; i < dims; i++) mag += vec[i] * vec[i];
    mag = Math.sqrt(mag);
    if (mag > 0) {
        for (let i = 0; i < dims; i++) vec[i] /= mag;
    }
    return vec;
}

function cosineSimilarity(v1, v2) {
    let dot = 0;
    for (let i = 0; i < v1.length; i++) {
        dot += v1[i] * v2[i];
    }
    return Math.max(0, Math.min(1.0, dot));
}

function scoreDenseCosine(job, candidate) {
    const jobVec = textToVector(`${job.title} ${job.requiredSkills.join(' ')} ${job.description}`);
    const candVec = textToVector(`${candidate.primaryRole} ${candidate.skills.join(' ')} ${candidate.summary}`);
    return cosineSimilarity(jobVec, candVec) * 100.0;
}

// Baseline 3: Pure Jaccard Skill Overlap
function scoreSkillJaccard(job, candidate) {
    const jobSkills = new Set(job.requiredSkills.map(s => s.toLowerCase()));
    const candSkills = new Set(candidate.skills.map(s => s.toLowerCase()));

    let intersection = 0;
    jobSkills.forEach(s => {
        if (candSkills.has(s)) intersection++;
    });

    const union = new Set([...jobSkills, ...candSkills]).size;
    return union > 0 ? (intersection / union) * 100.0 : 0.0;
}

// Proposed System: QuickHire Parameterized Hybrid Model
function scoreQuickHireHybrid(job, candidate, alpha = 0.45, beta = 0.45, gamma = 10.0) {
    // 1. Semantic Cosine Component
    const jobVec = textToVector(`${job.title} ${job.requiredSkills.join(' ')} ${job.description}`);
    const candVec = textToVector(`${candidate.primaryRole} ${candidate.skills.join(' ')} ${candidate.summary}`);
    const cosPercent = cosineSimilarity(jobVec, candVec) * 100.0;

    // 2. Exact Skill Coverage Component
    const jobSkills = job.requiredSkills.map(s => s.toLowerCase());
    const candSkills = new Set(candidate.skills.map(s => s.toLowerCase()));
    let matched = 0;
    jobSkills.forEach(s => {
        if (candSkills.has(s)) matched++;
    });
    const skillOverlapPercent = jobSkills.length > 0 ? (matched / jobSkills.length) * 100.0 : 0.0;

    // 3. Role Alignment Bonus
    const jobTitleTokens = tokenize(job.title);
    const candRoleTokens = tokenize(candidate.primaryRole);
    let roleMatches = 0;
    jobTitleTokens.forEach(t => {
        if (candRoleTokens.includes(t)) roleMatches++;
    });
    const roleAligned = roleMatches >= 2 || jobTitleTokens.some(t => candRoleTokens.includes(t) && ['engineer', 'developer', 'lead', 'senior', 'junior'].includes(t) === false);
    const roleBonus = roleAligned ? gamma : 0.0;

    const composite = (cosPercent * alpha) + (skillOverlapPercent * beta) + roleBonus;
    return Math.min(100.0, Math.max(0.0, composite));
}

// QuickHire Fallback Mode (Deterministic local heuristic)
function scoreQuickHireFallback(job, candidate) {
    return scoreQuickHireHybrid(job, candidate, 0.40, 0.50, 10.0);
}

// -------------------------------------------------------------
// 3. Information Retrieval Evaluation Metrics
// -------------------------------------------------------------

function calculateDCG(ranking, groundTruths, k) {
    let dcg = 0;
    for (let i = 0; i < Math.min(k, ranking.length); i++) {
        const candidateId = ranking[i].id;
        const rel = groundTruths[candidateId] || 0;
        dcg += (Math.pow(2, rel) - 1) / Math.log2(i + 2); // i+2 because rank is 1-indexed (i+1)+1
    }
    return dcg;
}

function calculateNDCG(ranking, groundTruths, k) {
    const dcg = calculateDCG(ranking, groundTruths, k);

    // Calculate Ideal DCG (IDCG)
    const idealRanking = [...dataset.candidates].sort((a, b) => {
        return (groundTruths[b.id] || 0) - (groundTruths[a.id] || 0);
    });
    const idcg = calculateDCG(idealRanking, groundTruths, k);

    return idcg > 0 ? dcg / idcg : 1.0;
}

function calculatePrecisionAtK(ranking, groundTruths, k, threshold = 2) {
    let relevantCount = 0;
    for (let i = 0; i < Math.min(k, ranking.length); i++) {
        const rel = groundTruths[ranking[i].id] || 0;
        if (rel >= threshold) relevantCount++;
    }
    return relevantCount / k;
}

function calculateMRR(ranking, groundTruths, threshold = 2) {
    for (let i = 0; i < ranking.length; i++) {
        const rel = groundTruths[ranking[i].id] || 0;
        if (rel >= threshold) {
            return 1.0 / (i + 1);
        }
    }
    return 0.0;
}

// -------------------------------------------------------------
// 4. Benchmarking Execution Pipeline
// -------------------------------------------------------------

function evaluateModel(modelName, scoringFn) {
    let totalNDCG1 = 0;
    let totalNDCG3 = 0;
    let totalNDCG5 = 0;
    let totalP1 = 0;
    let totalP3 = 0;
    let totalP5 = 0;
    let totalMRR = 0;
    let totalTimeMs = 0;

    const numJobs = dataset.jobs.length;

    dataset.jobs.forEach(job => {
        const groundTruths = dataset.groundTruth[job.id];

        const start = performance.now();
        const scoredCandidates = dataset.candidates.map(cand => {
            return {
                id: cand.id,
                score: scoringFn(job, cand)
            };
        });
        const elapsed = performance.now() - start;
        totalTimeMs += elapsed;

        // Rank descending
        scoredCandidates.sort((a, b) => b.score - a.score);

        totalNDCG1 += calculateNDCG(scoredCandidates, groundTruths, 1);
        totalNDCG3 += calculateNDCG(scoredCandidates, groundTruths, 3);
        totalNDCG5 += calculateNDCG(scoredCandidates, groundTruths, 5);
        totalP1 += calculatePrecisionAtK(scoredCandidates, groundTruths, 1);
        totalP3 += calculatePrecisionAtK(scoredCandidates, groundTruths, 3);
        totalP5 += calculatePrecisionAtK(scoredCandidates, groundTruths, 5);
        totalMRR += calculateMRR(scoredCandidates, groundTruths);
    });

    const avgCandidateLatency = (totalTimeMs / (numJobs * dataset.candidates.length)).toFixed(4);

    return {
        model: modelName,
        ndcg1: (totalNDCG1 / numJobs).toFixed(4),
        ndcg3: (totalNDCG3 / numJobs).toFixed(4),
        ndcg5: (totalNDCG5 / numJobs).toFixed(4),
        p1: (totalP1 / numJobs).toFixed(4),
        p3: (totalP3 / numJobs).toFixed(4),
        p5: (totalP5 / numJobs).toFixed(4),
        mrr: (totalMRR / numJobs).toFixed(4),
        latencyMs: `${avgCandidateLatency} ms`
    };
}

console.log('========================================================================');
console.log('       QUICK-HIRE EMPIRICAL INFORMATION RETRIEVAL BENCHMARK RESULTS     ');
console.log('========================================================================\n');

const models = [
    { name: 'Baseline: BM25 (Lexical)', fn: scoreBM25 },
    { name: 'Baseline: Dense Cosine (Semantic)', fn: scoreDenseCosine },
    { name: 'Baseline: Jaccard Skill Overlap', fn: scoreSkillJaccard },
    { name: 'QuickHire: Fallback Engine (Offline)', fn: scoreQuickHireFallback },
    { name: 'QuickHire: Hybrid Architecture (Proposed)', fn: (j, c) => scoreQuickHireHybrid(j, c, 0.45, 0.45, 10.0) }
];

const results = models.map(m => evaluateModel(m.name, m.fn));
console.table(results);

// -------------------------------------------------------------
// 5. Ablation Study
// -------------------------------------------------------------
console.log('\n========================================================================');
console.log('                            ABLATION STUDY                              ');
console.log('========================================================================\n');

const ablations = [
    { name: '1. Dense Semantic Only (alpha=1.0, beta=0, gamma=0)', fn: (j, c) => scoreQuickHireHybrid(j, c, 1.0, 0.0, 0.0) },
    { name: '2. Skill Overlap Only (alpha=0, beta=1.0, gamma=0)', fn: (j, c) => scoreQuickHireHybrid(j, c, 0.0, 1.0, 0.0) },
    { name: '3. Hybrid without Role Bonus (alpha=0.50, beta=0.50, gamma=0)', fn: (j, c) => scoreQuickHireHybrid(j, c, 0.50, 0.50, 0.0) },
    { name: '4. Full Proposed Hybrid (alpha=0.45, beta=0.45, gamma=10)', fn: (j, c) => scoreQuickHireHybrid(j, c, 0.45, 0.45, 10.0) }
];

const ablationResults = ablations.map(a => evaluateModel(a.name, a.fn));
console.table(ablationResults);

// -------------------------------------------------------------
// 6. Parameter Sensitivity Optimization (Grid Search)
// -------------------------------------------------------------
console.log('\nOptimizing Hyperparameters (alpha, beta, gamma)...');
let bestNDCG5 = 0;
let optimalConfig = null;

for (let a = 0.2; a <= 0.7; a += 0.05) {
    for (let b = 0.2; b <= 0.7; b += 0.05) {
        for (let g = 0; g <= 15; g += 5) {
            let totalNDCG = 0;
            dataset.jobs.forEach(job => {
                const groundTruths = dataset.groundTruth[job.id];
                const scored = dataset.candidates.map(c => ({
                    id: c.id,
                    score: scoreQuickHireHybrid(job, c, a, b, g)
                }));
                scored.sort((x, y) => y.score - x.score);
                totalNDCG += calculateNDCG(scored, groundTruths, 5);
            });
            const avgNDCG = totalNDCG / dataset.jobs.length;
            if (avgNDCG > bestNDCG5) {
                bestNDCG5 = avgNDCG;
                optimalConfig = { alpha: a.toFixed(2), beta: b.toFixed(2), gamma: g, ndcg5: avgNDCG.toFixed(4) };
            }
        }
    }
}
console.log('Grid Search Result: Highest NDCG@5 achieved at:', optimalConfig);

// Save report to JSON
const report = {
    benchmarkDate: new Date().toISOString(),
    datasetStats: {
        totalJobs: dataset.jobs.length,
        totalCandidates: dataset.candidates.length,
        totalEvaluatedPairs: dataset.jobs.length * dataset.candidates.length
    },
    baselines: results,
    ablation: ablationResults,
    optimalHyperparameters: optimalConfig
};

fs.writeFileSync(path.join(__dirname, 'benchmark_results.json'), JSON.stringify(report, null, 2));
console.log('\n[SUCCESS] Benchmark results saved to research/benchmark_results.json');
