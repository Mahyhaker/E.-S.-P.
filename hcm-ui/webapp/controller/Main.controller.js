sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, Fragment, MessageToast, MessageBox) {
    "use strict";

    const BASE_URL = "http://localhost:8080";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.Main", {
        onInit: function () {
            this._dashboardFilter = null;
            this._allEmployees = [];

            /** @type {sap.m.Dialog | null} */
            this._oCreateDialog = null;

            /** @type {sap.m.Dialog | null} */
            this._oEditDialog = null;

            /** @type {sap.m.Dialog | null} */
            this._oAccessDialog = null;

            const oRouter = this.getOwnerComponent().getRouter();

            oRouter.getRoute("RouteMain")
                .attachPatternMatched(this.onRouteMatched, this);

            oRouter.getRoute("RouteMainFiltered")
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

        onNavBack: function () {
            const oHistory = sap.ui.core.routing.History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, true);
            }
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
                MessageBox.error("Você não tem permissão para acessar Funcionários.", {
                    onClose: () => {
                        this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, true);
                    }
                });
                return false;
            }

            return true;
        },

        onRouteMatched: function (oEvent) {
            if (!this.checkAccess()) {
                return;
            }

            const oArgs = oEvent.getParameter("arguments") || {};
            this._dashboardFilter = oArgs.filter || null;

            this.loadEmployees();
            this.loadDepartments();
        },

        applyDashboardFilter: function () {
            if (!this._allEmployees) {
                return;
            }

            let aFiltered = [...this._allEmployees];

            if (this._dashboardFilter === "withoutDepartment") {
                aFiltered = aFiltered.filter(emp => !emp.department);
            }

            if (this._dashboardFilter === "withoutManager") {
                aFiltered = aFiltered.filter(emp => !emp.manager);
            }

            const oModel = new JSONModel(aFiltered);
            this.getView().setModel(oModel, "employees");

            if (this.byId("searchEmployee")) {
                this.byId("searchEmployee").setValue("");
            }

            if (this.byId("filterDepartment")) {
                this.byId("filterDepartment").setSelectedKey("");
            }
        },

        loadEmployees: function () {
            const oModel = new JSONModel();

            fetch(`${BASE_URL}/employees`, {
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao buscar funcionários.");
                    }

                    return data;
                })
                .then((data) => {
                    this._allEmployees = data;

                    oModel.setData(data);
                    this.getView().setModel(oModel, "employees");

                    const aManagers = data.filter(emp => emp.name && emp.pernr);
                    const oManagersModel = new JSONModel(aManagers);
                    this.getView().setModel(oManagersModel, "managers");

                    this.applyDashboardFilter();
                })
                .catch((error) => {
                    console.error("Erro ao buscar funcionários:", error);
                });
        },

        loadDepartments: function () {
            const oModel = new JSONModel();

            fetch(`${BASE_URL}/departments`, {
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada.");
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
                });
        },

        onFilterEmployees: function () {
            const sSearch = this.byId("searchEmployee").getValue().toLowerCase().trim();
            const sDepartmentId = this.byId("filterDepartment").getSelectedKey();

            let aFiltered = [...(this._allEmployees || [])];

            if (this._dashboardFilter === "withoutDepartment") {
                aFiltered = aFiltered.filter(emp => !emp.department);
            }

            if (this._dashboardFilter === "withoutManager") {
                aFiltered = aFiltered.filter(emp => !emp.manager);
            }

            if (sSearch) {
                aFiltered = aFiltered.filter(emp => {
                    const sName = emp.name ? emp.name.toLowerCase() : "";
                    const sPernr = emp.pernr ? emp.pernr.toLowerCase() : "";

                    return sName.includes(sSearch) || sPernr.includes(sSearch);
                });
            }

            if (sDepartmentId) {
                aFiltered = aFiltered.filter(emp =>
                    emp.department && String(emp.department.id) === String(sDepartmentId)
                );
            }

            const oModel = new JSONModel(aFiltered);
            this.getView().setModel(oModel, "employees");
        },

        onOpenCreateDialog: async function () {
            if (!this._oCreateDialog) {
                const oDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.mahyhaker.hcmui.hcmui.view.fragments.CreateEmployeeDialog",
                    controller: this
                });

                this._oCreateDialog = /** @type {sap.m.Dialog} */ (oDialog);
                this.getView().addDependent(this._oCreateDialog);
            }

            this._oCreateDialog.open();
        },

        onCloseCreateDialog: function () {
            if (this._oCreateDialog) {
                this._oCreateDialog.close();
            }
        },

        onCreateEmployee: function () {
            const sName = this.byId("inputName").getValue().trim();
            const sPosition = this.byId("inputPosition").getValue().trim();
            const sSalary = this.byId("inputSalary").getValue().trim();
            const sDepartmentId = this.byId("selectDepartment").getSelectedKey();
            const sManagerId = this.byId("selectManager").getSelectedKey();
            const sUsername = this.byId("inputUsername").getValue().trim();
            const sPassword = this.byId("inputPassword").getValue().trim();
            const sRole = this.byId("selectRole").getSelectedKey();

            const fSalary = Number(sSalary);

            if (!sName) {
                MessageToast.show("Informe o nome do funcionário.");
                return;
            }

            if (!sPosition) {
                MessageToast.show("Informe o cargo do funcionário.");
                return;
            }

            if (!sSalary || Number.isNaN(fSalary) || fSalary <= 0) {
                MessageToast.show("Informe um salário válido maior que zero.");
                return;
            }

            if (!sUsername) {
                MessageToast.show("Informe o username.");
                return;
            }

            if (!sPassword) {
                MessageToast.show("Informe a senha.");
                return;
            }

            if (!sRole) {
                MessageToast.show("Selecione a role.");
                return;
            }

            const oPayload = {
                name: sName,
                position: sPosition,
                salary: fSalary,
                departmentId: sDepartmentId ? Number(sDepartmentId) : null,
                managerId: sManagerId ? Number(sManagerId) : null,
                username: sUsername,
                password: sPassword,
                role: sRole,
                active: true
            };

            fetch(`${BASE_URL}/employees/with-user`, {
                method: "POST",
                headers: this._getAuthHeaders(),
                body: JSON.stringify(oPayload)
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao criar funcionário com usuário.");
                    }

                    return data;
                })
                .then(() => {
                    MessageToast.show("Funcionário e usuário criados com sucesso!");
                    this.onCloseCreateDialog();
                    this.clearCreateDialogFields();
                    this.loadEmployees();
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        clearCreateDialogFields: function () {
            this.byId("inputName").setValue("");
            this.byId("inputPosition").setValue("");
            this.byId("inputSalary").setValue("");
            this.byId("selectDepartment").setSelectedKey("");
            this.byId("selectManager").setSelectedKey("");
            this.byId("inputUsername").setValue("");
            this.byId("inputPassword").setValue("");
            this.byId("selectRole").setSelectedKey("");
        },

        onOpenEditDialog: async function () {
            const oList = this.byId("employeeList");
            const oSelectedItem = oList.getSelectedItem();

            if (!oSelectedItem) {
                MessageToast.show("Selecione um funcionário para editar.");
                return;
            }

            const oEmployee = oSelectedItem.getBindingContext("employees").getObject();
            this._selectedEmployeeId = oEmployee.id;

            if (!this._oEditDialog) {
                const oDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.mahyhaker.hcmui.hcmui.view.fragments.EditEmployeeDialog",
                    controller: this
                });

                this._oEditDialog = /** @type {sap.m.Dialog} */ (oDialog);
                this.getView().addDependent(this._oEditDialog);
            }

            this.byId("editInputName").setValue(oEmployee.name || "");
            this.byId("editInputPosition").setValue(oEmployee.position || "");
            this.byId("editInputSalary").setValue(oEmployee.salary || "");
            this.byId("editSelectDepartment").setSelectedKey(
                oEmployee.department ? String(oEmployee.department.id) : ""
            );
            this.byId("editSelectManager").setSelectedKey(
                oEmployee.manager ? String(oEmployee.manager.id) : ""
            );

            this._oEditDialog.open();
        },

        onCloseEditDialog: function () {
            if (this._oEditDialog) {
                this._oEditDialog.close();
            }
        },

        onOpenAccessDialog: async function () {
            const oList = this.byId("employeeList");
            const oSelectedItem = oList.getSelectedItem();

            if (!oSelectedItem) {
                MessageToast.show("Selecione um funcionário para gerenciar o acesso.");
                return;
            }

            const oEmployee = oSelectedItem.getBindingContext("employees").getObject();
            this._selectedAccessEmployeeId = oEmployee.id;

            if (!this._oAccessDialog) {
                const oDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.mahyhaker.hcmui.hcmui.view.fragments.EditAccessDialog",
                    controller: this
                });

                this._oAccessDialog = /** @type {sap.m.Dialog} */ (oDialog);
                this.getView().addDependent(this._oAccessDialog);
            }

            this.byId("accessSelectRole").setSelectedKey("");
            this.byId("accessSelectActive").setSelectedKey("");
            this.byId("accessInputPassword").setValue("");

            this._oAccessDialog.open();
        },

        onCloseAccessDialog: function () {
            if (this._oAccessDialog) {
                this._oAccessDialog.close();
            }
        },

        onSaveAccess: function () {
            const sRole = this.byId("accessSelectRole").getSelectedKey();
            const sActive = this.byId("accessSelectActive").getSelectedKey();
            const sPassword = this.byId("accessInputPassword").getValue().trim();

            const oPayload = {};

            if (sRole) {
                oPayload.role = sRole;
            }

            if (sActive === "true") {
                oPayload.active = true;
            } else if (sActive === "false") {
                oPayload.active = false;
            }

            if (sPassword) {
                oPayload.password = sPassword;
            }

            if (Object.keys(oPayload).length === 0) {
                MessageToast.show("Informe ao menos uma alteração.");
                return;
            }

            fetch(`${BASE_URL}/users/employee/${this._selectedAccessEmployeeId}`, {
                method: "PATCH",
                headers: this._getAuthHeaders(),
                body: JSON.stringify(oPayload)
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao atualizar acesso.");
                    }

                    return data;
                })
                .then(() => {
                    MessageToast.show("Acesso atualizado com sucesso!");
                    this.onCloseAccessDialog();
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onUpdateEmployee: function () {
            const sName = this.byId("editInputName").getValue().trim();
            const sPosition = this.byId("editInputPosition").getValue().trim();
            const sSalary = this.byId("editInputSalary").getValue().trim();
            const sDepartmentId = this.byId("editSelectDepartment").getSelectedKey();
            const sManagerId = this.byId("editSelectManager").getSelectedKey();

            const fSalary = Number(sSalary);

            if (!sName) {
                MessageToast.show("Informe o nome do funcionário.");
                return;
            }

            if (!sPosition) {
                MessageToast.show("Informe o cargo do funcionário.");
                return;
            }

            if (!sSalary || Number.isNaN(fSalary) || fSalary <= 0) {
                MessageToast.show("Informe um salário válido maior que zero.");
                return;
            }

            const oPayload = {
                name: sName,
                position: sPosition,
                salary: fSalary,
                department: sDepartmentId ? { id: Number(sDepartmentId) } : null,
                manager: sManagerId ? { id: Number(sManagerId) } : null
            };

            fetch(`${BASE_URL}/employees/${this._selectedEmployeeId}`, {
                method: "PUT",
                headers: this._getAuthHeaders(),
                body: JSON.stringify(oPayload)
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        this._handleUnauthorized();
                        throw new Error("Sessão expirada.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao atualizar funcionário.");
                    }

                    return data;
                })
                .then(() => {
                    MessageToast.show("Funcionário atualizado com sucesso!");
                    this.onCloseEditDialog();
                    this.loadEmployees();
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onOpenDepartments: function () {
            this.getOwnerComponent().getRouter().navTo("RouteDepartments");
        },

        onOpenOrgTree: function () {
            this.getOwnerComponent().getRouter().navTo("RouteOrgTree");
        },

        onOpenDetail: function (oEvent) {
            let oEmployee = null;

            if (oEvent && oEvent.getSource && oEvent.getSource().getBindingContext) {
                const oContext = oEvent.getSource().getBindingContext("employees");
                if (oContext) {
                    oEmployee = oContext.getObject();
                }
            }

            if (!oEmployee) {
                const oList = this.byId("employeeList");
                const oSelectedItem = oList.getSelectedItem();

                if (!oSelectedItem) {
                    MessageToast.show("Selecione um funcionário para ver os detalhes.");
                    return;
                }

                oEmployee = oSelectedItem.getBindingContext("employees").getObject();
            }

            this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                id: oEmployee.id
            });
        },

        onDeleteEmployee: function () {
            const oList = this.byId("employeeList");
            const oSelectedItem = oList.getSelectedItem();

            if (!oSelectedItem) {
                MessageToast.show("Selecione um funcionário para deletar.");
                return;
            }

            const oEmployee = oSelectedItem.getBindingContext("employees").getObject();

            MessageBox.confirm(
                `Deseja realmente deletar o funcionário ${oEmployee.name}?`,
                {
                    title: "Confirmar exclusão",
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: (oAction) => {
                        if (oAction === MessageBox.Action.YES) {
                            fetch(`${BASE_URL}/employees/${oEmployee.id}`, {
                                method: "DELETE",
                                headers: this._getAuthHeaders()
                            })
                                .then(async (response) => {
                                    if (response.status === 401) {
                                        this._handleUnauthorized();
                                        throw new Error("Sessão expirada.");
                                    }

                                    if (!response.ok) {
                                        let message = "Erro ao deletar funcionário.";

                                        try {
                                            const data = await response.json();
                                            message = data.message || message;
                                        } catch (e) {
                                            console.warn("Não foi possível interpretar a resposta de erro.", e);
                                        }

                                        throw new Error(message);
                                    }

                                    MessageToast.show("Funcionário deletado com sucesso!");
                                    this.loadEmployees();
                                })
                                .catch((error) => {
                                    MessageBox.error(error.message);
                                });
                        }
                    }
                }
            );
        }
    });
});