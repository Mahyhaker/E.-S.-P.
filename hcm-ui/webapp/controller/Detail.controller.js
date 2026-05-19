sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox"
], function (Controller, JSONModel, History, MessageBox) {
    "use strict";

    const BASE_URL = window.location.hostname === "localhost" && window.location.port && window.location.port !== "80" ? "http://localhost:8080" : "";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.Detail", {
        onInit: function () {
            this.getView().setModel(new JSONModel(this._emptyProfile()), "detail");

            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteDetail")
                .attachPatternMatched(this.onPatternMatched, this);
        },

        _emptyProfile: function () {
            return {
                busy: false,
                employee: null,
                leaveRequests: [],
                leaveSummary: {
                    total: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0
                },
                latestLeaveRequests: []
            };
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

        _safeReadJson: async function (response) {
            const sText = await response.text();
            return sText ? JSON.parse(sText) : null;
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
            const bIsManager = oSession.getProperty("/isManager");
            const employeeId = oSession.getProperty("/employeeId");

            if (!bIsAdmin && !bIsHr && !bIsManager && String(employeeId) !== String(sId)) {
                MessageBox.error("Voce so pode acessar o seu proprio perfil.", {
                    onClose: () => {
                        this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, true);
                    }
                });
                return;
            }

            this.loadProfile(sId);
        },

        loadProfile: async function (employeeId) {
            const oModel = this.getView().getModel("detail");
            const oHeaders = this._getAuthHeaders();
            oModel.setProperty("/busy", true);

            try {
                const [employeeResponse, leavesResponse] = await Promise.all([
                    fetch(`${BASE_URL}/employees/${employeeId}`, { headers: oHeaders }),
                    fetch(`${BASE_URL}/leave-requests/employee/${employeeId}`, { headers: oHeaders })
                ]);

                if ([employeeResponse, leavesResponse].some(response => response.status === 401 || response.status === 403)) {
                    this._handleUnauthorized();
                    throw new Error("Sessao expirada ou acesso negado.");
                }

                const employee = await this._safeReadJson(employeeResponse);
                const leaveRequests = await this._safeReadJson(leavesResponse) || [];

                if (!employeeResponse.ok) {
                    throw new Error((employee && employee.message) || "Erro ao buscar perfil do funcionario.");
                }

                if (!leavesResponse.ok) {
                    throw new Error((leaveRequests && leaveRequests.message) || "Erro ao buscar ausencias do funcionario.");
                }

                oModel.setData({
                    busy: false,
                    employee,
                    leaveRequests,
                    leaveSummary: this._buildLeaveSummary(leaveRequests),
                    latestLeaveRequests: this._latestLeaveRequests(leaveRequests)
                });
            } catch (error) {
                oModel.setProperty("/busy", false);
                console.error("Erro ao buscar perfil:", error);
                MessageBox.error(error.message);
            }
        },

        _buildLeaveSummary: function (leaveRequests) {
            return {
                total: leaveRequests.length,
                pending: leaveRequests.filter(request => request.status === "PENDING").length,
                approved: leaveRequests.filter(request => request.status === "APPROVED").length,
                rejected: leaveRequests.filter(request => request.status === "REJECTED").length
            };
        },

        _latestLeaveRequests: function (leaveRequests) {
            return [...leaveRequests]
                .sort((a, b) => String(b.startDate || "").localeCompare(String(a.startDate || "")))
                .slice(0, 5);
        },

        formatInitials: function (name) {
            if (!name) {
                return "?";
            }

            return name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map(part => part.charAt(0).toUpperCase())
                .join("");
        },

        formatMoney: function (value) {
            if (value === null || value === undefined || value === "") {
                return "Nao informado";
            }

            return Number(value).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });
        },

        formatStatusState: function (status) {
            if (status === "APPROVED") {
                return "Success";
            }

            if (status === "REJECTED") {
                return "Error";
            }

            return "Warning";
        },

        onOpenLeaveRequests: function () {
            this.getOwnerComponent().getRouter().navTo("RouteLeaveRequests");
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
