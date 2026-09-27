package com.quickhire.service;

import com.quickhire.model.CandidateMatchSummary;
import com.quickhire.model.CandidateProfile;
import com.quickhire.model.Job;
import com.quickhire.model.MatchResult;
import com.quickhire.repository.CandidateProfileRepository;
import com.quickhire.repository.JobRepository;
import com.quickhire.util.VectorMathUtil;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class JobMatchingService {

    private final JobRepository jobRepository;
    private final CandidateProfileRepository candidateRepository;
    private final GeminiAIService geminiAIService;

    public JobMatchingService(JobRepository jobRepository, 
                              CandidateProfileRepository candidateRepository, 
                              GeminiAIService geminiAIService) {
        this.jobRepository = jobRepository;
        this.candidateRepository = candidateRepository;
        this.geminiAIService = geminiAIService;
    }

    public List<MatchResult> matchJobsForUser(Long userId) {
        CandidateProfile candidate = candidateRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("No resume found for user id: " + userId));
        return matchJobsForCandidate(candidate.getId());
    }

    public List<MatchResult> matchJobsForCandidate(Long candidateId) {
        CandidateProfile candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("Candidate not found with id: " + candidateId));

        List<Job> allJobs = jobRepository.findAll();
        List<Double> candidateVector = VectorMathUtil.parseVector(candidate.getEmbeddingJson());
        if (candidateVector.isEmpty()) {
            candidateVector = geminiAIService.generateEmbedding(
                    candidate.getFullName() + " " + String.join(" ", candidate.getExtractedSkills()) + " " + candidate.getRawResumeText());
            candidate.setEmbeddingJson(VectorMathUtil.toJson(candidateVector));
            candidateRepository.save(candidate);
        }

        List<MatchResult> results = new ArrayList<>();

        for (Job job : allJobs) {
            List<Double> jobVector = VectorMathUtil.parseVector(job.getEmbeddingJson());
            if (jobVector.isEmpty()) {
                jobVector = geminiAIService.generateEmbedding(
                        job.getTitle() + " " + String.join(" ", job.getRequiredSkills()) + " " + job.getDescription());
                job.setEmbeddingJson(VectorMathUtil.toJson(jobVector));
                jobRepository.save(job);
            }

            // 1. NLP Vector Cosine Similarity (0.0 to 1.0)
            double cosSim = VectorMathUtil.cosineSimilarity(candidateVector, jobVector);
            double cosSimPercent = Math.round(cosSim * 1000.0) / 10.0;

            // 2. Skill Overlap & AI Analysis
            GeminiAIService.MatchAnalysis analysis = geminiAIService.analyzeMatch(candidate, job);
            double skillOverlapPercent = 0.0;
            if (!job.getRequiredSkills().isEmpty()) {
                skillOverlapPercent = ((double) analysis.matchedSkills.size() / job.getRequiredSkills().size()) * 100.0;
            }

            // 3. Hybrid Scoring Formula:
            // Overall = 45% Vector Cosine Similarity + 45% Skill Overlap + 10% Role Alignment
            double roleBonus = analysis.roleAligned ? 10.0 : 0.0;
            double compositeScore = (cosSimPercent * 0.45) + (skillOverlapPercent * 0.45) + roleBonus;
            double finalScore = Math.min(100.0, Math.max(0.0, Math.round(compositeScore * 10.0) / 10.0));

            MatchResult result = new MatchResult();
            result.setJobId(job.getId());
            result.setJobTitle(job.getTitle());
            result.setCompany(job.getCompany());
            result.setLocation(job.getLocation());
            result.setJobType(job.getJobType());
            result.setExperienceLevel(job.getExperienceLevel());
            result.setSalaryRange(job.getSalaryRange());
            result.setDescription(job.getDescription());
            result.setRequiredSkills(job.getRequiredSkills());
            
            result.setOverallScore(finalScore);
            result.setCosineSimilarity(cosSimPercent);
            result.setSkillOverlapScore(Math.round(skillOverlapPercent * 10.0) / 10.0);
            
            result.setMatchedSkills(analysis.matchedSkills);
            result.setMissingSkills(analysis.missingSkills);
            result.setFitSummary(analysis.fitSummary);
            result.setImprovementAdvice(analysis.advice);
            result.setRoleAligned(analysis.roleAligned);

            results.add(result);
        }

        // Sort descending by overall match score
        results.sort((a, b) -> Double.compare(b.getOverallScore(), a.getOverallScore()));
        return results;
    }

    public List<CandidateMatchSummary> matchCandidatesForJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with id: " + jobId));

        List<CandidateProfile> allCandidates = candidateRepository.findAll();
        List<Double> jobVector = VectorMathUtil.parseVector(job.getEmbeddingJson());
        if (jobVector.isEmpty()) {
            jobVector = geminiAIService.generateEmbedding(
                    job.getTitle() + " " + String.join(" ", job.getRequiredSkills()) + " " + job.getDescription());
            job.setEmbeddingJson(VectorMathUtil.toJson(jobVector));
            jobRepository.save(job);
        }

        List<CandidateMatchSummary> summaries = new ArrayList<>();

        for (CandidateProfile candidate : allCandidates) {
            List<Double> candidateVector = VectorMathUtil.parseVector(candidate.getEmbeddingJson());
            if (candidateVector.isEmpty()) {
                candidateVector = geminiAIService.generateEmbedding(
                        candidate.getFullName() + " " + String.join(" ", candidate.getExtractedSkills()) + " " + candidate.getRawResumeText());
                candidate.setEmbeddingJson(VectorMathUtil.toJson(candidateVector));
                candidateRepository.save(candidate);
            }

            double cosSim = VectorMathUtil.cosineSimilarity(candidateVector, jobVector);
            double cosSimPercent = Math.round(cosSim * 1000.0) / 10.0;

            GeminiAIService.MatchAnalysis analysis = geminiAIService.analyzeMatch(candidate, job);
            double skillOverlapPercent = 0.0;
            if (!job.getRequiredSkills().isEmpty()) {
                skillOverlapPercent = ((double) analysis.matchedSkills.size() / job.getRequiredSkills().size()) * 100.0;
            }

            double roleBonus = analysis.roleAligned ? 10.0 : 0.0;
            double compositeScore = (cosSimPercent * 0.45) + (skillOverlapPercent * 0.45) + roleBonus;
            double finalScore = Math.min(100.0, Math.max(0.0, Math.round(compositeScore * 10.0) / 10.0));

            CandidateMatchSummary summary = new CandidateMatchSummary();
            summary.setCandidateId(candidate.getId());
            summary.setUserId(candidate.getUserId());
            summary.setCandidateName(candidate.getFullName());
            summary.setEmail(candidate.getEmail());
            summary.setPhone(candidate.getPhone());
            summary.setEducation(candidate.getEducation());
            summary.setInferredRoles(candidate.getInferredRoles());
            summary.setExtractedSkills(candidate.getExtractedSkills());
            summary.setOverallScore(finalScore);
            summary.setCosineSimilarity(cosSimPercent);
            summary.setSkillOverlapScore(Math.round(skillOverlapPercent * 10.0) / 10.0);
            summary.setMatchedSkills(analysis.matchedSkills);
            summary.setMissingSkills(analysis.missingSkills);
            summary.setFitSummary(analysis.fitSummary);
            summary.setRoleAligned(analysis.roleAligned);

            summaries.add(summary);
        }

        summaries.sort((a, b) -> Double.compare(b.getOverallScore(), a.getOverallScore()));
        return summaries;
    }
}
