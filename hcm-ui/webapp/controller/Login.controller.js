sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageBox) {
    "use strict";

    const BASE_URL = "http://localhost:8080";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.Login", {
        onInit: function () {
            const oModel = new JSONModel({
                username: "",
                password: "",
                busy: false
            });

            this.getView().setModel(oModel, "login");
        },

        onLogin: function () {
            const oModel = this.getView().getModel("login");
            const oData = oModel.getData();

            if (!oData.username || !oData.password) {
                MessageBox.error("Informe usuário e senha.");
                return;
            }

            oModel.setProperty("/busy", true);

            fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: oData.username,
                    password: oData.password
                })
            })
                .then(async (response) => {
                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao realizar login.");
                    }

                    return data;
                })
                .then((data) => {
                    const oSessionData = {
                        token: data.token,
                        username: data.username,
                        role: data.role,
                        employeeId: data.employeeId,
                        isAdmin: data.role === "ADMIN",
                        isHr: data.role === "HR",
                        isManager: data.role === "MANAGER",
                        isEmployee: data.role === "EMPLOYEE"
                    };

                    localStorage.setItem("hcmSession", JSON.stringify(oSessionData));
                    this.getOwnerComponent().setSession(oSessionData);
                    this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, true);
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                })
                .finally(() => {
                    oModel.setProperty("/busy", false);
                });
        }
    });
});
