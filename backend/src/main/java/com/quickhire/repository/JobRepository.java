package com.quickhire.repository;

import com.quickhire.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findAllByOrderByCreatedAtDesc();
    List<Job> findByRecruiterIdOrderByCreatedAtDesc(Long recruiterId);
}
