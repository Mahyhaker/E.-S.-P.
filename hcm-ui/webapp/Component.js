sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("com.mahyhaker.hcmui.hcmui.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            const sStoredSession = localStorage.getItem("hcmSession");

            let oSessionData = {
                token: "",
                username: "",
                role: "",
                employeeId: null,
                isAdmin: false,
                isHr: false,
                isManager: false,
                isEmployee: false,
                requiresPersonalDataSetup: false,
                isAuthenticated: false
            };

            if (sStoredSession) {
                const oParsed = JSON.parse(sStoredSession);

                oSessionData = {
                    token: oParsed.token || "",
                    username: oParsed.username || "",
                    role: oParsed.role || "",
                    employeeId: oParsed.employeeId ?? null,
                    isAdmin: !!oParsed.isAdmin,
                    isHr: !!oParsed.isHr,
                    isManager: !!oParsed.isManager,
                    isEmployee: !!oParsed.isEmployee,
                    requiresPersonalDataSetup: !!oParsed.requiresPersonalDataSetup,
                    isAuthenticated: !!oParsed.token
                };
            }

            this.setModel(new JSONModel(oSessionData), "session");
            this.getRouter().attachRouteMatched(this._enforceHrProfileSetup, this);
            this.getRouter().initialize();
        },

        setSession: function (oSessionData) {
            this.getModel("session").setData({
                token: oSessionData.token || "",
                username: oSessionData.username || "",
                role: oSessionData.role || "",
                employeeId: oSessionData.employeeId ?? null,
                isAdmin: !!oSessionData.isAdmin,
                isHr: !!oSessionData.isHr,
                isManager: !!oSessionData.isManager,
                isEmployee: !!oSessionData.isEmployee,
                requiresPersonalDataSetup: !!oSessionData.requiresPersonalDataSetup,
                isAuthenticated: !!oSessionData.token
            });
        },

        completePersonalDataSetup: function () {
            const oModel = this.getModel("session");
            const oData = oModel.getData();
            oData.requiresPersonalDataSetup = false;
            oModel.setData(oData);
            localStorage.setItem("hcmSession", JSON.stringify(oData));
        },

        _enforceHrProfileSetup: function (oEvent) {
            const oSession = this.getModel("session");
            const sRouteName = oEvent.getParameter("name");

            if (oSession.getProperty("/isAuthenticated")
                    && oSession.getProperty("/isHr")
                    && oSession.getProperty("/requiresPersonalDataSetup")
                    && sRouteName !== "RouteHrProfileSetup"
                    && sRouteName !== "RouteLogin") {
                this.getRouter().navTo("RouteHrProfileSetup", {}, true);
            }
        },

        clearSession: function () {
            localStorage.removeItem("hcmSession");

            this.getModel("session").setData({
                token: "",
                username: "",
                role: "",
                employeeId: null,
                isAdmin: false,
                isHr: false,
                isManager: false,
                isEmployee: false,
                requiresPersonalDataSetup: false,
                isAuthenticated: false
            });
        }
    });
});
