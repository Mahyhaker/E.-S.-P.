sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox"
], function (Controller, JSONModel, History, MessageBox) {
    "use strict";

    const BASE_URL = "http://localhost:8080";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.Detail", {
        onInit: function () {
            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteDetail")
                .attachPatternMatched(this.onPatternMatched, this);
        },

        _getAuthHeaders: function () {
            const sSession = localStorage.getItem("hcmSession");
            const oSession = sSession ? JSON.parse(sSession) : null;

            return {
                "Content-Type": "application/json",
                "Authorization": oSession && oSession.token ? `Bearer ${oSession.token}` : ""
            };
        },

        _handleUnauthorized: function () {
            this.getOwnerComponent().clearSession();
            this.getOwnerComponent().getRouter().navTo("RouteLogin", {}, true);
        },

        onPatternMatched: function (oEvent) {
            const oSession = this.getOwnerComponent().getModel("session");

            if (!oSession || !oSession.getProperty("/isAuthenticated")) {
                this.getOwnerComponent().getRouter().navTo("RouteLogin", {}, true);
                return;
            }

            const sId = oEvent.getParameter("arguments").id;
            const bIsAdmin = oSession.getProperty("/isAdmin");
            const bIsHr = oSession.getProperty("/isHr");
            const employeeId = oSession.getProperty("/employeeId");

            if (!bIsAdmin && !bIsHr && String(employeeId) !== String(sId)) {
                MessageBox.error("Você só pode acessar o seu próprio perfil.", {
                    onClose: () => {
                        this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, true);
                    }
                });
                return;
            }

            const oModel = new JSONModel();

            fetch(`${BASE_URL}/employees/${sId}`, {
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada ou acesso negado.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao buscar detalhe do funcionário.");
                    }

                    return data;
                })
                .then((data) => {
                    oModel.setData(data);
                    this.getView().setModel(oModel, "detail");
                })
                .catch((error) => {
                    console.error("Erro ao buscar detalhe:", error);
                });
        },

        onNavBack: function () {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
            }
        }
    });
});
