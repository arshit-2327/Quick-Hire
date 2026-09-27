package com.quickhire.controller;

import com.quickhire.model.CandidateProfile;
import com.quickhire.repository.CandidateProfileRepository;
import com.quickhire.service.GeminiAIService;
import com.quickhire.service.ResumeParserService;
import com.quickhire.util.VectorMathUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private static final Logger log = LoggerFactory.getLogger(ResumeController.class);

    private final ResumeParserService resumeParserService;
    private final GeminiAIService geminiAIService;
    private final CandidateProfileRepository candidateRepository;

    public ResumeController(ResumeParserService resumeParserService,
                            GeminiAIService geminiAIService,
                            CandidateProfileRepository candidateRepository) {
        this.resumeParserService = resumeParserService;
        this.geminiAIService = geminiAIService;
        this.candidateRepository = candidateRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "userId", required = false) Long userId) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Please select a valid resume file (PDF or TXT)."));
            }

            // 1. Extract raw text via PDFBox
            String rawText = resumeParserService.extractText(file);
            if (rawText.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Could not extract text from the file. Please ensure it is not an image-only scan."));
            }

            // 2. Parse candidate skills & infer roles via Gemini AI
            GeminiAIService.ParsedResumeData parsedData = geminiAIService.parseResume(rawText);

            // 3. Generate NLP 768-dim vector embedding
            String embeddingInput = parsedData.fullName + " " + String.join(" ", parsedData.extractedSkills) + " " + rawText;
            List<Double> vector = geminiAIService.generateEmbedding(embeddingInput);

            // 4. Check if candidate profile already exists for this user (Replace / update)
            CandidateProfile candidate;
            if (userId != null) {
                Optional<CandidateProfile> existing = candidateRepository.findByUserId(userId);
                candidate = existing.orElseGet(CandidateProfile::new);
                candidate.setUserId(userId);
            } else {
                candidate = new CandidateProfile();
            }

            candidate.setFullName(parsedData.fullName);
            candidate.setEmail(parsedData.email);
            candidate.setPhone(parsedData.phone);
            candidate.setRawResumeText(rawText);
            candidate.setExtractedSkills(parsedData.extractedSkills);
            candidate.setInferredRoles(parsedData.inferredRoles);
            candidate.setExperienceSummary(parsedData.experienceSummary);
            candidate.setEducation(parsedData.education);
            candidate.setEmbeddingJson(VectorMathUtil.toJson(vector));
            candidate.setResumeFileName(file.getOriginalFilename());

            CandidateProfile saved = candidateRepository.save(candidate);
            log.info("Candidate profile saved (ID: {}, UserID: {}). Inferred roles: {}", saved.getId(), saved.getUserId(), saved.getInferredRoles());

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error processing resume upload", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Error processing resume: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CandidateProfile> getProfile(@PathVariable Long id) {
        return candidateRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getProfileByUserId(@PathVariable Long userId) {
        Optional<CandidateProfile> profile = candidateRepository.findByUserId(userId);
        if (profile.isPresent()) {
            return ResponseEntity.ok(profile.get());
        }
        return ResponseEntity.ok(Map.of("hasResume", false));
    }

    @Transactional
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<?> deleteResumeByUserId(@PathVariable Long userId) {
        Optional<CandidateProfile> profile = candidateRepository.findByUserId(userId);
        if (profile.isPresent()) {
            candidateRepository.delete(profile.get());
            log.info("Resume deleted for userId: {}", userId);
            return ResponseEntity.ok(Map.of("message", "Resume deleted successfully. You can now upload a fresh resume."));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "No resume found to delete."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProfile(@PathVariable Long id) {
        if (candidateRepository.existsById(id)) {
            candidateRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Profile deleted successfully."));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/all")
    public ResponseEntity<List<CandidateProfile>> getAllCandidates() {
        return ResponseEntity.ok(candidateRepository.findAllByOrderByCreatedAtDesc());
    }
}
