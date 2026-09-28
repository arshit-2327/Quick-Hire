package com.quickhire.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job_applications")
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long jobId;

    private String jobTitle;
    private String company;
    private String location;
    private String jobType;
    private String salaryRange;

    @Column(nullable = false)
    private Long userId; // Candidate's account user ID

    private Long candidateProfileId;
    private String candidateName;
    private String candidateEmail;
    private String candidatePhone;
    private String education;

    private double matchScore; // 0.0 to 100.0
    private double cosineSimilarity;
    private double skillOverlapScore;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "application_matched_skills", joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "skill")
    private List<String> matchedSkills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "application_missing_skills", joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "skill")
    private List<String> missingSkills = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String fitSummary;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED

    private LocalDateTime appliedAt = LocalDateTime.now();
    private LocalDateTime reviewedAt;

    public JobApplication() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }

    public String getSalaryRange() { return salaryRange; }
    public void setSalaryRange(String salaryRange) { this.salaryRange = salaryRange; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getCandidateProfileId() { return candidateProfileId; }
    public void setCandidateProfileId(Long candidateProfileId) { this.candidateProfileId = candidateProfileId; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getCandidateEmail() { return candidateEmail; }
    public void setCandidateEmail(String candidateEmail) { this.candidateEmail = candidateEmail; }

    public String getCandidatePhone() { return candidatePhone; }
    public void setCandidatePhone(String candidatePhone) { this.candidatePhone = candidatePhone; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }

    public double getMatchScore() { return matchScore; }
    public void setMatchScore(double matchScore) { this.matchScore = matchScore; }

    public double getCosineSimilarity() { return cosineSimilarity; }
    public void setCosineSimilarity(double cosineSimilarity) { this.cosineSimilarity = cosineSimilarity; }

    public double getSkillOverlapScore() { return skillOverlapScore; }
    public void setSkillOverlapScore(double skillOverlapScore) { this.skillOverlapScore = skillOverlapScore; }

    public List<String> getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; }

    public List<String> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; }

    public String getFitSummary() { return fitSummary; }
    public void setFitSummary(String fitSummary) { this.fitSummary = fitSummary; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}
