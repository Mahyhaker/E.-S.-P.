sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    const BASE_URL = "http://localhost:8080";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.Dashboard", {
        onInit: function () {
            this.getView().setModel(new JSONModel({
                busy: false,
                totalEmployees: 0,
                totalDepartments: 0,
                totalManagers: 0,
                withoutManager: 0,
                withoutDepartment: 0,
                employeesWithoutDepartment: [],
                departmentChartData: [],
                recentEmployees: []
            }), "dashboard");

            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteDashboard")
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

        onRouteMatched: function () {
            const oSession = this.getOwnerComponent().getModel("session");

            if (!oSession || !oSession.getProperty("/isAuthenticated")) {
                this.getOwnerComponent().getRouter().navTo("RouteLogin", {}, true);
                return;
            }

            const bIsAdmin = oSession.getProperty("/isAdmin");
            const bIsHr = oSession.getProperty("/isHr");

            if (bIsAdmin || bIsHr) {
                this.loadDashboard();
                return;
            }

            const oModel = this.getView().getModel("dashboard");
            oModel.setData({
                busy: false,
                totalEmployees: 0,
                totalDepartments: 0,
                totalManagers: 0,
                withoutManager: 0,
                withoutDepartment: 0,
                employeesWithoutDepartment: [],
                departmentChartData: [],
                recentEmployees: []
            });
        },

        loadDashboard: async function () {
            const oModel = this.getView().getModel("dashboard");
            oModel.setProperty("/busy", true);

            try {
                const oHeaders = this._getAuthHeaders();

                const [employeesResponse, departmentsResponse] = await Promise.all([
                    fetch(`${BASE_URL}/employees`, {
                        headers: oHeaders
                    }),
                    fetch(`${BASE_URL}/departments`, {
                        headers: oHeaders
                    })
                ]);

                if (employeesResponse.status === 401 || departmentsResponse.status === 401) {
                    this._handleUnauthorized();
                    return;
                }

                if (!employeesResponse.ok) {
                    throw new Error("Erro ao carregar funcionários.");
                }

                if (!departmentsResponse.ok) {
                    throw new Error("Erro ao carregar departamentos.");
                }

                const employees = await employeesResponse.json();
                const departments = await departmentsResponse.json();

                const totalEmployees = employees.length;
                const totalDepartments = departments.length;
                const totalManagers = employees.filter(emp =>
                    employees.some(other => other.manager && other.manager.id === emp.id)
                ).length;
                const withoutManager = employees.filter(emp => !emp.manager).length;
                const employeesWithoutDepartment = employees.filter(emp => !emp.department);
                const withoutDepartment = employeesWithoutDepartment.length;

                const departmentCountMap = {};

                employees.forEach(emp => {
                    const deptName = emp.department && emp.department.name
                        ? emp.department.name
                        : "Sem departamento";

                    if (!departmentCountMap[deptName]) {
                        departmentCountMap[deptName] = 0;
                    }

                    departmentCountMap[deptName]++;
                });

                const departmentChartData = Object.keys(departmentCountMap).map(name => ({
                    department: name,
                    count: departmentCountMap[name]
                }));

                const recentEmployees = [...employees]
                    .sort((a, b) => b.id - a.id)
                    .slice(0, 5);

                oModel.setData({
                    busy: false,
                    totalEmployees,
                    totalDepartments,
                    totalManagers,
                    withoutManager,
                    withoutDepartment,
                    employeesWithoutDepartment,
                    departmentChartData,
                    recentEmployees
                });
            } catch (error) {
                oModel.setProperty("/busy", false);
                console.error("Erro ao carregar dashboard:", error);
            }
        },

        onOpenEmployees: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        },

        onOpenEmployeesWithoutDepartment: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMainFiltered", {
                filter: "withoutDepartment"
            });
        },

        onOpenEmployeesWithoutManager: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMainFiltered", {
                filter: "withoutManager"
            });
        },

        onOpenDepartments: function () {
            this.getOwnerComponent().getRouter().navTo("RouteDepartments");
        },

        onOpenOrgTree: function () {
            this.getOwnerComponent().getRouter().navTo("RouteOrgTree");
        },

        onOpenLeaveRequests: function () {
            this.getOwnerComponent().getRouter().navTo("RouteLeaveRequests");
        },

        onOpenManagerApprovals: function () {
            this.getOwnerComponent().getRouter().navTo("RouteManagerApprovals");
        },

        onOpenHrApprovals: function () {
            this.getOwnerComponent().getRouter().navTo("RouteHrApprovals");
        },

        onOpenEmployeeDetail: function (oEvent) {
            const oEmployee = oEvent.getSource().getBindingContext("dashboard").getObject();

            this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                id: oEmployee.id
            });
        }
    });
});