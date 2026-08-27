package com.unad.project_video_platform.service.impl;

import com.unad.project_video_platform.dto.ChangePasswordRequest;
import com.unad.project_video_platform.dto.ProfileUpdateRequest;
import com.unad.project_video_platform.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface IUserService {

    /**
     * Obtiene todos los usuarios
     */
    List<User> getAllUsers();

    /**
     * Obtiene un usuario por ID
     */
    Optional<User> getUserById(Integer id);

    /**
     * Obtiene un usuario por email
     */
    Optional<User> getUserByEmail(String email);

    /**
     * Obtiene un usuario por número de documento
     */
    Optional<User> getUserByDocumentNumber(String documentNumber);

    /**
     * Obtiene usuarios por rol
     */
    List<User> getUsersByRoleId(Integer roleId);

    /**
     * Crea un nuevo usuario
     */
    User createUser(User user);

    /**
     * Actualiza un usuario existente
     */
    User updateUser(Integer id, User userDetails);

    /**
     * Elimina un usuario por ID
     */
    void deleteUser(Integer id);

    /**
     * Verifica si existe un usuario por email
     */
    boolean existsByEmail(String email);

    /**
     * Verifica si existe un usuario por número de documento
     */
    boolean existsByDocumentNumber(String documentNumber);

    User getCurrentUser();

    User updateProfile(ProfileUpdateRequest request);

    void changePassword(ChangePasswordRequest request);

    User updatePhoto(MultipartFile file);
}
