package com.quickhire.controller;

import com.quickhire.model.Job;
import com.quickhire.model.User;
import com.quickhire.repository.JobRepository;
import com.quickhire.repository.UserRepository;
import com.quickhire.service.GeminiAIService;
import com.quickhire.util.VectorMathUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/jobs")
@SuppressWarnings("null")
public class JobController {

    private static final Logger log = LoggerFactory.getLogger(JobController.class);

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final GeminiAIService geminiAIService;

    public JobController(JobRepository jobRepository, UserRepository userRepository, GeminiAIService geminiAIService) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.geminiAIService = geminiAIService;
    }

    @GetMapping
    public ResponseEntity<List<Job>> getAllJobs() {
        return ResponseEntity.ok(jobRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJobById(@PathVariable Long id) {
        return jobRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createJob(@RequestBody Job job) {
        try {
            // Requirement 2: Must be logged in as a recruiter to post jobs
            if (job.getRecruiterId() == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    Map.of("message", "Authentication required. You must create and log into a Recruiter account to post a job opening.")
                );
            }

            Optional<User> recruiterOpt = userRepository.findById(job.getRecruiterId());
            if (recruiterOpt.isEmpty() || !"RECRUITER".equalsIgnoreCase(recruiterOpt.get().getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    Map.of("message", "Permission denied. Only accounts registered as Recruiters are authorized to create job openings.")
                );
            }

            User recruiter = recruiterOpt.get();
            if ((job.getCompany() == null || job.getCompany().trim().isEmpty()) && recruiter.getCompanyName() != null) {
                job.setCompany(recruiter.getCompanyName());
            }

            // Generate NLP vector embedding for the job
            String embeddingInput = job.getTitle() + " " + String.join(" ", job.getRequiredSkills()) + " " + job.getDescription();
            List<Double> vector = geminiAIService.generateEmbedding(embeddingInput);
            job.setEmbeddingJson(VectorMathUtil.toJson(vector));

            Job saved = jobRepository.save(job);
            log.info("New job created: '{}' by recruiter '{}' (ID: {})", saved.getTitle(), recruiter.getName(), saved.getId());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Failed to create job", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to create job: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable Long id) {
        if (jobRepository.existsById(id)) {
            jobRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
