package com.unad.project_video_platform.repository;

import com.unad.project_video_platform.entity.Video;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoRepository extends JpaRepository<Video, Integer> {

    @Override
    @EntityGraph(attributePaths = {"category", "createdBy", "createdBy.role", "materials"})
    List<Video> findAll();

    @Override
    @EntityGraph(attributePaths = {"category", "createdBy", "createdBy.role", "materials"})
    Optional<Video> findById(Integer id);

    boolean existsByCategoryId(Integer categoryId);

    boolean existsByTitleIgnoreCase(String title);

    boolean existsByTitleIgnoreCaseAndIdNot(String title, Integer id);
}
