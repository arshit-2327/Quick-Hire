package com.quickhire.repository;

import com.quickhire.model.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    List<JobApplication> findByUserIdOrderByAppliedAtDesc(Long userId);

    List<JobApplication> findByJobIdOrderByMatchScoreDesc(Long jobId);

    Optional<JobApplication> findByJobIdAndUserId(Long jobId, Long userId);

    boolean existsByJobIdAndUserId(Long jobId, Long userId);

    long countByJobId(Long jobId);
}
