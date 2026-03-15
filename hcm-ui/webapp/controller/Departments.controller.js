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

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.Departments", {
        onInit: function () {
            /** @type {sap.m.Dialog | null} */
            this._oCreateDepartmentDialog = null;

            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteDepartments")
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
                MessageBox.error("Você não tem permissão para acessar Departamentos.", {
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

            this.loadDepartments();
        },

        loadDepartments: function () {
            const oPage = this.byId("pageDepartments");
            const oModel = new JSONModel();

            oPage.setBusy(true);

            fetch(`${BASE_URL}/departments`, {
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada ou acesso negado.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao buscar departamentos.");
                    }

                    return data;
                })
                .then((data) => {
                    oModel.setData(data);
                    this.getView().setModel(oModel, "departments");
                })
                .catch((error) => {
                    console.error("Erro ao buscar departamentos:", error);
                    MessageBox.error(error.message);
                })
                .finally(() => {
                    oPage.setBusy(false);
                });
        },


        onOpenCreateDepartmentDialog: async function () {
            if (!this._oCreateDepartmentDialog) {
                const oDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.mahyhaker.hcmui.hcmui.view.fragments.CreateDepartmentDialog",
                    controller: this
                });

                this._oCreateDepartmentDialog = /** @type {sap.m.Dialog} */ (oDialog);
                this.getView().addDependent(this._oCreateDepartmentDialog);
            }

            this._oCreateDepartmentDialog.open();
        },

        onCloseCreateDepartmentDialog: function () {
            if (this._oCreateDepartmentDialog) {
                this._oCreateDepartmentDialog.close();
            }
        },

        onCreateDepartment: function () {
            const sName = this.byId("inputDepartmentName").getValue().trim();

            if (!sName) {
                MessageToast.show("Informe o nome do departamento.");
                return;
            }

            const oPayload = {
                name: sName
            };

            fetch(`${BASE_URL}/departments`, {
                method: "POST",
                headers: this._getAuthHeaders(),
                body: JSON.stringify(oPayload)
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada ou acesso negado.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao criar departamento.");
                    }

                    return data;
                })
                .then(() => {
                    MessageToast.show("Departamento criado com sucesso!");
                    this.onCloseCreateDepartmentDialog();
                    this.byId("inputDepartmentName").setValue("");
                    this.loadDepartments();
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onDeleteDepartment: function () {
            const oList = this.byId("departmentList");
            const oSelectedItem = oList.getSelectedItem();

            if (!oSelectedItem) {
                MessageToast.show("Selecione um departamento para deletar.");
                return;
            }

            const oDepartment = oSelectedItem.getBindingContext("departments").getObject();

            MessageBox.confirm(
                `Deseja realmente deletar o departamento ${oDepartment.name}?`,
                {
                    title: "Confirmar exclusão",
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: (oAction) => {
                        if (oAction === MessageBox.Action.YES) {
                            fetch(`${BASE_URL}/departments/${oDepartment.id}`, {
                                method: "DELETE",
                                headers: this._getAuthHeaders()
                            })
                                .then(async (response) => {
                                    if (response.status === 401 || response.status === 403) {
                                        this._handleUnauthorized();
                                        throw new Error("Sessão expirada ou acesso negado.");
                                    }

                                    if (!response.ok) {
                                        let message = "Erro ao deletar departamento.";

                                        try {
                                            const data = await response.json();
                                            message = data.message || message;
                                        } catch (e) {
                                            console.warn("Não foi possível interpretar a resposta de erro.", e);
                                        }

                                        throw new Error(message);
                                    }

                                    MessageToast.show("Departamento deletado com sucesso!");
                                    this.loadDepartments();
                                })
                                .catch((error) => {
                                    MessageBox.error(error.message);
                                });
                        }
                    }
                }
            );
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