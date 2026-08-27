package com.unad.project_video_platform.service.impl;

import com.unad.project_video_platform.entity.Video;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface IVideoService {

    /**
     * Obtiene todos los videos
     */
    List<Video> getAllVideos();

    /**
     * Obtiene un video por ID
     */
    Optional<Video> getVideoById(Integer id);

    /**
     * Crea un nuevo video
     */
    Video createVideo(Video video);

    /**
     * Actualiza un video existente
     */
    Video updateVideo(Integer id, Video videoDetails);

    /**
     * Elimina un video por ID
     */
    void deleteVideo(Integer id);

    /**
     * Crea un contenido subiendo un archivo (imagen o PDF)
     */
    Video createFromUpload(MultipartFile file, String title, String description, String category, String type);
}
