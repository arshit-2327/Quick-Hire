package com.quickhire.controller;

import com.quickhire.dto.AuthResponse;
import com.quickhire.dto.LoginRequest;
import com.quickhire.dto.RegisterRequest;
import com.quickhire.model.User;
import com.quickhire.repository.UserRepository;
import com.quickhire.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            return ResponseEntity.badRequest().body(Map.of("message", "An account with this email already exists."));
        }

        String role = request.getRole() != null ? request.getRole().trim().toUpperCase() : "STUDENT";
        if (!role.equals("STUDENT") && !role.equals("RECRUITER")) {
            role = "STUDENT";
        }

        User user = new User(
                request.getName().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.getPassword()),
                role,
                request.getCompanyName() != null ? request.getCompanyName().trim() : null
        );

        User saved = userRepository.save(user);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(saved.getEmail(), saved.getId(), saved.getRole());

        return ResponseEntity.ok(new AuthResponse(
                token,
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getCompanyName()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }

        User user = userOpt.get();
        String rawPassword = request.getPassword();

        // Check password via BCrypt with fallback for legacy plain text migration
        boolean matches = passwordEncoder.matches(rawPassword, user.getPassword());
        if (!matches && user.getPassword().equals(rawPassword)) {
            matches = true;
            // Transparently re-hash legacy plaintext passwords into BCrypt
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
        }

        if (!matches) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getId(), user.getRole());

        return ResponseEntity.ok(new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCompanyName()
        ));
    }
}
