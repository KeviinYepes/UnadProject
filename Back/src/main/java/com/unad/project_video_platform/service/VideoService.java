package com.unad.project_video_platform.service;

import com.unad.project_video_platform.dto.LocalUploadResult;
import com.unad.project_video_platform.entity.ContentMaterial;
import com.unad.project_video_platform.entity.Conversation;
import com.unad.project_video_platform.entity.Video;
import com.unad.project_video_platform.repository.CategoryRepository;
import com.unad.project_video_platform.repository.ContentMaterialRepository;
import com.unad.project_video_platform.repository.ConversationRepository;
import com.unad.project_video_platform.repository.QuestionRepository;
import com.unad.project_video_platform.repository.UserRepository;
import com.unad.project_video_platform.repository.VideoRepository;
import com.unad.project_video_platform.repository.VideoStatsRepository;
import com.unad.project_video_platform.service.impl.IVideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class VideoService implements IVideoService {

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContentMaterialRepository contentMaterialRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private VideoStatsRepository videoStatsRepository;

    @Autowired
    private LocalContentMaterialStorageService localContentMaterialStorageService;

    public List<Video> getAllVideos() {
        return videoRepository.findAll();
    }

    public Optional<Video> getVideoById(Integer id) {
        return videoRepository.findById(id);
    }

    @Transactional
    public Video createVideo(Video video) {
        validateVideo(video, false, null);
        hydrateReferences(video);
        return videoRepository.save(video);
    }

    @Transactional
    public Video createVideo(Video video, MultipartFile[] materials) {
        validateVideo(video, hasUploadableMaterials(materials), null);
        hydrateReferences(video);
        Video saved = videoRepository.save(video);
        saveMaterials(saved, materials);
        return videoRepository.findById(saved.getId()).orElse(saved);
    }

    @Transactional
    public Video addMaterials(Integer id, MultipartFile[] materials) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contenido no encontrado con id: " + id));

        saveMaterials(video, materials);
        return videoRepository.findById(id).orElse(video);
    }

    @Transactional
    public Video deleteMaterial(Integer id, Integer materialId) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contenido no encontrado con id: " + id));

        ContentMaterial material = contentMaterialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material no encontrado con id: " + materialId));

        if (material.getContent() == null || !id.equals(material.getContent().getId())) {
            throw new IllegalArgumentException("El material no pertenece al contenido indicado");
        }

        localContentMaterialStorageService.delete(material.getDriveFileId());
        contentMaterialRepository.delete(material);
        ensureMaterialsList(video).removeIf(current -> materialId.equals(current.getId()));

        return video;
    }

    @Transactional
    public Video updateVideo(Integer id, Video videoDetails) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contenido no encontrado con id: " + id));

        validateVideo(videoDetails, hasSavedMaterials(video), id);
        hydrateReferences(videoDetails);

        video.setUrlVideo(videoDetails.getUrlVideo());
        video.setTitle(videoDetails.getTitle());
        video.setDescription(videoDetails.getDescription());
        video.setCategory(videoDetails.getCategory());
        video.setCreatedBy(videoDetails.getCreatedBy());

        return videoRepository.save(video);
    }

    @Transactional
    public void deleteVideo(Integer id) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contenido no encontrado con id: " + id));

        List<ContentMaterial> materials = contentMaterialRepository.findByContentIdOrderByPositionAscIdAsc(id);
        materials.forEach(material -> localContentMaterialStorageService.delete(material.getDriveFileId()));

        List<Integer> conversationIds = conversationRepository.findByContentIdOrderByCreatedAtDesc(id)
                .stream()
                .map(Conversation::getId)
                .toList();

        videoStatsRepository.deleteByContentId(id);
        if (!conversationIds.isEmpty()) {
            questionRepository.deleteByConversationIdIn(conversationIds);
        }
        conversationRepository.deleteByContentId(id);
        contentMaterialRepository.deleteAll(materials);
        ensureMaterialsList(video).clear();
        videoRepository.delete(video);
    }

    private void validateVideo(Video video, boolean hasMaterials, Integer excludeId) {
        if (video == null) {
            throw new IllegalArgumentException("El contenido es obligatorio");
        }
        boolean hasVideoUrl = video.getUrlVideo() != null && !video.getUrlVideo().isBlank();
        if (!hasVideoUrl && !hasMaterials) {
            throw new IllegalArgumentException("Debes agregar una URL de video o al menos un PDF como material de apoyo");
        }
        if (video.getTitle() == null || video.getTitle().isBlank()) {
            throw new IllegalArgumentException("El titulo es obligatorio");
        }
        if (video.getCategory() == null || video.getCategory().getId() == null) {
            throw new IllegalArgumentException("La categoria es obligatoria");
        }
        if (video.getCreatedBy() == null || video.getCreatedBy().getId() == null) {
            throw new IllegalArgumentException("El usuario creador es obligatorio");
        }

        String trimmedTitle = video.getTitle().trim();
        boolean isDuplicate = excludeId == null
                ? videoRepository.existsByTitleIgnoreCase(trimmedTitle)
                : videoRepository.existsByTitleIgnoreCaseAndIdNot(trimmedTitle, excludeId);
        if (isDuplicate) {
            throw new IllegalArgumentException("Ya existe un contenido con el titulo: " + trimmedTitle);
        }

        video.setUrlVideo(hasVideoUrl ? video.getUrlVideo().trim() : null);
        video.setTitle(trimmedTitle);
        if (video.getDescription() != null) {
            video.setDescription(video.getDescription().trim());
        }
    }

    private boolean hasUploadableMaterials(MultipartFile[] materials) {
        if (materials == null || materials.length == 0) {
            return false;
        }

        for (MultipartFile file : materials) {
            if (file != null && !file.isEmpty()) {
                return true;
            }
        }

        return false;
    }

    private boolean hasSavedMaterials(Video video) {
        return video.getMaterials() != null && !video.getMaterials().isEmpty();
    }

    private void saveMaterials(Video video, MultipartFile[] materials) {
        if (materials == null || materials.length == 0) {
            return;
        }

        int position = contentMaterialRepository.findByContentIdOrderByPositionAscIdAsc(video.getId())
                .stream()
                .map(ContentMaterial::getPosition)
                .filter(value -> value != null)
                .max(Integer::compareTo)
                .orElse(0) + 1;
        for (MultipartFile file : materials) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            validatePdf(file);
            LocalUploadResult uploadedFile = localContentMaterialStorageService.savePdf(file);

            ContentMaterial material = new ContentMaterial();
            material.setContent(video);
            material.setDriveFileId(uploadedFile.storedFileName());
            material.setDriveUrl(uploadedFile.url());
            material.setFileName(resolveFileName(file));
            material.setMimeType(resolveMimeType(file));
            material.setSizeBytes(file.getSize());
            material.setPosition(position++);

            ContentMaterial savedMaterial = contentMaterialRepository.save(material);
            ensureMaterialsList(video).add(savedMaterial);
        }
    }

    private List<ContentMaterial> ensureMaterialsList(Video video) {
        if (video.getMaterials() == null) {
            video.setMaterials(new ArrayList<>());
        }
        return video.getMaterials();
    }

    private void validatePdf(MultipartFile file) {
        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        String contentType = file.getContentType() == null ? "" : file.getContentType();

        if (!"application/pdf".equalsIgnoreCase(contentType) && !fileName.endsWith(".pdf")) {
            throw new IllegalArgumentException("Solo se permiten archivos PDF como material de apoyo");
        }
    }

    private String resolveFileName(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        return originalName == null || originalName.isBlank() ? "material.pdf" : originalName;
    }

    private String resolveMimeType(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType == null || contentType.isBlank() ? "application/pdf" : contentType;
    }

    private void hydrateReferences(Video video) {
        video.setCategory(
                categoryRepository.findById(video.getCategory().getId())
                        .orElseThrow(() -> new RuntimeException(
                                "Categoria no encontrada con id: " + video.getCategory().getId())));

        video.setCreatedBy(
                userRepository.findById(video.getCreatedBy().getId())
                        .orElseThrow(() -> new RuntimeException(
                                "Usuario creador no encontrado con id: " + video.getCreatedBy().getId())));
    }
}
