package com.unad.project_video_platform.config;

import com.unad.project_video_platform.entity.Role;
import com.unad.project_video_platform.entity.User;
import com.unad.project_video_platform.repository.RoleRepository;
import com.unad.project_video_platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements ApplicationRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Role admin = ensureRole("ADMIN", "Administrador");
        ensureRole("USER", "Usuario final");
        ensureRole("MODERATOR", "Moderador");

        // Asignar contraseña por defecto a usuarios existentes que aún no tienen una.
        for (User user : userRepository.findAll()) {
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                boolean isAdmin = user.getRole() != null
                        && "ADMIN".equalsIgnoreCase(user.getRole().getRoleName());
                user.setPassword(passwordEncoder.encode(isAdmin ? "Admin123!" : "User123!"));
                userRepository.save(user);
            }
        }

        // Si no existe ningún usuario, crear un administrador inicial.
        if (userRepository.count() == 0) {
            User adminUser = new User();
            adminUser.setFirstName("Admin");
            adminUser.setLastName("Demo");
            adminUser.setEmail("admin@demo.com");
            adminUser.setDocumentType("CC");
            adminUser.setDocumentNumber("123456");
            adminUser.setPassword(passwordEncoder.encode("Admin123!"));
            adminUser.setRole(admin);
            adminUser.setActive(true);
            userRepository.save(adminUser);
        }
    }

    private Role ensureRole(String name, String description) {
        return roleRepository.findByRoleName(name).orElseGet(() -> {
            Role role = new Role();
            role.setRoleName(name);
            role.setDescription(description);
            return roleRepository.save(role);
        });
    }
}
