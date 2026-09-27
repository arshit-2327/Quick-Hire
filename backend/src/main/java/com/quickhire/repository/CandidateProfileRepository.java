package com.quickhire.repository;

import com.quickhire.model.CandidateProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateProfileRepository extends JpaRepository<CandidateProfile, Long> {
    List<CandidateProfile> findAllByOrderByCreatedAtDesc();
    Optional<CandidateProfile> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
