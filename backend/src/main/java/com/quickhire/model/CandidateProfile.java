package com.quickhire.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "candidate_profiles")
public class CandidateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String fullName;
    private String email;
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String rawResumeText;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "candidate_skills", joinColumns = @JoinColumn(name = "candidate_id"))
    @Column(name = "skill")
    private List<String> extractedSkills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "candidate_roles", joinColumns = @JoinColumn(name = "candidate_id"))
    @Column(name = "inferred_role")
    private List<String> inferredRoles = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String experienceSummary;

    private String education;

    @Column(columnDefinition = "TEXT")
    private String embeddingJson; // NLP 768-dim vector embedding

    private String resumeFileName;

    private LocalDateTime createdAt = LocalDateTime.now();

    public CandidateProfile() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRawResumeText() { return rawResumeText; }
    public void setRawResumeText(String rawResumeText) { this.rawResumeText = rawResumeText; }

    public List<String> getExtractedSkills() { return extractedSkills; }
    public void setExtractedSkills(List<String> extractedSkills) { this.extractedSkills = extractedSkills; }

    public List<String> getInferredRoles() { return inferredRoles; }
    public void setInferredRoles(List<String> inferredRoles) { this.inferredRoles = inferredRoles; }

    public String getExperienceSummary() { return experienceSummary; }
    public void setExperienceSummary(String experienceSummary) { this.experienceSummary = experienceSummary; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }

    public String getEmbeddingJson() { return embeddingJson; }
    public void setEmbeddingJson(String embeddingJson) { this.embeddingJson = embeddingJson; }

    public String getResumeFileName() { return resumeFileName; }
    public void setResumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
