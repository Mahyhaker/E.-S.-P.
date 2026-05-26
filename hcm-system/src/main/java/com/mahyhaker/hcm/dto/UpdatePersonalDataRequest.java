package com.mahyhaker.hcm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdatePersonalDataRequest {

    @NotBlank(message = "Nome completo e obrigatorio.")
    @Size(max = 160, message = "Nome completo deve ter no maximo 160 caracteres.")
    private String fullName;

    @NotBlank(message = "CPF e obrigatorio.")
    private String cpf;

    @NotBlank(message = "RG e obrigatorio.")
    @Size(max = 20, message = "RG deve ter no maximo 20 caracteres.")
    private String rg;

    @NotBlank(message = "Telefone e obrigatorio.")
    private String phone;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getRg() {
        return rg;
    }

    public void setRg(String rg) {
        this.rg = rg;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
