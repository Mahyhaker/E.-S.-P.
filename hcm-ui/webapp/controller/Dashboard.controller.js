sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    const BASE_URL = window.location.hostname === "localhost" && window.location.port && window.location.port !== "80" ? "http://localhost:8080" : "";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.Dashboard", {
        onInit: function () {
            this.getView().setModel(new JSONModel(this._emptyDashboard()), "dashboard");

            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteDashboard")
                .attachPatternMatched(this.onRouteMatched, this);
        },

        _emptyDashboard: function () {
            return {
                busy: false,
                totalEmployees: 0,
                totalDepartments: 0,
                totalManagers: 0,
                withoutManager: 0,
                withoutDepartment: 0,
                pendingLeaveRequests: 0,
                approvedLeaveRequests: 0,
                rejectedLeaveRequests: 0,
                upcomingLeaveRequests: [],
                profile: null,
                employeesWithoutDepartment: [],
                departmentChartData: [],
                recentEmployees: []
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

        _safeJson: async function (response) {
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        },

        onRouteMatched: function () {
            const oSession = this.getOwnerComponent().getModel("session");

            if (!oSession || !oSession.getProperty("/isAuthenticated")) {
                this.getOwnerComponent().getRouter().navTo("RouteLogin", {}, true);
                return;
            }

            this.loadDashboard();
        },

        loadDashboard: async function () {
            const oModel = this.getView().getModel("dashboard");
            oModel.setProperty("/busy", true);

            try {
                const oHeaders = this._getAuthHeaders();

                const oSession = this.getOwnerComponent().getModel("session");
                const bIsAdmin = oSession.getProperty("/isAdmin");
                const bIsHr = oSession.getProperty("/isHr");
                const aRequests = [
                    fetch(`${BASE_URL}/dashboard/summary`, { headers: oHeaders }),
                    fetch(`${BASE_URL}/users/me`, { headers: oHeaders })
                ];

                if (bIsAdmin || bIsHr) {
                    aRequests.push(fetch(`${BASE_URL}/employees`, { headers: oHeaders }));
                }

                const responses = await Promise.all(aRequests);
                const summaryResponse = responses[0];
                const profileResponse = responses[1];
                const employeesResponse = responses[2] || null;

                if (responses.some(response => response.status === 401)) {
                    this._handleUnauthorized();
                    return;
                }

                if (!summaryResponse.ok) {
                    const data = await this._safeJson(summaryResponse);
                    throw new Error((data && data.message) || "Erro ao carregar indicadores.");
                }

                if (employeesResponse && !employeesResponse.ok) {
                    const data = await this._safeJson(employeesResponse);
                    throw new Error((data && data.message) || "Erro ao carregar funcionarios.");
                }

                const summary = await summaryResponse.json();
                const employees = employeesResponse ? await employeesResponse.json() : [];
                const profile = profileResponse.ok ? await this._safeJson(profileResponse) : null;
                const departmentCountMap = {};

                employees.forEach(emp => {
                    const deptName = emp.department && emp.department.name ? emp.department.name : "Sem departamento";
                    departmentCountMap[deptName] = (departmentCountMap[deptName] || 0) + 1;
                });

                oModel.setData({
                    busy: false,
                    totalEmployees: summary.totalEmployees,
                    totalDepartments: summary.totalDepartments,
                    totalManagers: summary.totalManagers,
                    withoutManager: summary.employeesWithoutManager,
                    withoutDepartment: summary.employeesWithoutDepartment,
                    pendingLeaveRequests: summary.pendingLeaveRequests,
                    approvedLeaveRequests: summary.approvedLeaveRequests,
                    rejectedLeaveRequests: summary.rejectedLeaveRequests,
                    upcomingLeaveRequests: summary.upcomingLeaveRequests || [],
                    profile,
                    employeesWithoutDepartment: employees.filter(emp => !emp.department),
                    departmentChartData: Object.keys(departmentCountMap).map(name => ({
                        department: name,
                        count: departmentCountMap[name]
                    })),
                    recentEmployees: [...employees].sort((a, b) => b.id - a.id).slice(0, 5)
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
            this.getOwnerComponent().getRouter().navTo("RouteMainFiltered", { filter: "withoutDepartment" });
        },

        onOpenEmployeesWithoutManager: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMainFiltered", { filter: "withoutManager" });
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

        onOpenPendingLeaveRequests: function () {
            this.getOwnerComponent().getRouter().navTo("RouteLeaveRequestsStatus", { status: "PENDING" });
        },

        onOpenApprovedLeaveRequests: function () {
            this.getOwnerComponent().getRouter().navTo("RouteLeaveRequestsStatus", { status: "APPROVED" });
        },

        onOpenRejectedLeaveRequests: function () {
            this.getOwnerComponent().getRouter().navTo("RouteLeaveRequestsStatus", { status: "REJECTED" });
        },

        onOpenManagerApprovals: function () {
            this.getOwnerComponent().getRouter().navTo("RouteManagerApprovals");
        },

        onOpenHrApprovals: function () {
            this.getOwnerComponent().getRouter().navTo("RouteHrApprovals");
        },

        onOpenEmployeeDetail: function (oEvent) {
            const oEmployee = oEvent.getSource().getBindingContext("dashboard").getObject();
            this.getOwnerComponent().getRouter().navTo("RouteDetail", { id: oEmployee.id });
        }
    });
});
