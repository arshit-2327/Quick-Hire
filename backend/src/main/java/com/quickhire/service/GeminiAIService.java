package com.quickhire.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickhire.model.CandidateProfile;
import com.quickhire.model.Job;
import com.quickhire.util.VectorMathUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeminiAIService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAIService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    @Value("${gemini.embedding.model:text-embedding-004}")
    private String embeddingModel;

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getApiKey() {
        return this.apiKey;
    }

    public boolean isApiKeyConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty() && !apiKey.contains("YOUR_API_KEY");
    }

    /**
     * DTO representing AI parsed resume results
     */
    public static class ParsedResumeData {
        public String fullName;
        public String email;
        public String phone;
        public List<String> extractedSkills = new ArrayList<>();
        public List<String> inferredRoles = new ArrayList<>();
        public String experienceSummary;
        public String education;
    }

    /**
     * DTO representing AI Match evaluation
     */
    public static class MatchAnalysis {
        public List<String> matchedSkills = new ArrayList<>();
        public List<String> missingSkills = new ArrayList<>();
        public String fitSummary;
        public String advice;
        public boolean roleAligned;
    }

    /**
     * Parses resume text into structured skills, inferred roles, and contact info
     */
    public ParsedResumeData parseResume(String resumeText) {
        if (isApiKeyConfigured()) {
            try {
                ParsedResumeData data = callGeminiForResume(resumeText);
                if (data != null && !data.extractedSkills.isEmpty()) {
                    return data;
                }
            } catch (Exception e) {
                log.warn("Gemini API call failed, falling back to built-in NLP extractor: {}", e.getMessage());
            }
        }
        return fallbackParseResume(resumeText);
    }

    /**
     * Generates a 768-dimensional NLP vector embedding for the given text
     */
    public List<Double> generateEmbedding(String text) {
        if (isApiKeyConfigured()) {
            try {
                List<Double> vector = callGeminiEmbedding(text);
                if (vector != null && !vector.isEmpty()) {
                    return vector;
                }
            } catch (Exception e) {
                log.warn("Gemini embedding API call failed, falling back to local NLP vectorizer: {}", e.getMessage());
            }
        }
        return VectorMathUtil.generateFallbackVector(text);
    }

    /**
     * Analyzes candidate fit with a job: matched skills, gap analysis, and recommendations
     */
    public MatchAnalysis analyzeMatch(CandidateProfile candidate, Job job) {
        if (isApiKeyConfigured()) {
            try {
                MatchAnalysis analysis = callGeminiForMatchAnalysis(candidate, job);
                if (analysis != null) {
                    return analysis;
                }
            } catch (Exception e) {
                log.warn("Gemini match analysis call failed, using built-in NLP matching: {}", e.getMessage());
            }
        }
        return fallbackAnalyzeMatch(candidate, job);
    }

    // ==========================================
    // GEMINI REST API INTEGRATION
    // ==========================================

    @SuppressWarnings("null")
    private ParsedResumeData callGeminiForResume(String resumeText) throws Exception {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, apiKey);

        String prompt = "You are an expert AI Technical Recruiter & ATS parser.\n"
                + "Extract structured data from the following resume text.\n"
                + "Return ONLY a valid JSON object without markdown code blocks, with this exact schema:\n"
                + "{\n"
                + "  \"fullName\": \"Candidate Name\",\n"
                + "  \"email\": \"email@example.com\",\n"
                + "  \"phone\": \"phone number\",\n"
                + "  \"extractedSkills\": [\"React\", \"Spring Boot\", \"Java\", \"MySQL\", ...],\n"
                + "  \"inferredRoles\": [\"Full Stack Developer\", \"Backend Developer\", \"Frontend Developer\", ...],\n"
                + "  \"experienceSummary\": \"Summary of candidate experience and projects\",\n"
                + "  \"education\": \"Degree and university/college\"\n"
                + "}\n"
                + "IMPORTANT for inferredRoles: Deduce all suitable technical roles based on their skill set. "
                + "For example: React + Spring Boot -> Frontend Developer, Backend Developer, Full Stack Developer.\n\n"
                + "Resume Text:\n" + resumeText;

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.1,
                        "response_mime_type", "application/json"
                )
        );

        String response = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(response);
        String textContent = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        
        return objectMapper.readValue(textContent, ParsedResumeData.class);
    }

    @SuppressWarnings("null")
    private List<Double> callGeminiEmbedding(String text) throws Exception {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:embedContent?key=%s",
                embeddingModel, apiKey);

        // Truncate text if too long (max ~2048 tokens)
        String truncated = text.length() > 3000 ? text.substring(0, 3000) : text;

        Map<String, Object> body = Map.of(
                "content", Map.of(
                        "parts", List.of(Map.of("text", truncated))
                )
        );

        String response = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(response);
        JsonNode valuesNode = root.path("embedding").path("values");

        List<Double> vector = new ArrayList<>();
        if (valuesNode.isArray()) {
            for (JsonNode val : valuesNode) {
                vector.add(val.asDouble());
            }
        }
        return vector;
    }

    @SuppressWarnings("null")
    private MatchAnalysis callGeminiForMatchAnalysis(CandidateProfile candidate, Job job) throws Exception {
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, apiKey);

        String prompt = "Compare this Candidate Profile with the Job Listing.\n"
                + "Candidate Skills: " + String.join(", ", candidate.getExtractedSkills()) + "\n"
                + "Candidate Inferred Roles: " + String.join(", ", candidate.getInferredRoles()) + "\n"
                + "Job Title: " + job.getTitle() + "\n"
                + "Job Required Skills: " + String.join(", ", job.getRequiredSkills()) + "\n"
                + "Job Description: " + job.getDescription() + "\n\n"
                + "Return ONLY a valid JSON object without markdown code blocks with this schema:\n"
                + "{\n"
                + "  \"matchedSkills\": [\"skill1\", \"skill2\"],\n"
                + "  \"missingSkills\": [\"skill3\"],\n"
                + "  \"fitSummary\": \"1-2 sentences on why this candidate is a good or partial fit\",\n"
                + "  \"advice\": \"Actionable advice on what skill to add or learn to improve fit for this role\",\n"
                + "  \"roleAligned\": true\n"
                + "}";

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.1,
                        "response_mime_type", "application/json"
                )
        );

        String response = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(response);
        String textContent = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        
        return objectMapper.readValue(textContent, MatchAnalysis.class);
    }

    // ==========================================
    // BUILT-IN OFFLINE NLP & INFERENCE ENGINE
    // ==========================================

    private static final List<String> KNOWN_TECH_SKILLS = List.of(
            "Java", "Spring Boot", "Spring", "Hibernate", "Microservices", "REST API",
            "React", "React.js", "Redux", "Angular", "Vue", "Vue.js", "HTML", "CSS", "JavaScript", "TypeScript", "Tailwind CSS",
            "Node.js", "Express", "Python", "Django", "FastAPI", "Flask",
            "C++", "C#", ".NET", "PHP", "Go", "Golang", "Rust",
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "SQL",
            "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub", "CI/CD", "Linux",
            "Machine Learning", "NLP", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy"
    );

    private ParsedResumeData fallbackParseResume(String resumeText) {
        ParsedResumeData data = new ParsedResumeData();
        String lower = resumeText.toLowerCase();

        // Email regex
        Pattern emailPattern = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}");
        Matcher emailMatcher = emailPattern.matcher(resumeText);
        if (emailMatcher.find()) {
            data.email = emailMatcher.group();
        } else {
            data.email = "candidate@example.com";
        }

        // Phone regex
        Pattern phonePattern = Pattern.compile("(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}");
        Matcher phoneMatcher = phonePattern.matcher(resumeText);
        if (phoneMatcher.find()) {
            data.phone = phoneMatcher.group();
        } else {
            data.phone = "+91 9876543210";
        }

        // Name extraction: first non-empty line
        String[] lines = resumeText.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.length() > 2 && trimmed.length() < 50 && !trimmed.contains("@") && !trimmed.toLowerCase().contains("resume")) {
                data.fullName = trimmed;
                break;
            }
        }
        if (data.fullName == null) {
            data.fullName = "Candidate";
        }

        // Skill extraction against known dictionary
        Set<String> detectedSkills = new LinkedHashSet<>();
        for (String skill : KNOWN_TECH_SKILLS) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(skill) + "\\b", Pattern.CASE_INSENSITIVE);
            if (pattern.matcher(resumeText).find()) {
                detectedSkills.add(skill);
            }
        }
        data.extractedSkills = new ArrayList<>(detectedSkills);

        // Role Inference based on extracted skills
        Set<String> roles = new LinkedHashSet<>();
        boolean hasFrontend = detectedSkills.contains("React") || detectedSkills.contains("React.js") || 
                              detectedSkills.contains("Angular") || detectedSkills.contains("Vue") || 
                              detectedSkills.contains("HTML") || detectedSkills.contains("JavaScript");
        boolean hasBackend = detectedSkills.contains("Java") || detectedSkills.contains("Spring Boot") || 
                             detectedSkills.contains("Node.js") || detectedSkills.contains("Python") || 
                             detectedSkills.contains("Microservices") || detectedSkills.contains("Django");
        boolean hasData = detectedSkills.contains("Machine Learning") || detectedSkills.contains("NLP") || 
                          detectedSkills.contains("Python") || detectedSkills.contains("Pandas");
        boolean hasDevOps = detectedSkills.contains("Docker") || detectedSkills.contains("Kubernetes") || 
                            detectedSkills.contains("AWS") || detectedSkills.contains("CI/CD");

        if (hasFrontend && hasBackend) {
            roles.add("Full Stack Developer");
        }
        if (hasFrontend) {
            roles.add("Frontend Developer");
        }
        if (hasBackend) {
            roles.add("Backend Developer");
            roles.add("Java Developer");
        }
        if (hasData) {
            roles.add("Data Scientist / ML Engineer");
        }
        if (hasDevOps) {
            roles.add("DevOps / Cloud Engineer");
        }

        if (roles.isEmpty()) {
            roles.add("Software Engineer");
        }
        data.inferredRoles = new ArrayList<>(roles);

        data.experienceSummary = "Demonstrated practical knowledge in " + String.join(", ", data.extractedSkills);
        data.education = lower.contains("b.tech") || lower.contains("bachelor") ? "B.Tech in Computer Science" : "Bachelor of Engineering / Technology";

        return data;
    }

    private MatchAnalysis fallbackAnalyzeMatch(CandidateProfile candidate, Job job) {
        MatchAnalysis analysis = new MatchAnalysis();
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        Set<String> candidateSkills = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        candidateSkills.addAll(candidate.getExtractedSkills());

        for (String req : job.getRequiredSkills()) {
            if (candidateSkills.contains(req) || candidateSkills.stream().anyMatch(s -> s.equalsIgnoreCase(req))) {
                matched.add(req);
            } else {
                missing.add(req);
            }
        }

        analysis.matchedSkills = matched;
        analysis.missingSkills = missing;

        // Check role alignment by comparing core role concepts (e.g. "Full Stack", "Backend", "Frontend")
        String jobTitleLower = job.getTitle().toLowerCase();
        analysis.roleAligned = candidate.getInferredRoles().stream()
                .anyMatch(r -> {
                    String rLower = r.toLowerCase();
                    String coreRole = rLower.replace("developer", "").replace("engineer", "").trim();
                    return (!coreRole.isEmpty() && jobTitleLower.contains(coreRole)) 
                            || (jobTitleLower.contains("software") && rLower.contains("software"));
                });

        if (!missing.isEmpty()) {
            analysis.fitSummary = String.format("Matches %d of %d required core competencies for %s.",
                    matched.size(), job.getRequiredSkills().size(), job.getTitle());
            analysis.advice = "To maximize your chances for this position, consider strengthening experience in: " 
                    + String.join(", ", missing) + ".";
        } else {
            analysis.fitSummary = "Outstanding alignment across all required technical competencies for " + job.getTitle() + "!";
            analysis.advice = "Your profile covers all core technical requirements. High recommendation to apply.";
        }

        return analysis;
    }
}
