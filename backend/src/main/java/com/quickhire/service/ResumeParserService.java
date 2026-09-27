package com.quickhire.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class ResumeParserService {

    private static final Logger log = LoggerFactory.getLogger(ResumeParserService.class);

    public String extractText(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }

        String originalFilename = file.getOriginalFilename();
        log.info("Parsing resume file: {}", originalFilename);

        if (originalFilename != null && originalFilename.toLowerCase().endsWith(".pdf")) {
            return extractTextFromPdf(file.getBytes());
        } else {
            // Default plain text / markdown / doc text fallback
            return new String(file.getBytes(), StandardCharsets.UTF_8);
        }
    }

    private String extractTextFromPdf(byte[] pdfBytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            if (text == null || text.trim().isEmpty()) {
                log.warn("Extracted PDF text is empty, document might be scanned/image-based.");
                return "";
            }
            return text.trim();
        } catch (Exception e) {
            log.error("Failed to parse PDF resume", e);
            throw new IOException("Failed to extract text from PDF resume: " + e.getMessage(), e);
        }
    }
}
