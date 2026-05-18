package com.mahyhaker.hcm.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdatePasswordRequest {

    @NotBlank(message = "Senha atual e obrigatoria")
    private String currentPassword;

    @NotBlank(message = "Nova senha e obrigatoria")
    private String newPassword;

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
