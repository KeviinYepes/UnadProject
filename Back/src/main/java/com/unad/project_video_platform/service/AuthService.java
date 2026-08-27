package com.unad.project_video_platform.service;

import com.unad.project_video_platform.dto.LoginRequest;
import com.unad.project_video_platform.dto.LoginResponse;
import com.unad.project_video_platform.entity.User;
import com.unad.project_video_platform.repository.UserRepository;
import com.unad.project_video_platform.security.JwtService;
import com.unad.project_video_platform.service.impl.IAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService implements IAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Credenciales inválidas: email y contraseña son obligatorios");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas: email o contraseña incorrectos"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Credenciales inválidas: email o contraseña incorrectos");
        }

        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "USER";
        String token = jwtService.generateToken(user.getEmail(), roleName);

        return new LoginResponse(token, "Bearer", roleName, user.getId());
    }
}
