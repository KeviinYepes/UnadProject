package com.unad.project_video_platform.service;

import com.unad.project_video_platform.dto.LoginRequest;
import com.unad.project_video_platform.dto.LoginResponse;
import com.unad.project_video_platform.dto.RecoverPasswordRequest;
import com.unad.project_video_platform.entity.User;
import com.unad.project_video_platform.repository.UserRepository;
import com.unad.project_video_platform.security.JwtService;
import com.unad.project_video_platform.service.impl.IAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService implements IAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${spring.mail.username:}")
    private String mailUsername;

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

    @Override
    public void sendPasswordRecoveryEmail(RecoverPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("El correo electronico es obligatorio");
        }

        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("No existe un usuario con ese correo"));

        if (mailUsername == null || mailUsername.isBlank()) {
            throw new IllegalStateException("Configura MAIL_USERNAME y MAIL_PASSWORD para enviar correos");
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailUsername);
            message.setTo(user.getEmail());
            message.setSubject("Recuperacion de contrasena - GuiaFacil");
            message.setText("""
                    Hola %s,

                    Recibimos una solicitud para recuperar tu contrasena.

                    Tu cuenta ya usa contraseña privada. Por seguridad no podemos enviarla por correo.
                    Si no la recuerdas, solicita a un administrador que actualice tu contraseña desde el panel de usuarios.

                    Si no solicitaste este mensaje, puedes ignorarlo.
                    """.formatted(user.getFirstName()));

            mailSender.send(message);
        } catch (MailException e) {
            throw new RuntimeException("No se pudo enviar el correo de recuperacion: " + e.getMessage(), e);
        }
    }
}
