sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History"
], function (Controller, JSONModel, Fragment, MessageToast, MessageBox, History) {
    "use strict";

    const BASE_URL = "http://localhost:8080";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.LeaveRequests", {
        onInit: function () {
            /** @type {sap.m.Dialog | null} */
            this._oCreateLeaveDialog = null;

            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteLeaveRequests")
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

            return true;
        },

        onRouteMatched: function () {
            if (!this.checkAccess()) {
                return;
            }

            this.loadEmployees();
        },

        loadEmployees: function () {
            const oSession = this.getOwnerComponent().getModel("session");
            const bIsAdmin = oSession.getProperty("/isAdmin");
            const bIsHr = oSession.getProperty("/isHr");
            const bIsEmployee = oSession.getProperty("/isEmployee");
            const bIsManager = oSession.getProperty("/isManager");
            const employeeId = this._getSessionEmployeeId();
            const username = oSession.getProperty("/username");

            if ((bIsEmployee || bIsManager) && employeeId) {
                this.getView().setModel(new JSONModel([
                    {
                        id: employeeId,
                        name: username,
                        pernr: ""
                    }
                ]), "employees");

                this.byId("selectLeaveEmployee").setSelectedKey(String(employeeId));
                this.onEmployeeChange();
                return;
            }

            if (!bIsAdmin && !bIsHr) {
                MessageBox.error("Funcionário não identificado para este usuário.");
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
                        throw new Error((data && data.message) || "Erro ao carregar funcionários.");
                    }

                    return data || [];
                })
                .then((data) => {
                    this.getView().setModel(new JSONModel(data), "employees");
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onEmployeeChange: function () {
            const employeeId = this.byId("selectLeaveEmployee").getSelectedKey();

            if (!employeeId) {
                this.getView().setModel(new JSONModel([]), "leaveRequests");
                return;
            }

            fetch(`${BASE_URL}/leave-requests/employee/${employeeId}`, {
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao carregar ausências.");
                    }

                    return data || [];
                })
                .then((data) => {
                    this.getView().setModel(new JSONModel(data), "leaveRequests");
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onOpenCreateLeaveDialog: async function () {
            const employeeId = this.byId("selectLeaveEmployee").getSelectedKey();

            if (!employeeId) {
                MessageToast.show("Selecione um funcionário primeiro.");
                return;
            }

            if (!this._oCreateLeaveDialog) {
                const oDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.mahyhaker.hcmui.hcmui.view.fragments.CreateLeaveRequestDialog",
                    controller: this
                });

                this._oCreateLeaveDialog = /** @type {sap.m.Dialog} */ (oDialog);
                this.getView().addDependent(this._oCreateLeaveDialog);
            }

            this._oCreateLeaveDialog.open();
        },

        onCloseCreateLeaveDialog: function () {
            if (this._oCreateLeaveDialog) {
                this._oCreateLeaveDialog.close();
            }
        },

        onCreateLeaveRequest: function () {
            const employeeId = this.byId("selectLeaveEmployee").getSelectedKey();
            const startDate = this.byId("inputLeaveStartDate").getValue();
            const endDate = this.byId("inputLeaveEndDate").getValue();
            const type = this.byId("selectLeaveType").getSelectedKey();
            const reason = this.byId("inputLeaveReason").getValue().trim();

            if (!employeeId) {
                MessageToast.show("Selecione um funcionário.");
                return;
            }

            if (!startDate || !endDate) {
                MessageToast.show("Informe a data inicial e final.");
                return;
            }

            if (!type) {
                MessageToast.show("Selecione o tipo.");
                return;
            }

            if (!reason) {
                MessageToast.show("Informe o motivo.");
                return;
            }

            const payload = {
                employee: { id: Number(employeeId) },
                startDate,
                endDate,
                type,
                reason
            };

            fetch(`${BASE_URL}/leave-requests`, {
                method: "POST",
                headers: this._getAuthHeaders(),
                body: JSON.stringify(payload)
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao criar solicitação.");
                    }

                    return data;
                })
                .then(() => {
                    MessageToast.show("Solicitação criada com sucesso!");
                    this.clearCreateLeaveDialog();
                    this.onCloseCreateLeaveDialog();
                    this.onEmployeeChange();
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        clearCreateLeaveDialog: function () {
            this.byId("inputLeaveStartDate").setValue("");
            this.byId("inputLeaveEndDate").setValue("");
            this.byId("selectLeaveType").setSelectedKey("");
            this.byId("inputLeaveReason").setValue("");
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