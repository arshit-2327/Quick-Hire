package com.quickhire.config;

import com.quickhire.model.Job;
import com.quickhire.repository.JobRepository;
import com.quickhire.service.GeminiAIService;
import com.quickhire.util.VectorMathUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import com.quickhire.model.User;
import com.quickhire.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final JobRepository jobRepository;
    private final GeminiAIService geminiAIService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(JobRepository jobRepository,
                           GeminiAIService geminiAIService,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.jobRepository = jobRepository;
        this.geminiAIService = geminiAIService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Seed default demo accounts
        if (userRepository.findByEmail("student@demo.com").isEmpty()) {
            User demoStudent = new User("Alex Rivera", "student@demo.com", passwordEncoder.encode("password123"), "STUDENT", null);
            userRepository.save(demoStudent);
            log.info("Seeded demo candidate account: student@demo.com / password123");
        }

        if (userRepository.findByEmail("recruiter@demo.com").isEmpty()) {
            User demoRecruiter = new User("Sarah Jenkins", "recruiter@demo.com", passwordEncoder.encode("password123"), "RECRUITER", "TechCorp Global");
            userRepository.save(demoRecruiter);
            log.info("Seeded demo recruiter account: recruiter@demo.com / password123");
        }

        if (jobRepository.count() == 0) {
            log.info("Seeding initial job postings into database...");

            List<Job> sampleJobs = List.of(
                new Job(
                    "Full Stack Engineer (React + Spring Boot)",
                    "TechCorp Solutions",
                    "Bangalore, India (Hybrid)",
                    "Full-time",
                    "Entry / Mid Level",
                    "₹8,00,000 - ₹14,00,000",
                    "We are seeking a versatile Full Stack Developer to build modern web applications using React on the frontend and Spring Boot microservices on the backend. Experience with REST APIs, PostgreSQL, and Git is preferred.",
                    List.of("React", "Spring Boot", "Java", "JavaScript", "PostgreSQL", "REST API", "Git")
                ),
                new Job(
                    "Java Backend Engineer",
                    "FinScale Systems",
                    "Hyderabad, India (Remote)",
                    "Full-time",
                    "Mid Level",
                    "₹10,00,000 - ₹18,00,000",
                    "Join our core banking platform team building high-throughput microservices in Java 21, Spring Boot, and PostgreSQL. You will design scalable database schemas, optimize queries, and implement Redis caching.",
                    List.of("Java", "Spring Boot", "Microservices", "PostgreSQL", "Docker", "REST API", "Git")
                ),
                new Job(
                    "Frontend React Specialist",
                    "PixelCraft Digital",
                    "Pune, India (Remote)",
                    "Full-time",
                    "Entry Level",
                    "₹6,00,000 - ₹10,00,000",
                    "Looking for a creative and detail-oriented Frontend Engineer skilled in React.js, Tailwind CSS, and TypeScript. You will build highly responsive, dark-mode user interfaces and optimize Core Web Vitals.",
                    List.of("React", "TypeScript", "JavaScript", "Tailwind CSS", "HTML", "CSS", "Git")
                ),
                new Job(
                    "DevOps & Cloud Engineer",
                    "CloudMatrix Infra",
                    "Gurgaon, India (On-site)",
                    "Full-time",
                    "Mid / Senior Level",
                    "₹12,00,000 - ₹20,00,000",
                    "Manage containerized infrastructure across AWS and Kubernetes. Automate CI/CD deployment pipelines with GitHub Actions, monitor clusters, and ensure high availability.",
                    List.of("Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Git")
                ),
                new Job(
                    "Python & Data Engineer",
                    "DataSphere Analytics",
                    "Bangalore, India (Remote)",
                    "Full-time",
                    "Entry / Mid Level",
                    "₹9,00,000 - ₹15,00,000",
                    "Work with our data science team building robust ETL pipelines and ML inference APIs using Python, FastAPI, Pandas, and PostgreSQL.",
                    List.of("Python", "FastAPI", "Pandas", "PostgreSQL", "Machine Learning", "SQL", "Git")
                ),
                new Job(
                    "Associate Software Engineer",
                    "Global Edge Technologies",
                    "Noida, India (Hybrid)",
                    "Full-time",
                    "Entry Level (Fresher)",
                    "₹5,00,000 - ₹8,00,000",
                    "Ideal role for graduating B.Tech engineers. Requires solid foundations in Object Oriented Programming (Java/Python), relational databases (SQL/MySQL/PostgreSQL), and web fundamentals.",
                    List.of("Java", "SQL", "HTML", "CSS", "Git", "REST API")
                )
            );

            for (Job job : sampleJobs) {
                List<Double> vector = geminiAIService.generateEmbedding(
                        job.getTitle() + " " + String.join(" ", job.getRequiredSkills()) + " " + job.getDescription());
                job.setEmbeddingJson(VectorMathUtil.toJson(vector));
                jobRepository.save(job);
            }

            log.info("Successfully seeded {} realistic tech jobs with NLP embeddings.", sampleJobs.size());
        }
    }
}
