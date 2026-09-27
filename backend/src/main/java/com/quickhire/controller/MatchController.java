package com.quickhire.controller;

import com.quickhire.model.CandidateMatchSummary;
import com.quickhire.model.MatchResult;
import com.quickhire.service.JobMatchingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final JobMatchingService matchingService;

    public MatchController(JobMatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<MatchResult>> getMatchedJobsForCandidate(@PathVariable Long candidateId) {
        try {
            List<MatchResult> matches = matchingService.matchJobsForCandidate(candidateId);
            return ResponseEntity.ok(matches);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getMatchedJobsForUser(@PathVariable Long userId) {
        try {
            List<MatchResult> matches = matchingService.matchJobsForUser(userId);
            return ResponseEntity.ok(matches);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(List.of()); // No resume uploaded yet
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/job/{jobId}/candidates")
    public ResponseEntity<?> getRankedCandidatesForJob(@PathVariable Long jobId) {
        try {
            List<CandidateMatchSummary> candidates = matchingService.matchCandidatesForJob(jobId);
            return ResponseEntity.ok(candidates);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }
}
