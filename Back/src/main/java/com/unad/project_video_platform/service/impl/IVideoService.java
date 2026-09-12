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
     * Crea un nuevo video con materiales asociados
     */
    Video createVideo(Video video, MultipartFile[] materials);

    /**
     * Agrega materiales a un video existente
     */
    Video addMaterials(Integer id, MultipartFile[] materials);

    /**
     * Elimina un material de apoyo de un video
     */
    Video deleteMaterial(Integer id, Integer materialId);

    /**
     * Actualiza un video existente
     */
    Video updateVideo(Integer id, Video videoDetails);

    /**
     * Elimina un video por ID
     */
    void deleteVideo(Integer id);

}
