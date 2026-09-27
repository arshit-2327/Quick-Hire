package com.quickhire.controller;

import com.quickhire.service.GeminiAIService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final GeminiAIService geminiAIService;

    @Value("${spring.datasource.url:jdbc:h2:mem:quickhiredb}")
    private String datasourceUrl;

    public ConfigController(GeminiAIService geminiAIService) {
        this.geminiAIService = geminiAIService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        boolean isPostgres = datasourceUrl != null && datasourceUrl.contains("postgresql");
        return ResponseEntity.ok(Map.of(
                "geminiConfigured", geminiAIService.isApiKeyConfigured(),
                "databaseType", isPostgres ? "PostgreSQL" : "H2 (In-Memory Fallback)",
                "geminiModel", "gemini-1.5-flash / gemini-2.0-flash",
                "embeddingModel", "text-embedding-004 (768-dim Vector)",
                "status", "Operational"
        ));
    }

    @PostMapping("/gemini-key")
    public ResponseEntity<Map<String, Object>> setGeminiKey(@RequestBody Map<String, String> body) {
        String key = body.get("apiKey");
        if (key != null && !key.trim().isEmpty()) {
            geminiAIService.setApiKey(key.trim());
            return ResponseEntity.ok(Map.of("success", true, "message", "Gemini API key updated successfully!"));
        }
        return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Key cannot be empty"));
    }
}
