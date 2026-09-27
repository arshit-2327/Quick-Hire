package com.quickhire;

import com.quickhire.util.VectorMathUtil;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class VectorMathUtilTest {

    @Test
    void testCosineSimilarityIdenticalVectors() {
        List<Double> v1 = List.of(1.0, 2.0, 3.0);
        List<Double> v2 = List.of(1.0, 2.0, 3.0);

        double similarity = VectorMathUtil.cosineSimilarity(v1, v2);
        assertEquals(1.0, similarity, 0.001, "Identical vectors should have cosine similarity of 1.0");
    }

    @Test
    void testCosineSimilarityOrthogonalVectors() {
        List<Double> v1 = List.of(1.0, 0.0);
        List<Double> v2 = List.of(0.0, 1.0);

        double similarity = VectorMathUtil.cosineSimilarity(v1, v2);
        assertEquals(0.0, similarity, 0.001, "Orthogonal vectors should have cosine similarity of 0.0");
    }

    @Test
    void testFallbackVectorGeneration() {
        List<Double> vJava = VectorMathUtil.generateFallbackVector("Java Spring Boot Microservices");
        List<Double> vReact = VectorMathUtil.generateFallbackVector("React Tailwind JavaScript Frontend");
        List<Double> vJava2 = VectorMathUtil.generateFallbackVector("Spring Boot Java REST API");

        assertNotNull(vJava);
        assertEquals(768, vJava.size());

        double simJavaJava = VectorMathUtil.cosineSimilarity(vJava, vJava2);
        double simJavaReact = VectorMathUtil.cosineSimilarity(vJava, vReact);

        assertTrue(simJavaJava > simJavaReact, "Java text should be more similar to Java text than React text");
    }
}
