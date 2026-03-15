sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History"
], function (Controller, JSONModel, MessageToast, MessageBox, History) {
    "use strict";

    const BASE_URL = "http://localhost:8080";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.ManagerApprovals", {
        onInit: function () {
            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteManagerApprovals")
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

        _getSessionEmployeeId: function () {
            const oSession = this.getOwnerComponent().getModel("session");
            return oSession ? oSession.getProperty("/employeeId") : null;
        },

        _safeReadJson: async function (response) {
            const sText = await response.text();
            return sText ? JSON.parse(sText) : null;
        },

        checkAccess: function () {
            const oSession = this.getOwnerComponent().getModel("session");

            if (!oSession || !oSession.getProperty("/isAuthenticated")) {
                this.getOwnerComponent().getRouter().navTo("RouteLogin", {}, true);
                return false;
            }

            const bIsAdmin = oSession.getProperty("/isAdmin");
            const bIsManager = oSession.getProperty("/isManager");

            if (!bIsAdmin && !bIsManager) {
                MessageBox.error("Você não tem permissão para acessar Aprovar Solicitações.", {
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

            this.loadManagers();
        },

        loadManagers: function () {
            const oSession = this.getOwnerComponent().getModel("session");
            const bIsAdmin = oSession.getProperty("/isAdmin");
            const employeeId = this._getSessionEmployeeId();
            const username = oSession.getProperty("/username");

            if (!bIsAdmin) {
                if (!employeeId) {
                    MessageBox.error("Gerente não identificado para este usuário.");
                    return;
                }

                this.getView().setModel(new JSONModel([
                    {
                        id: employeeId,
                        name: username,
                        pernr: ""
                    }
                ]), "managers");

                this.byId("selectManagerApproval").setSelectedKey(String(employeeId));
                this.onManagerChange();
                return;
            }

            fetch(`${BASE_URL}/employees`, {
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao carregar gerentes.");
                    }

                    return data || [];
                })
                .then((data) => {
                    const managers = data.filter(emp =>
                        data.some(other => other.manager && other.manager.id === emp.id)
                    );

                    this.getView().setModel(new JSONModel(managers), "managers");
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onManagerChange: function () {
            const managerId = this.byId("selectManagerApproval").getSelectedKey();

            if (!managerId) {
                this.getView().setModel(new JSONModel([]), "pendingRequests");
                return;
            }

            fetch(`${BASE_URL}/leave-requests/pending/manager/${managerId}`, {
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao carregar solicitações pendentes.");
                    }

                    return data || [];
                })
                .then((data) => {
                    this.getView().setModel(new JSONModel(data), "pendingRequests");
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onApproveRequest: function (oEvent) {
            const request = oEvent.getSource().getBindingContext("pendingRequests").getObject();

            fetch(`${BASE_URL}/leave-requests/${request.id}/approve`, {
                method: "PUT",
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao aprovar solicitação.");
                    }

                    return data;
                })
                .then(() => {
                    MessageToast.show("Solicitação aprovada com sucesso!");
                    this.onManagerChange();
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onRejectRequest: function (oEvent) {
            const request = oEvent.getSource().getBindingContext("pendingRequests").getObject();

            fetch(`${BASE_URL}/leave-requests/${request.id}/reject`, {
                method: "PUT",
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao rejeitar solicitação.");
                    }

                    return data;
                })
                .then(() => {
                    MessageToast.show("Solicitação rejeitada com sucesso!");
                    this.onManagerChange();
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