package com.unad.project_video_platform.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String firstName;
    private String lastName;
    private String bio;
    private String phone;
    private String cargo;
}
