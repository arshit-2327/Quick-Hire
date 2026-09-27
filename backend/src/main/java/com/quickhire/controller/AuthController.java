package com.quickhire.controller;

import com.quickhire.model.User;
import com.quickhire.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String name = payload.get("name");
        String password = payload.get("password");
        String role = payload.get("role"); // "STUDENT" or "RECRUITER"
        String companyName = payload.get("companyName");

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required."));
        }

        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            return ResponseEntity.badRequest().body(Map.of("message", "An account with this email already exists."));
        }

        User user = new User(
                name != null ? name.trim() : "User",
                email.trim().toLowerCase(),
                password.trim(),
                role != null ? role.trim().toUpperCase() : "STUDENT",
                companyName != null ? companyName.trim() : null
        );

        User saved = userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "name", saved.getName(),
                "email", saved.getEmail(),
                "role", saved.getRole(),
                "companyName", saved.getCompanyName() != null ? saved.getCompanyName() : ""
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(password.trim())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }

        User user = userOpt.get();
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "companyName", user.getCompanyName() != null ? user.getCompanyName() : ""
        ));
    }
}
