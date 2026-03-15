sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History"
], function (Controller, JSONModel, MessageToast, MessageBox, History) {
    "use strict";

    const BASE_URL = "http://localhost:8080";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.HrApprovals", {
        onInit: function () {
            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteHrApprovals")
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

        _handleUnauthorized: function () {
            this.getOwnerComponent().clearSession();
            this.getOwnerComponent().getRouter().navTo("RouteLogin", {}, true);
        },

        checkAccess: function () {
            const oSession = this.getOwnerComponent().getModel("session");

            if (!oSession || !oSession.getProperty("/isAuthenticated")) {
                this.getOwnerComponent().getRouter().navTo("RouteLogin", {}, true);
                return false;
            }

            const bIsAdmin = oSession.getProperty("/isAdmin");
            const bIsHr = oSession.getProperty("/isHr");

            if (!bIsAdmin && !bIsHr) {
                MessageBox.error("Você não tem permissão para acessar Aprovações RH.", {
                    onClose: () => {
                        this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, true);
                    }
                });
                return false;
            }

            return true;
        },

        onRouteMatched: function () {
            if (!this.checkAccess()) {
                return;
            }

            this.loadPendingHrRequests();
        },

        loadPendingHrRequests: function () {
            fetch(`${BASE_URL}/leave-requests/pending/hr`, {
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada ou acesso negado.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao carregar solicitações do RH.");
                    }

                    return data;
                })
                .then((data) => {
                    this.getView().setModel(new JSONModel(data), "hrRequests");
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onApproveRequest: function (oEvent) {
            const request = oEvent.getSource().getBindingContext("hrRequests").getObject();

            fetch(`${BASE_URL}/leave-requests/${request.id}/approve`, {
                method: "PUT",
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada ou acesso negado.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao aprovar solicitação.");
                    }

                    return data;
                })
                .then(() => {
                    MessageToast.show("Solicitação aprovada com sucesso!");
                    this.loadPendingHrRequests();
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onRejectRequest: function (oEvent) {
            const request = oEvent.getSource().getBindingContext("hrRequests").getObject();

            fetch(`${BASE_URL}/leave-requests/${request.id}/reject`, {
                method: "PUT",
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada ou acesso negado.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao rejeitar solicitação.");
                    }

                    return data;
                })
                .then(() => {
                    MessageToast.show("Solicitação rejeitada com sucesso!");
                    this.loadPendingHrRequests();
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onNavBack: function () {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, true);
            }
        }
    });
});