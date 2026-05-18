sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History"
], function (Controller, JSONModel, Fragment, MessageToast, MessageBox, History) {
    "use strict";

    const BASE_URL = window.location.hostname === "localhost" && window.location.port && window.location.port !== "80" ? "http://localhost:8080" : "";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.Main", {
        onInit: function () {
            this._dashboardFilter = null;
            this._allEmployees = [];
            this._oCreateDialog = null;
            this._oEditDialog = null;
            this._oAccessDialog = null;

            this.getView().setModel(new JSONModel(this._emptyEmployeesModel()), "employees");

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteMain").attachPatternMatched(this.onRouteMatched, this);
            oRouter.getRoute("RouteMainFiltered").attachPatternMatched(this.onRouteMatched, this);
        },

        _emptyEmployeesModel: function () {
            return {
                items: [],
                filteredItems: [],
                totalEmployees: 0,
                filteredCount: 0,
                withoutDepartment: 0,
                withoutManager: 0,
                managers: 0,
                search: "",
                selectedDepartmentId: "",
                selectedEmployee: null,
                noDataText: "Nenhum funcionario encontrado."
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

        _safeReadJson: async function (response) {
            const sText = await response.text();
            return sText ? JSON.parse(sText) : null;
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
                MessageBox.error("Voce nao tem permissao para acessar Funcionarios.", {
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

            const oModel = this.getView().getModel("employees");
            oModel.setProperty("/search", "");
            oModel.setProperty("/selectedDepartmentId", "");

            if (this.byId("searchEmployee")) {
                this.byId("searchEmployee").setValue("");
            }

            if (this.byId("filterDepartment")) {
                this.byId("filterDepartment").setSelectedKey("");
            }

            this.loadEmployees();
            this.loadDepartments();
        },

        loadEmployees: function () {
            const oPage = this.byId("pageEmployees");
            oPage.setBusy(true);

            fetch(`${BASE_URL}/employees`, {
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessao expirada ou acesso negado.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao buscar funcionarios.");
                    }

                    return data || [];
                })
                .then((data) => {
                    this._allEmployees = data;
                    this.getView().setModel(new JSONModel(data.filter(emp => emp.name && emp.pernr)), "managers");
                    this._refreshEmployeesModel();
                })
                .catch((error) => {
                    console.error("Erro ao buscar funcionarios:", error);
                    MessageBox.error(error.message);
                })
                .finally(() => {
                    oPage.setBusy(false);
                });
        },

        loadDepartments: function () {
            fetch(`${BASE_URL}/departments`, {
                headers: this._getAuthHeaders()
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessao expirada ou acesso negado.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao buscar departamentos.");
                    }

                    this.getView().setModel(new JSONModel(data || []), "departments");
                })
                .catch((error) => {
                    console.error("Erro ao buscar departamentos:", error);
                });
        },

        _refreshEmployeesModel: function () {
            const oModel = this.getView().getModel("employees");
            const sSearch = (oModel.getProperty("/search") || "").toLowerCase().trim();
            const sDepartmentId = oModel.getProperty("/selectedDepartmentId") || "";
            let aFiltered = [...(this._allEmployees || [])];

            if (this._dashboardFilter === "withoutDepartment") {
                aFiltered = aFiltered.filter(emp => !emp.department);
            }

            if (this._dashboardFilter === "withoutManager") {
                aFiltered = aFiltered.filter(emp => !emp.manager);
            }

            if (sSearch) {
                aFiltered = aFiltered.filter(emp => {
                    const sContent = [
                        emp.name,
                        emp.pernr,
                        emp.position,
                        emp.department && emp.department.name,
                        emp.manager && emp.manager.name
                    ].join(" ").toLowerCase();

                    return sContent.includes(sSearch);
                });
            }

            if (sDepartmentId) {
                aFiltered = aFiltered.filter(emp =>
                    emp.department && String(emp.department.id) === String(sDepartmentId)
                );
            }

            oModel.setProperty("/items", this._allEmployees);
            oModel.setProperty("/filteredItems", aFiltered);
            oModel.setProperty("/totalEmployees", this._allEmployees.length);
            oModel.setProperty("/filteredCount", aFiltered.length);
            oModel.setProperty("/withoutDepartment", this._allEmployees.filter(emp => !emp.department).length);
            oModel.setProperty("/withoutManager", this._allEmployees.filter(emp => !emp.manager).length);
            oModel.setProperty("/managers", this._allEmployees.filter(emp =>
                this._allEmployees.some(other => other.manager && other.manager.id === emp.id)
            ).length);
            oModel.setProperty("/selectedEmployee", null);
            oModel.setProperty(
                "/noDataText",
                sSearch || sDepartmentId || this._dashboardFilter
                    ? "Nenhum funcionario encontrado para os filtros atuais."
                    : "Nenhum funcionario encontrado."
            );
        },

        onFilterEmployees: function () {
            const oModel = this.getView().getModel("employees");
            oModel.setProperty("/search", this.byId("searchEmployee").getValue());
            oModel.setProperty("/selectedDepartmentId", this.byId("filterDepartment").getSelectedKey());
            this._refreshEmployeesModel();
        },

        onClearFilters: function () {
            this._dashboardFilter = null;
            this.byId("searchEmployee").setValue("");
            this.byId("filterDepartment").setSelectedKey("");

            const oModel = this.getView().getModel("employees");
            oModel.setProperty("/search", "");
            oModel.setProperty("/selectedDepartmentId", "");
            this._refreshEmployeesModel();
        },

        onEmployeeSelectionChange: function (oEvent) {
            const oItem = oEvent.getParameter("listItem");
            const oEmployee = oItem && oItem.getBindingContext("employees").getObject();
            this.getView().getModel("employees").setProperty("/selectedEmployee", oEmployee || null);
        },

        _getSelectedEmployee: function (message) {
            const oEmployee = this.getView().getModel("employees").getProperty("/selectedEmployee");

            if (!oEmployee) {
                MessageToast.show(message || "Selecione um funcionario.");
                return null;
            }

            return oEmployee;
        },

        onOpenCreateDialog: async function () {
            if (!this._oCreateDialog) {
                const oDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.mahyhaker.hcmui.hcmui.view.fragments.CreateEmployeeDialog",
                    controller: this
                });

                this._oCreateDialog = oDialog;
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

            if (!sName || !sPosition || !sUsername || !sPassword || !sRole) {
                MessageToast.show("Preencha nome, cargo, usuario, senha e perfil.");
                return;
            }

            if (!sSalary || Number.isNaN(fSalary) || fSalary <= 0) {
                MessageToast.show("Informe um salario valido maior que zero.");
                return;
            }

            fetch(`${BASE_URL}/employees/with-user`, {
                method: "POST",
                headers: this._getAuthHeaders(),
                body: JSON.stringify({
                    name: sName,
                    position: sPosition,
                    salary: fSalary,
                    departmentId: sDepartmentId ? Number(sDepartmentId) : null,
                    managerId: sManagerId ? Number(sManagerId) : null,
                    username: sUsername,
                    password: sPassword,
                    role: sRole,
                    active: true
                })
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessao expirada ou acesso negado.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao criar funcionario com usuario.");
                    }

                    return data;
                })
                .then(() => {
                    MessageToast.show("Funcionario e usuario criados com sucesso!");
                    this.onCloseCreateDialog();
                    this.clearCreateDialogFields();
                    this.loadEmployees();
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        clearCreateDialogFields: function () {
            ["inputName", "inputPosition", "inputSalary", "inputUsername", "inputPassword"].forEach(id => this.byId(id).setValue(""));
            this.byId("selectDepartment").setSelectedKey("");
            this.byId("selectManager").setSelectedKey("");
            this.byId("selectRole").setSelectedKey("");
        },

        onOpenEditDialog: async function () {
            const oEmployee = this._getSelectedEmployee("Selecione um funcionario para editar.");
            if (!oEmployee) {
                return;
            }

            this._selectedEmployeeId = oEmployee.id;

            if (!this._oEditDialog) {
                const oDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.mahyhaker.hcmui.hcmui.view.fragments.EditEmployeeDialog",
                    controller: this
                });

                this._oEditDialog = oDialog;
                this.getView().addDependent(this._oEditDialog);
            }

            this.byId("editInputName").setValue(oEmployee.name || "");
            this.byId("editInputPosition").setValue(oEmployee.position || "");
            this.byId("editInputSalary").setValue(oEmployee.salary || "");
            this.byId("editSelectDepartment").setSelectedKey(oEmployee.department ? String(oEmployee.department.id) : "");
            this.byId("editSelectManager").setSelectedKey(oEmployee.manager ? String(oEmployee.manager.id) : "");
            this._oEditDialog.open();
        },

        onCloseEditDialog: function () {
            if (this._oEditDialog) {
                this._oEditDialog.close();
            }
        },

        onUpdateEmployee: function () {
            const sName = this.byId("editInputName").getValue().trim();
            const sPosition = this.byId("editInputPosition").getValue().trim();
            const sSalary = this.byId("editInputSalary").getValue().trim();
            const sDepartmentId = this.byId("editSelectDepartment").getSelectedKey();
            const sManagerId = this.byId("editSelectManager").getSelectedKey();
            const fSalary = Number(sSalary);

            if (!sName || !sPosition) {
                MessageToast.show("Preencha nome e cargo.");
                return;
            }

            if (!sSalary || Number.isNaN(fSalary) || fSalary <= 0) {
                MessageToast.show("Informe um salario valido maior que zero.");
                return;
            }

            fetch(`${BASE_URL}/employees/${this._selectedEmployeeId}`, {
                method: "PUT",
                headers: this._getAuthHeaders(),
                body: JSON.stringify({
                    name: sName,
                    position: sPosition,
                    salary: fSalary,
                    department: sDepartmentId ? { id: Number(sDepartmentId) } : null,
                    manager: sManagerId ? { id: Number(sManagerId) } : null
                })
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessao expirada ou acesso negado.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao atualizar funcionario.");
                    }

                    return data;
                })
                .then(() => {
                    MessageToast.show("Funcionario atualizado com sucesso!");
                    this.onCloseEditDialog();
                    this.loadEmployees();
                })
                .catch((error) => {
                    MessageBox.error(error.message);
                });
        },

        onOpenAccessDialog: async function () {
            const oEmployee = this._getSelectedEmployee("Selecione um funcionario para gerenciar o acesso.");
            if (!oEmployee) {
                return;
            }

            this._selectedAccessEmployeeId = oEmployee.id;

            if (!this._oAccessDialog) {
                const oDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.mahyhaker.hcmui.hcmui.view.fragments.EditAccessDialog",
                    controller: this
                });

                this._oAccessDialog = oDialog;
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
                MessageToast.show("Informe ao menos uma alteracao.");
                return;
            }

            fetch(`${BASE_URL}/users/employee/${this._selectedAccessEmployeeId}`, {
                method: "PATCH",
                headers: this._getAuthHeaders(),
                body: JSON.stringify(oPayload)
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessao expirada ou acesso negado.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao atualizar acesso.");
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
                oEmployee = oContext && oContext.getObject();
            }

            if (!oEmployee) {
                oEmployee = this._getSelectedEmployee("Selecione um funcionario para ver os detalhes.");
            }

            if (oEmployee) {
                this.getOwnerComponent().getRouter().navTo("RouteDetail", { id: oEmployee.id });
            }
        },

        onDeleteEmployee: function () {
            const oEmployee = this._getSelectedEmployee("Selecione um funcionario para deletar.");
            if (!oEmployee) {
                return;
            }

            MessageBox.confirm(
                `Deseja realmente deletar o funcionario ${oEmployee.name}?`,
                {
                    title: "Confirmar exclusao",
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: (oAction) => {
                        if (oAction === MessageBox.Action.YES) {
                            fetch(`${BASE_URL}/employees/${oEmployee.id}`, {
                                method: "DELETE",
                                headers: this._getAuthHeaders()
                            })
                                .then(async (response) => {
                                    if (response.status === 401 || response.status === 403) {
                                        this._handleUnauthorized();
                                        throw new Error("Sessao expirada ou acesso negado.");
                                    }

                                    if (!response.ok) {
                                        const data = await this._safeReadJson(response);
                                        throw new Error((data && data.message) || "Erro ao deletar funcionario.");
                                    }

                                    MessageToast.show("Funcionario deletado com sucesso!");
                                    this.loadEmployees();
                                })
                                .catch((error) => {
                                    MessageBox.error(error.message);
                                });
                        }
                    }
                }
            );
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
                return "";
            }

            return Number(value).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });
        },

        onNavBack: function () {
            const sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteDashboard", {}, true);
            }
        }
    });
});
