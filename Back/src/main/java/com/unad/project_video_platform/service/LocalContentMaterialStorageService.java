package com.unad.project_video_platform.service;

import com.unad.project_video_platform.dto.LocalUploadResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalContentMaterialStorageService {

    private final Path uploadDirectory;

    public LocalContentMaterialStorageService(
            @Value("${app.storage.materials-path:uploads/materials}") String materialsPath) {
        this.uploadDirectory = Paths.get(materialsPath).toAbsolutePath().normalize();
    }

    public LocalUploadResult saveMaterial(MultipartFile file, String extension, String mimeType) {
        try {
            Files.createDirectories(uploadDirectory);

            String storedFileName = UUID.randomUUID() + "." + normalizeExtension(extension);
            Path target = uploadDirectory.resolve(storedFileName).normalize();

            if (!target.startsWith(uploadDirectory)) {
                throw new IllegalArgumentException("Nombre de archivo invalido");
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String url = "/api/content/materials/" + storedFileName;
            return new LocalUploadResult(storedFileName, url, mimeType);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo guardar el material localmente: " + e.getMessage(), e);
        }
    }

    public String resolveContentType(String storedFileName) {
        Path file = resolveStoredFile(storedFileName);
        try {
            String detected = Files.probeContentType(file);
            if (detected != null && !detected.isBlank()) {
                return detected;
            }
        } catch (Exception ignored) {
        }

        String guessed = URLConnection.guessContentTypeFromName(storedFileName);
        return guessed == null || guessed.isBlank() ? "application/octet-stream" : guessed;
    }

    public Resource loadAsResource(String storedFileName) {
        try {
            Path file = resolveStoredFile(storedFileName);
            Resource resource = new UrlResource(file.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("Material no encontrado");
            }

            return resource;
        } catch (MalformedURLException e) {
            throw new RuntimeException("Material no encontrado", e);
        }
    }

    public void delete(String storedFileName) {
        if (storedFileName == null || storedFileName.isBlank()) {
            return;
        }

        try {
            Files.deleteIfExists(resolveStoredFile(storedFileName));
        } catch (Exception ignored) {
        }
    }

    private Path resolveStoredFile(String storedFileName) {
        Path file = uploadDirectory.resolve(storedFileName).normalize();
        if (!file.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException("Nombre de archivo invalido");
        }
        return file;
    }

    private String normalizeExtension(String extension) {
        String value = extension == null ? "" : extension.trim().toLowerCase();
        if (value.startsWith(".")) {
            value = value.substring(1);
        }
        if (value.isBlank() || value.contains("/") || value.contains("\\") || value.contains("..")) {
            throw new IllegalArgumentException("Extension de archivo invalida");
        }
        return value;
    }
}
