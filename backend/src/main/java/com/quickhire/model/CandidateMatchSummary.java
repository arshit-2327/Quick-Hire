package com.quickhire.model;

import java.util.ArrayList;
import java.util.List;

public class CandidateMatchSummary {
    private Long candidateId;
    private Long userId;
    private String candidateName;
    private String email;
    private String phone;
    private String education;
    private List<String> inferredRoles = new ArrayList<>();
    private List<String> extractedSkills = new ArrayList<>();
    private double overallScore;
    private double cosineSimilarity;
    private double skillOverlapScore;
    private List<String> matchedSkills = new ArrayList<>();
    private List<String> missingSkills = new ArrayList<>();
    private String fitSummary;
    private boolean roleAligned;

    public CandidateMatchSummary() {}

    // Getters and Setters
    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }

    public List<String> getInferredRoles() { return inferredRoles; }
    public void setInferredRoles(List<String> inferredRoles) { this.inferredRoles = inferredRoles; }

    public List<String> getExtractedSkills() { return extractedSkills; }
    public void setExtractedSkills(List<String> extractedSkills) { this.extractedSkills = extractedSkills; }

    public double getOverallScore() { return overallScore; }
    public void setOverallScore(double overallScore) { this.overallScore = overallScore; }

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

    public boolean isRoleAligned() { return roleAligned; }
    public void setRoleAligned(boolean roleAligned) { this.roleAligned = roleAligned; }
}
