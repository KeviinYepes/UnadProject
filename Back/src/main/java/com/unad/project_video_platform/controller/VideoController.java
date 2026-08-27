package com.unad.project_video_platform.controller;

import com.unad.project_video_platform.dto.ApiResponse;
import com.unad.project_video_platform.entity.Video;
import com.unad.project_video_platform.service.impl.IVideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/videos")
@CrossOrigin(origins = "*")
public class VideoController {

    @Autowired
    private IVideoService videoService;

    /**
     * GET /api/videos - Obtiene todos los videos
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Video>>> getAllVideos() {
        List<Video> videos = videoService.getAllVideos();
        return ResponseEntity.ok(ApiResponse.ok("Videos consulted", videos));
    }

    /**
     * GET /api/videos/{id} - Obtiene un video por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Video>> getVideoById(@PathVariable Integer id) {
        return videoService.getVideoById(id)
                .map(video -> ResponseEntity.ok(ApiResponse.ok("Video found", video)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.<Video>notFound("Video not found with id: " + id)));
    }

    /**
     * POST /api/videos - Crea un nuevo contenido (video por URL)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<Video>> createVideo(@RequestBody Video video) {
        try {
            Video created = videoService.createVideo(video);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.created("Video created", created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<Video>badRequest(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Video>internalError(e.getMessage()));
        }
    }

    /**
     * POST /api/videos/upload - Crea un contenido subiendo un archivo (imagen o PDF)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Video>> uploadContent(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail) {
        try {
            Video created = videoService.createFromUpload(file, title, description, category, type, thumbnail);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.created("Contenido creado", created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<Video>badRequest(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Video>internalError(e.getMessage()));
        }
    }

    /**
     * PUT /api/videos/{id} - Actualiza un video existente
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Video>> updateVideo(@PathVariable Integer id, @RequestBody Video videoDetails) {
        try {
            Video updated = videoService.updateVideo(id, videoDetails);
            return ResponseEntity.ok(ApiResponse.ok("Video updated", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<Video>badRequest(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<Video>notFound(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Video>internalError(e.getMessage()));
        }
    }

    /**
     * DELETE /api/videos/{id} - Elimina un video
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVideo(@PathVariable Integer id) {
        try {
            videoService.deleteVideo(id);
            return ResponseEntity.ok(ApiResponse.<Void>ok("Video deleted successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<Void>notFound(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Void>internalError(e.getMessage()));
        }
    }
}
