sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox"
], function (Controller, JSONModel, History, MessageBox) {
    "use strict";

    const BASE_URL = window.location.hostname === "localhost" && window.location.port && window.location.port !== "80" ? "http://localhost:8080" : "";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.OrgTree", {
        onInit: function () {
            this.getView().setModel(new JSONModel({
                busy: false,
                nodes: [],
                filteredNodes: [],
                totalEmployees: 0,
                totalManagers: 0,
                totalDepartments: 0,
                search: "",
                noDataText: "Nenhuma estrutura organizacional encontrada."
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
                MessageBox.error("Voce nao tem permissao para acessar o Organograma.", {
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
                        throw new Error("Sessao expirada ou acesso negado.");
                    }

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Erro ao buscar arvore organizacional.");
                    }

                    return data;
                })
                .then((data) => {
                    const aNodes = data || [];
                    const oSummary = this._buildSummary(aNodes);

                    oModel.setData({
                        busy: false,
                        nodes: aNodes,
                        filteredNodes: aNodes,
                        totalEmployees: oSummary.totalEmployees,
                        totalManagers: oSummary.totalManagers,
                        totalDepartments: oSummary.totalDepartments,
                        search: "",
                        noDataText: "Nenhuma estrutura organizacional encontrada."
                    });

                    setTimeout(() => this.onExpandAll(), 0);
                })
                .catch((error) => {
                    oModel.setProperty("/busy", false);
                    console.error("Erro ao buscar arvore organizacional:", error);
                });
        },

        onSearch: function (oEvent) {
            const sQuery = (oEvent.getParameter("query") || oEvent.getParameter("newValue") || "").trim().toLowerCase();
            const oModel = this.getView().getModel("tree");
            const aNodes = oModel.getProperty("/nodes") || [];
            const aFilteredNodes = sQuery ? this._filterNodes(aNodes, sQuery) : aNodes;

            oModel.setProperty("/search", sQuery);
            oModel.setProperty("/filteredNodes", aFilteredNodes);
            oModel.setProperty(
                "/noDataText",
                sQuery ? "Nenhum colaborador encontrado para esta busca." : "Nenhuma estrutura organizacional encontrada."
            );

            setTimeout(() => this.onExpandAll(), 0);
        },

        onExpandAll: function () {
            const oTree = this.byId("orgTree");
            if (oTree && oTree.expandToLevel) {
                oTree.expandToLevel(10);
            }
        },

        onCollapseAll: function () {
            const oTree = this.byId("orgTree");
            if (oTree && oTree.collapseAll) {
                oTree.collapseAll();
            }
        },

        onOpenEmployee: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext("tree");
            const oEmployee = oContext && oContext.getObject();

            if (oEmployee && oEmployee.id) {
                this.getOwnerComponent().getRouter().navTo("RouteDetail", { id: oEmployee.id });
            }
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

        formatReportsText: function (children) {
            const iCount = children ? children.length : 0;

            if (iCount === 0) {
                return "Sem subordinados";
            }

            return iCount === 1 ? "1 subordinado direto" : `${iCount} subordinados diretos`;
        },

        formatReportsState: function (children) {
            return children && children.length > 0 ? "Information" : "None";
        },

        _buildSummary: function (nodes) {
            const oDepartments = {};
            let iEmployees = 0;
            let iManagers = 0;

            const fnWalk = (aItems) => {
                (aItems || []).forEach((item) => {
                    iEmployees += 1;

                    if (item.department) {
                        oDepartments[item.department] = true;
                    }

                    if (item.children && item.children.length) {
                        iManagers += 1;
                        fnWalk(item.children);
                    }
                });
            };

            fnWalk(nodes);

            return {
                totalEmployees: iEmployees,
                totalManagers: iManagers,
                totalDepartments: Object.keys(oDepartments).length
            };
        },

        _filterNodes: function (nodes, query) {
            return (nodes || [])
                .map((node) => {
                    const aChildren = this._filterNodes(node.children || [], query);
                    const sContent = [
                        node.name,
                        node.position,
                        node.department,
                        node.pernr
                    ].join(" ").toLowerCase();

                    if (sContent.includes(query) || aChildren.length > 0) {
                        return Object.assign({}, node, { children: aChildren });
                    }

                    return null;
                })
                .filter(Boolean);
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
