package com.quickhire.controller;

import com.quickhire.model.Job;
import com.quickhire.repository.JobRepository;
import com.quickhire.service.GeminiAIService;
import com.quickhire.util.VectorMathUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private static final Logger log = LoggerFactory.getLogger(JobController.class);

    private final JobRepository jobRepository;
    private final GeminiAIService geminiAIService;

    public JobController(JobRepository jobRepository, GeminiAIService geminiAIService) {
        this.jobRepository = jobRepository;
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
    public ResponseEntity<Job> createJob(@RequestBody Job job) {
        try {
            // Generate NLP vector embedding for the job
            String embeddingInput = job.getTitle() + " " + String.join(" ", job.getRequiredSkills()) + " " + job.getDescription();
            List<Double> vector = geminiAIService.generateEmbedding(embeddingInput);
            job.setEmbeddingJson(VectorMathUtil.toJson(vector));

            Job saved = jobRepository.save(job);
            log.info("New job created: '{}' at '{}' with ID {}", saved.getTitle(), saved.getCompany(), saved.getId());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Failed to create job", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        if (jobRepository.existsById(id)) {
            jobRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
