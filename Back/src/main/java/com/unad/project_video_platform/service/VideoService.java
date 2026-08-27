package com.unad.project_video_platform.service;

import com.unad.project_video_platform.entity.Video;
import com.unad.project_video_platform.repository.VideoRepository;
import com.unad.project_video_platform.service.impl.IVideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
public class VideoService implements IVideoService {

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * Obtiene todos los contenidos
     */
    public List<Video> getAllVideos() {
        return videoRepository.findAll();
    }

    /**
     * Obtiene un contenido por ID
     */
    public Optional<Video> getVideoById(Integer id) {
        return videoRepository.findById(id);
    }

    /**
     * Crea un nuevo contenido
     */
    @Transactional
    public Video createVideo(Video video) {
        validateVideo(video);
        video.setType(normalizeType(video.getType()));
        return videoRepository.save(video);
    }

    /**
     * Actualiza un contenido existente
     */
    @Transactional
    public Video updateVideo(Integer id, Video videoDetails) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contenido no encontrado con id: " + id));

        validateVideo(videoDetails);

        video.setUrl(videoDetails.getUrl());
        video.setTitle(videoDetails.getTitle());
        video.setDescription(videoDetails.getDescription());
        video.setCategory(videoDetails.getCategory());
        video.setType(normalizeType(videoDetails.getType()));
        video.setThumbnailUrl(videoDetails.getThumbnailUrl());

        return videoRepository.save(video);
    }

    /**
     * Elimina un contenido por ID
     */
    @Transactional
    public void deleteVideo(Integer id) {
        if (!videoRepository.existsById(id)) {
            throw new RuntimeException("Contenido no encontrado con id: " + id);
        }
        videoRepository.deleteById(id);
    }

    /**
     * Crea un contenido subiendo un archivo (imagen o PDF).
     */
    @Transactional
    public Video createFromUpload(MultipartFile file, String title, String description, String category, String type, MultipartFile thumbnail) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("El título es obligatorio");
        }
        String storedPath = fileStorageService.storeFile(file);

        Video video = new Video();
        video.setUrl(storedPath);
        video.setTitle(title);
        video.setDescription(description);
        video.setCategory(category);
        video.setType(normalizeType(type));

        if (thumbnail != null && !thumbnail.isEmpty()) {
            video.setThumbnailUrl(fileStorageService.storeImage(thumbnail));
        }

        return videoRepository.save(video);
    }

    private void validateVideo(Video video) {
        if (video == null) {
            throw new IllegalArgumentException("El contenido es obligatorio");
        }
        if (video.getUrl() == null || video.getUrl().isBlank()) {
            throw new IllegalArgumentException("La url es obligatoria");
        }
        if (video.getTitle() == null || video.getTitle().isBlank()) {
            throw new IllegalArgumentException("El título es obligatorio");
        }
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            return "VIDEO";
        }
        return switch (type.trim().toUpperCase()) {
            case "PDF" -> "PDF";
            case "IMAGE", "IMAGEN", "FOTO", "PHOTO" -> "IMAGE";
            case "EXCEL", "XLSX", "XLS", "HOJA" -> "EXCEL";
            case "WORD", "DOCX", "DOC", "DOCUMENTO" -> "WORD";
            default -> "VIDEO";
        };
    }
}
