package com.quickhire.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;

public class VectorMathUtil {

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final int DEFAULT_DIMENSION = 768;

    /**
     * Calculates Cosine Similarity between two vector lists:
     * cos(theta) = (A . B) / (||A|| * ||B||)
     * Returns a value between 0.0 and 1.0 (or -1.0 to 1.0)
     */
    public static double cosineSimilarity(List<Double> vectorA, List<Double> vectorB) {
        if (vectorA == null || vectorB == null || vectorA.isEmpty() || vectorB.isEmpty()) {
            return 0.0;
        }

        int dim = Math.min(vectorA.size(), vectorB.size());
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < dim; i++) {
            double a = vectorA.get(i);
            double b = vectorB.get(i);
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }

        double similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        // Clamp to [0.0, 1.0] for ATS percentage representation
        return Math.max(0.0, Math.min(1.0, similarity));
    }

    /**
     * Converts JSON string to Double List
     */
    public static List<Double> parseVector(String json) {
        if (json == null || json.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return mapper.readValue(json, new TypeReference<List<Double>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /**
     * Converts Double List to JSON string
     */
    public static String toJson(List<Double> vector) {
        try {
            return mapper.writeValueAsString(vector);
        } catch (Exception e) {
            return "[]";
        }
    }

    /**
     * Generates a 768-dimensional deterministic semantic feature vector
     * using term-frequency hashing & n-gram projection.
     * Used when external Gemini API is unreachable or offline.
     */
    public static List<Double> generateFallbackVector(String text) {
        List<Double> vector = new ArrayList<>(DEFAULT_DIMENSION);
        for (int i = 0; i < DEFAULT_DIMENSION; i++) {
            vector.add(0.0);
        }

        if (text == null || text.trim().isEmpty()) {
            return vector;
        }

        String cleaned = text.toLowerCase().replaceAll("[^a-z0-9\\s]", " ");
        String[] tokens = cleaned.split("\\s+");

        for (String token : tokens) {
            if (token.length() < 2) continue;
            int hash1 = Math.abs(token.hashCode()) % DEFAULT_DIMENSION;
            int hash2 = Math.abs((token + "_salt").hashCode()) % DEFAULT_DIMENSION;
            
            vector.set(hash1, vector.get(hash1) + 1.0);
            vector.set(hash2, vector.get(hash2) + 0.5);
        }

        // L2 Normalization
        double sumSq = 0.0;
        for (Double val : vector) {
            sumSq += val * val;
        }
        if (sumSq > 0.0) {
            double magnitude = Math.sqrt(sumSq);
            for (int i = 0; i < DEFAULT_DIMENSION; i++) {
                vector.set(i, vector.get(i) / magnitude);
            }
        }

        return vector;
    }
}
