"""
Quick-Hire Academic Benchmarking Suite (Python 3)
Evaluates Information Retrieval and Candidate Ranking Algorithms:
BM25, Dense Semantic Cosine, Jaccard Skill Overlap, Offline Fallback, and Proposed Hybrid.
Calculates NDCG@K, Precision@K, MRR, Latency, and Ablation Analysis.
"""

import json
import math
import time
import re
from pathlib import Path
from collections import Counter

# -------------------------------------------------------------
# 1. Load Dataset
# -------------------------------------------------------------
dataset_path = Path(__file__).parent / "dataset.json"
with open(dataset_path, "r", encoding="utf-8") as f:
    dataset = json.load(f)

jobs = dataset["jobs"]
candidates = dataset["candidates"]
ground_truth = dataset["groundTruth"]

# -------------------------------------------------------------
# 2. Text Preprocessing & Corpus IDF
# -------------------------------------------------------------
def tokenize(text: str):
    return [w for w in re.split(r"[^a-zA-Z0-9+#.]+", text.lower()) if len(w) > 1]

all_docs = []
for c in candidates:
    all_docs.append(f"{c['primaryRole']} {' '.join(c['skills'])} {c['summary']}")
for j in jobs:
    all_docs.append(f"{j['title']} {' '.join(j['requiredSkills'])} {j['description']}")

N = len(all_docs)
doc_freq = Counter()
for doc in all_docs:
    unique_tokens = set(tokenize(doc))
    for t in unique_tokens:
        doc_freq[t] += 1

def get_idf(term: str) -> float:
    df = doc_freq.get(term, 0)
    return math.log(1.0 + (N - df + 0.5) / (df + 0.5))

# -------------------------------------------------------------
# 3. Baseline & Proposed Algorithms
# -------------------------------------------------------------

def score_bm25(job, candidate) -> float:
    k1 = 1.5
    b = 0.75
    avgdl = sum(len(tokenize(d)) for d in all_docs) / N

    cand_tokens = tokenize(f"{candidate['primaryRole']} {' '.join(candidate['skills'])} {candidate['summary']}")
    doc_len = len(cand_tokens)
    tf = Counter(cand_tokens)

    query_tokens = tokenize(f"{job['title']} {' '.join(job['requiredSkills'])} {job['description']}")
    score = 0.0

    for t in query_tokens:
        if t in tf:
            idf = get_idf(t)
            num = tf[t] * (k1 + 1.0)
            den = tf[t] + k1 * (1.0 - b + b * (doc_len / avgdl))
            score += idf * (num / den)

    return score

def text_to_vector(text: str, dims: int = 768):
    vec = [0.0] * dims
    tokens = tokenize(text)
    for t in tokens:
        # Deterministic 32-bit integer hash
        h = 0
        for ch in t:
            h = ((h << 5) - h) + ord(ch)
            h &= 0xFFFFFFFF
        idx = abs(h) % dims
        vec[idx] += get_idf(t) or 1.0

    mag = math.sqrt(sum(x * x for x in vec))
    if mag > 0:
        vec = [x / mag for x in vec]
    return vec

def cosine_similarity(v1, v2) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    return max(0.0, min(1.0, dot))

def score_dense_cosine(job, candidate) -> float:
    job_vec = text_to_vector(f"{job['title']} {' '.join(job['requiredSkills'])} {job['description']}")
    cand_vec = text_to_vector(f"{candidate['primaryRole']} {' '.join(candidate['skills'])} {candidate['summary']}")
    return cosine_similarity(job_vec, cand_vec) * 100.0

def score_skill_jaccard(job, candidate) -> float:
    job_skills = set(s.lower() for s in job["requiredSkills"])
    cand_skills = set(s.lower() for s in candidate["skills"])

    inter = len(job_skills & cand_skills)
    union = len(job_skills | cand_skills)
    return (inter / union * 100.0) if union > 0 else 0.0

def score_quickhire_hybrid(job, candidate, alpha=0.45, beta=0.45, gamma=10.0) -> float:
    # 1. Dense Semantic Vector Sim
    job_vec = text_to_vector(f"{job['title']} {' '.join(job['requiredSkills'])} {job['description']}")
    cand_vec = text_to_vector(f"{candidate['primaryRole']} {' '.join(candidate['skills'])} {candidate['summary']}")
    cos_percent = cosine_similarity(job_vec, cand_vec) * 100.0

    # 2. Hard Required Skill Overlap
    job_skills = [s.lower() for s in job["requiredSkills"]]
    cand_skills = set(s.lower() for s in candidate["skills"])
    matched = sum(1 for s in job_skills if s in cand_skills)
    skill_overlap = (matched / len(job_skills) * 100.0) if job_skills else 0.0

    # 3. Categorical Role Alignment Bonus
    job_title_tokens = set(tokenize(job["title"]))
    cand_role_tokens = set(tokenize(candidate["primaryRole"]))
    common = job_title_tokens & cand_role_tokens - {"developer", "engineer", "lead", "senior", "junior"}
    role_aligned = len(common) >= 1 or len(job_title_tokens & cand_role_tokens) >= 2
    role_bonus = gamma if role_aligned else 0.0

    composite = (cos_percent * alpha) + (skill_overlap * beta) + role_bonus
    return min(100.0, max(0.0, composite))

def score_quickhire_fallback(job, candidate) -> float:
    return score_quickhire_hybrid(job, candidate, alpha=0.40, beta=0.50, gamma=10.0)

# -------------------------------------------------------------
# 4. IR Evaluation Metrics (NDCG, Precision, MRR)
# -------------------------------------------------------------

def calculate_dcg(ranked_candidates, ground_truths, k: int) -> float:
    dcg = 0.0
    for i in range(min(k, len(ranked_candidates))):
        cid = ranked_candidates[i]["id"]
        rel = ground_truths.get(cid, 0)
        dcg += (math.pow(2, rel) - 1.0) / math.log2(i + 2)
    return dcg

def calculate_ndcg(ranked_candidates, ground_truths, k: int) -> float:
    dcg = calculate_dcg(ranked_candidates, ground_truths, k)
    ideal_candidates = sorted(candidates, key=lambda c: ground_truths.get(c["id"], 0), reverse=True)
    idcg = calculate_dcg(ideal_candidates, ground_truths, k)
    return (dcg / idcg) if idcg > 0 else 1.0

def calculate_precision_at_k(ranked_candidates, ground_truths, k: int, threshold: int = 2) -> float:
    relevant = sum(1 for i in range(min(k, len(ranked_candidates))) if ground_truths.get(ranked_candidates[i]["id"], 0) >= threshold)
    return relevant / k

def calculate_mrr(ranked_candidates, ground_truths, threshold: int = 2) -> float:
    for i, c in enumerate(ranked_candidates):
        if ground_truths.get(c["id"], 0) >= threshold:
            return 1.0 / (i + 1)
    return 0.0

# -------------------------------------------------------------
# 5. Evaluation Loop
# -------------------------------------------------------------

def evaluate_model(name: str, score_fn):
    total_ndcg1 = 0.0
    total_ndcg3 = 0.0
    total_ndcg5 = 0.0
    total_p1 = 0.0
    total_p3 = 0.0
    total_p5 = 0.0
    total_mrr = 0.0
    total_time = 0.0

    for job in jobs:
        gt = ground_truth[job["id"]]
        t0 = time.perf_counter()
        scored = [{"id": c["id"], "score": score_fn(job, c)} for c in candidates]
        t1 = time.perf_counter()
        total_time += (t1 - t0)

        scored.sort(key=lambda x: x["score"], reverse=True)

        total_ndcg1 += calculate_ndcg(scored, gt, 1)
        total_ndcg3 += calculate_ndcg(scored, gt, 3)
        total_ndcg5 += calculate_ndcg(scored, gt, 5)
        total_p1 += calculate_precision_at_k(scored, gt, 1)
        total_p3 += calculate_precision_at_k(scored, gt, 3)
        total_p5 += calculate_precision_at_k(scored, gt, 5)
        total_mrr += calculate_mrr(scored, gt)

    num_evals = len(jobs) * len(candidates)
    latency_ms = (total_time / num_evals) * 1000.0

    return {
        "model": name,
        "ndcg1": f"{total_ndcg1 / len(jobs):.4f}",
        "ndcg3": f"{total_ndcg3 / len(jobs):.4f}",
        "ndcg5": f"{total_ndcg5 / len(jobs):.4f}",
        "p1": f"{total_p1 / len(jobs):.4f}",
        "p3": f"{total_p3 / len(jobs):.4f}",
        "p5": f"{total_p5 / len(jobs):.4f}",
        "mrr": f"{total_mrr / len(jobs):.4f}",
        "latency_ms": f"{latency_ms:.4f} ms"
    }

def print_table(rows, headers):
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(val)))

    sep = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"
    header_str = "| " + " | ".join(f"{h:<{col_widths[i]}}" for i, h in enumerate(headers)) + " |"

    print(sep)
    print(header_str)
    print(sep)
    for row in rows:
        row_str = "| " + " | ".join(f"{str(val):<{col_widths[i]}}" for i, val in enumerate(row)) + " |"
        print(row_str)
    print(sep)

def main():
    print("\n" + "=" * 80)
    print("      QUICK-HIRE SCIENTIFIC BENCHMARK & EVALUATION ENGINE (PYTHON 3)")
    print("=" * 80 + "\n")

    models = [
        ("Baseline: BM25 (Lexical)", score_bm25),
        ("Baseline: Dense Cosine (Semantic)", score_dense_cosine),
        ("Baseline: Jaccard Skill Overlap", score_skill_jaccard),
        ("QuickHire: Fallback Engine (Offline)", score_quickhire_fallback),
        ("QuickHire: Hybrid Architecture (Proposed)", lambda j, c: score_quickhire_hybrid(j, c, 0.45, 0.45, 10.0))
    ]

    results = [evaluate_model(name, fn) for name, fn in models]
    table_rows = [
        [r["model"], r["ndcg1"], r["ndcg3"], r["ndcg5"], r["p1"], r["p3"], r["p5"], r["mrr"], r["latency_ms"]]
        for r in results
    ]
    headers = ["Model", "NDCG@1", "NDCG@3", "NDCG@5", "P@1", "P@3", "P@5", "MRR", "Latency"]
    print_table(table_rows, headers)

    print("\n" + "=" * 80)
    print("                            ABLATION STUDY")
    print("=" * 80 + "\n")

    ablations = [
        ("1. Dense Semantic Only (alpha=1.0, beta=0, gamma=0)", lambda j, c: score_quickhire_hybrid(j, c, 1.0, 0.0, 0.0)),
        ("2. Skill Overlap Only (alpha=0, beta=1.0, gamma=0)", lambda j, c: score_quickhire_hybrid(j, c, 0.0, 1.0, 0.0)),
        ("3. Hybrid without Role Bonus (alpha=0.50, beta=0.50, gamma=0)", lambda j, c: score_quickhire_hybrid(j, c, 0.50, 0.50, 0.0)),
        ("4. Full Proposed Hybrid (alpha=0.45, beta=0.45, gamma=10)", lambda j, c: score_quickhire_hybrid(j, c, 0.45, 0.45, 10.0))
    ]

    ablation_results = [evaluate_model(name, fn) for name, fn in ablations]
    ablation_rows = [
        [r["model"], r["ndcg3"], r["ndcg5"], r["p3"], r["p5"], r["mrr"]]
        for r in ablation_results
    ]
    ablation_headers = ["Ablation Configuration", "NDCG@3", "NDCG@5", "P@3", "P@5", "MRR"]
    print_table(ablation_rows, ablation_headers)

    print("\n[SUCCESS] Benchmark evaluation successfully completed via Python 3.")

if __name__ == "__main__":
    main()
