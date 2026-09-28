package com.quickhire.controller;

import com.quickhire.model.CandidateProfile;
import com.quickhire.model.Job;
import com.quickhire.model.JobApplication;
import com.quickhire.model.MatchResult;
import com.quickhire.model.User;
import com.quickhire.repository.CandidateProfileRepository;
import com.quickhire.repository.JobApplicationRepository;
import com.quickhire.repository.JobRepository;
import com.quickhire.repository.UserRepository;
import com.quickhire.service.JobMatchingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/applications")
@SuppressWarnings("null")
public class JobApplicationController {

    private static final Logger log = LoggerFactory.getLogger(JobApplicationController.class);

    private final JobApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final CandidateProfileRepository candidateRepository;
    private final UserRepository userRepository;
    private final JobMatchingService matchingService;

    public JobApplicationController(JobApplicationRepository applicationRepository,
                                    JobRepository jobRepository,
                                    CandidateProfileRepository candidateRepository,
                                    UserRepository userRepository,
                                    JobMatchingService matchingService) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.candidateRepository = candidateRepository;
        this.userRepository = userRepository;
        this.matchingService = matchingService;
    }

    public static class ApplyRequest {
        private Long jobId;
        private Long userId;

        public Long getJobId() { return jobId; }
        public void setJobId(Long jobId) { this.jobId = jobId; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
    }

    public static class StatusUpdateRequest {
        private String status;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    /**
     * Submit job application (Candidate only)
     */
    @PostMapping("/apply")
    public ResponseEntity<?> applyToJob(@RequestBody ApplyRequest request) {
        try {
            if (request.getJobId() == null || request.getUserId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Job ID and User ID are required."));
            }

            // 1. Verify user exists and is a candidate
            Optional<User> userOpt = userRepository.findById(request.getUserId());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "User account not found. Please log in again."));
            }
            User user = userOpt.get();
            if ("RECRUITER".equalsIgnoreCase(user.getRole())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Recruiters cannot apply for jobs. Please sign in with a Candidate account."));
            }

            // 2. Verify candidate has uploaded a resume
            Optional<CandidateProfile> candidateOpt = candidateRepository.findByUserId(request.getUserId());
            if (candidateOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Please upload your resume in the Candidate Portal first before applying.",
                    "requiresResume", true
                ));
            }
            CandidateProfile candidate = candidateOpt.get();

            // 3. Verify job exists
            Optional<Job> jobOpt = jobRepository.findById(request.getJobId());
            if (jobOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Job job = jobOpt.get();

            // 4. Check if already applied
            if (applicationRepository.existsByJobIdAndUserId(job.getId(), user.getId())) {
                return ResponseEntity.badRequest().body(Map.of("message", "You have already submitted an application for this position."));
            }

            // 5. Calculate ATS Match Score and breakdown
            MatchResult match = matchingService.calculateSingleMatch(candidate, job);

            // 6. Build and persist JobApplication
            JobApplication app = new JobApplication();
            app.setJobId(job.getId());
            app.setJobTitle(job.getTitle());
            app.setCompany(job.getCompany());
            app.setLocation(job.getLocation());
            app.setJobType(job.getJobType());
            app.setSalaryRange(job.getSalaryRange());

            app.setUserId(user.getId());
            app.setCandidateProfileId(candidate.getId());
            app.setCandidateName(candidate.getFullName());
            app.setCandidateEmail(candidate.getEmail());
            app.setCandidatePhone(candidate.getPhone());
            app.setEducation(candidate.getEducation());

            app.setMatchScore(match.getOverallScore());
            app.setCosineSimilarity(match.getCosineSimilarity());
            app.setSkillOverlapScore(match.getSkillOverlapScore());
            app.setMatchedSkills(match.getMatchedSkills());
            app.setMissingSkills(match.getMissingSkills());
            app.setFitSummary(match.getFitSummary());
            app.setStatus("PENDING");
            app.setAppliedAt(LocalDateTime.now());

            JobApplication saved = applicationRepository.save(app);
            log.info("Application #{} submitted by candidate {} for job '{}' with ATS score {}", 
                     saved.getId(), candidate.getFullName(), job.getTitle(), saved.getMatchScore());

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Failed to submit application", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to submit application: " + e.getMessage()));
        }
    }

    /**
     * Retrieve applications for a specific candidate (Candidate Portal)
     * Only returns the applications submitted by this user!
     */
    @GetMapping("/candidate/{userId}")
    public ResponseEntity<List<JobApplication>> getCandidateApplications(@PathVariable Long userId) {
        List<JobApplication> apps = applicationRepository.findByUserIdOrderByAppliedAtDesc(userId);
        return ResponseEntity.ok(apps);
    }

    /**
     * Retrieve applicants for a specific job, ranked by ATS score (Recruiter Portal)
     */
    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<JobApplication>> getJobApplicants(@PathVariable Long jobId) {
        List<JobApplication> applicants = applicationRepository.findByJobIdOrderByMatchScoreDesc(jobId);
        return ResponseEntity.ok(applicants);
    }

    /**
     * Update application status: ACCEPTED or REJECTED (Recruiter only)
     */
    @PatchMapping("/{applicationId}/status")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable Long applicationId,
            @RequestBody StatusUpdateRequest request) {
        try {
            Optional<JobApplication> appOpt = applicationRepository.findById(applicationId);
            if (appOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            JobApplication app = appOpt.get();
            String newStatus = request.getStatus() != null ? request.getStatus().toUpperCase() : "PENDING";
            if (!List.of("PENDING", "ACCEPTED", "REJECTED").contains(newStatus)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Status must be PENDING, ACCEPTED, or REJECTED"));
            }

            app.setStatus(newStatus);
            app.setReviewedAt(LocalDateTime.now());
            JobApplication updated = applicationRepository.save(app);

            log.info("Application #{} status updated to {} for candidate {}", updated.getId(), newStatus, updated.getCandidateName());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Failed to update application status", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Error updating status: " + e.getMessage()));
        }
    }

    /**
     * Get applicant count for a job
     */
    @GetMapping("/stats/job/{jobId}")
    public ResponseEntity<Map<String, Long>> getJobApplicantCount(@PathVariable Long jobId) {
        long count = applicationRepository.countByJobId(jobId);
        return ResponseEntity.ok(Map.of("applicantCount", count));
    }
}
