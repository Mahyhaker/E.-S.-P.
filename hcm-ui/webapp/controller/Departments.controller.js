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

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.Departments", {
        onInit: function () {
            this._oCreateDepartmentDialog = null;
            this._allDepartments = [];

            this.getView().setModel(new JSONModel({
                items: [],
                filteredItems: [],
                totalDepartments: 0,
                totalEmployees: 0,
                emptyDepartments: 0,
                search: "",
                selectedDepartment: null,
                noDataText: "Nenhum departamento cadastrado."
            }), "departments");

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
            const bIsHr = oSession.getProperty("/isHr");

            if (!bIsAdmin && !bIsHr) {
                MessageBox.error("Voce nao tem permissao para acessar Departamentos.", {
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

        loadDepartments: async function () {
            const oPage = this.byId("pageDepartments");
            const oModel = this.getView().getModel("departments");
            const oHeaders = this._getAuthHeaders();

            oPage.setBusy(true);

            try {
                const [departmentsResponse, employeesResponse] = await Promise.all([
                    fetch(`${BASE_URL}/departments`, { headers: oHeaders }),
                    fetch(`${BASE_URL}/employees`, { headers: oHeaders })
                ]);

                if ([departmentsResponse, employeesResponse].some(response => response.status === 401 || response.status === 403)) {
                    this._handleUnauthorized();
                    throw new Error("Sessao expirada ou acesso negado.");
                }

                const departments = await this._safeReadJson(departmentsResponse) || [];
                const employees = await this._safeReadJson(employeesResponse) || [];

                if (!departmentsResponse.ok) {
                    throw new Error((departments && departments.message) || "Erro ao buscar departamentos.");
                }

                if (!employeesResponse.ok) {
                    throw new Error((employees && employees.message) || "Erro ao buscar funcionarios.");
                }

                const aItems = this._buildDepartmentItems(departments, employees);
                this._allDepartments = aItems;

                oModel.setData({
                    items: aItems,
                    filteredItems: aItems,
                    totalDepartments: aItems.length,
                    totalEmployees: employees.length,
                    emptyDepartments: aItems.filter(item => item.employeeCount === 0).length,
                    search: "",
                    selectedDepartment: null,
                    noDataText: "Nenhum departamento cadastrado."
                });

                const oDepartmentList = this.byId("departmentList");
                if (oDepartmentList) {
                    oDepartmentList.removeSelections(true);
                }
            } catch (error) {
                console.error("Erro ao buscar departamentos:", error);
                MessageBox.error(error.message);
            } finally {
                oPage.setBusy(false);
            }
        },

        _buildDepartmentItems: function (departments, employees) {
            return [...departments]
                .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                .map((department) => {
                    const aEmployees = employees.filter(employee =>
                        employee.department && String(employee.department.id) === String(department.id)
                    );

                    return {
                        id: department.id,
                        name: department.name,
                        employeeCount: aEmployees.length,
                        employeesPreview: aEmployees.slice(0, 3).map(employee => employee.name).join(", "),
                        canDelete: aEmployees.length === 0,
                        statusText: aEmployees.length === 0 ? "Sem colaboradores" : "Ativo",
                        statusState: aEmployees.length === 0 ? "Warning" : "Success"
                    };
                });
        },

        onSearch: function (oEvent) {
            const sQuery = (oEvent.getParameter("query") || oEvent.getParameter("newValue") || "").trim().toLowerCase();
            const aFiltered = sQuery
                ? this._allDepartments.filter(department =>
                    [department.name, department.id, department.employeesPreview].join(" ").toLowerCase().includes(sQuery)
                )
                : this._allDepartments;

            const oModel = this.getView().getModel("departments");
            oModel.setProperty("/search", sQuery);
            oModel.setProperty("/filteredItems", aFiltered);
            oModel.setProperty("/selectedDepartment", null);
            const oDepartmentList = this.byId("departmentList");
            if (oDepartmentList) {
                oDepartmentList.removeSelections(true);
            }
            oModel.setProperty(
                "/noDataText",
                sQuery ? "Nenhum departamento encontrado para esta busca." : "Nenhum departamento cadastrado."
            );
        },

        onDepartmentSelectionChange: function (oEvent) {
            const oItem = oEvent.getParameter("listItem");
            const oDepartment = oItem && oItem.getBindingContext("departments").getObject();
            this.getView().getModel("departments").setProperty("/selectedDepartment", oDepartment || null);
        },

        onOpenCreateDepartmentDialog: async function () {
            if (!this._oCreateDepartmentDialog) {
                const oDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.mahyhaker.hcmui.hcmui.view.fragments.CreateDepartmentDialog",
                    controller: this
                });

                this._oCreateDepartmentDialog = oDialog;
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

            fetch(`${BASE_URL}/departments`, {
                method: "POST",
                headers: this._getAuthHeaders(),
                body: JSON.stringify({ name: sName })
            })
                .then(async (response) => {
                    if (response.status === 401 || response.status === 403) {
                        this._handleUnauthorized();
                        throw new Error("Sessao expirada ou acesso negado.");
                    }

                    const data = await this._safeReadJson(response);

                    if (!response.ok) {
                        throw new Error((data && data.message) || "Erro ao criar departamento.");
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
            const oDepartment = this.getView().getModel("departments").getProperty("/selectedDepartment");

            if (!oDepartment) {
                MessageToast.show("Selecione um departamento para deletar.");
                return;
            }

            if (!oDepartment.canDelete) {
                MessageBox.warning("Este departamento possui colaboradores vinculados. Remova ou transfira os colaboradores antes de deletar.");
                return;
            }

            MessageBox.confirm(
                `Deseja realmente deletar o departamento ${oDepartment.name}?`,
                {
                    title: "Confirmar exclusao",
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
                                        throw new Error("Sessao expirada ou acesso negado.");
                                    }

                                    if (!response.ok) {
                                        const data = await this._safeReadJson(response);
                                        throw new Error((data && data.message) || "Erro ao deletar departamento.");
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

        formatEmployeeCountText: function (count) {
            return Number(count) === 1 ? "1 colaborador" : `${count || 0} colaboradores`;
        },

        formatDeleteTooltip: function (canDelete) {
            return canDelete ? "Departamento sem colaboradores vinculados" : "Transfira os colaboradores antes de deletar";
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
