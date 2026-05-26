sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    const BASE_URL = window.location.hostname === "localhost" && window.location.port && window.location.port !== "80" ? "http://localhost:8080" : "";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.HrProfileSetup", {
        onInit: function () {
            this.getView().setModel(new JSONModel({
                busy: false,
                fullName: "",
                cpf: "",
                rg: "",
                phone: ""
            }), "personalData");

            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteHrProfileSetup")
                .attachPatternMatched(this.onRouteMatched, this);
        },

        _getAuthHeaders: function () {
            const sSession = localStorage.getItem("hcmSession");
            const oSession = sSession ? JSON.parse(sSession) : null;

            return {
                "Content-Type": "application/json",
                "Authorization": oSession && oSession.token ? `Bearer ${oSession.token}` : ""
            };
        },

        _safeReadJson: async function (response) {
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        },

        onRouteMatched: function () {
            const oSession = this.getOwnerComponent().getModel("session");

            if (!oSession.getProperty("/isAuthenticated")) {
                this.getOwnerComponent().getRouter().navTo("RouteLogin", {}, true);
                return;
            }

            if (!oSession.getProperty("/isHr")) {
                this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, true);
                return;
            }

            this.loadOwnPersonalData();
        },

        loadOwnPersonalData: async function () {
            const oModel = this.getView().getModel("personalData");
            oModel.setProperty("/busy", true);

            try {
                const response = await fetch(`${BASE_URL}/personal-data/me`, {
                    headers: this._getAuthHeaders()
                });
                const data = await this._safeReadJson(response);

                if (!response.ok) {
                    throw new Error((data && data.message) || "Erro ao carregar dados pessoais.");
                }

                oModel.setData({
                    busy: false,
                    fullName: data.fullName || "",
                    cpf: data.cpf || "",
                    rg: data.rg || "",
                    phone: data.phone || ""
                });
            } catch (error) {
                oModel.setProperty("/busy", false);
                MessageBox.error(error.message);
            }
        },

        onSave: async function () {
            const oModel = this.getView().getModel("personalData");
            const data = oModel.getData();

            if (!data.fullName.trim() || !data.cpf.trim() || !data.rg.trim() || !data.phone.trim()) {
                MessageBox.error("Preencha todos os campos obrigatorios.");
                return;
            }

            oModel.setProperty("/busy", true);

            try {
                const response = await fetch(`${BASE_URL}/personal-data/me`, {
                    method: "PUT",
                    headers: this._getAuthHeaders(),
                    body: JSON.stringify({
                        fullName: data.fullName.trim(),
                        cpf: data.cpf.trim(),
                        rg: data.rg.trim(),
                        phone: data.phone.trim()
                    })
                });
                const result = await this._safeReadJson(response);

                if (!response.ok) {
                    throw new Error((result && result.message) || "Erro ao salvar dados pessoais.");
                }

                this.getOwnerComponent().completePersonalDataSetup();
                MessageToast.show("Cadastro pessoal concluido.");
                this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, true);
            } catch (error) {
                MessageBox.error(error.message);
            } finally {
                oModel.setProperty("/busy", false);
            }
        }
    });
});
