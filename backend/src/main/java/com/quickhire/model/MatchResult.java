package com.quickhire.model;

import java.util.ArrayList;
import java.util.List;

public class MatchResult {
    private Long jobId;
    private String jobTitle;
    private String company;
    private String location;
    private String jobType;
    private String experienceLevel;
    private String salaryRange;
    private String description;
    private List<String> requiredSkills = new ArrayList<>();
    
    // Scores
    private double overallScore; // 0 to 100
    private double cosineSimilarity; // 0 to 100
    private double skillOverlapScore; // 0 to 100

    // Skill breakdown
    private List<String> matchedSkills = new ArrayList<>();
    private List<String> missingSkills = new ArrayList<>();

    // AI feedback
    private String fitSummary;
    private String improvementAdvice;
    private boolean roleAligned;

    public MatchResult() {}

    // Getters and Setters
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

    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

    public String getSalaryRange() { return salaryRange; }
    public void setSalaryRange(String salaryRange) { this.salaryRange = salaryRange; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(List<String> requiredSkills) { this.requiredSkills = requiredSkills; }

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

    public String getImprovementAdvice() { return improvementAdvice; }
    public void setImprovementAdvice(String improvementAdvice) { this.improvementAdvice = improvementAdvice; }

    public boolean isRoleAligned() { return roleAligned; }
    public void setRoleAligned(boolean roleAligned) { this.roleAligned = roleAligned; }
}
