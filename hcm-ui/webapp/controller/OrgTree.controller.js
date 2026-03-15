sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox"
], function (Controller, JSONModel, History, MessageBox) {
    "use strict";

    const BASE_URL = "http://localhost:8080";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.OrgTree", {
        onInit: function () {
            this.getView().setModel(new JSONModel({
                busy: false,
                nodes: []
            }), "tree");

            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteOrgTree")
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
            const bIsManager = oSession.getProperty("/isManager");

            if (!bIsAdmin && !bIsHr && !bIsManager) {
                MessageBox.error("Você não tem permissão para acessar o Organograma.", {
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

            this.loadTree();
        },

        loadTree: function () {
            const oModel = this.getView().getModel("tree");
            oModel.setProperty("/busy", true);

            fetch(`${BASE_URL}/employees/tree`, {
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada ou acesso negado.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao buscar árvore organizacional.");
                    }

                    return data;
                })
                .then((data) => {
                    oModel.setData({
                        busy: false,
                        nodes: data
                    });
                })
                .catch((error) => {
                    oModel.setProperty("/busy", false);
                    console.error("Erro ao buscar árvore organizacional:", error);
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