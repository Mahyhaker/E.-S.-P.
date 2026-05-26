sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.mahyhaker.hcmui.hcmui.controller.App", {
        onGoHome: function () {
            const oSession = this.getOwnerComponent().getModel("session");
            this.getOwnerComponent().getRouter().navTo(
                oSession.getProperty("/requiresPersonalDataSetup") ? "RouteHrProfileSetup" : "RouteDashboard",
                {},
                true
            );
        },

        onLogout: function () {
            this.getOwnerComponent().clearSession();
            this.getOwnerComponent().getRouter().navTo("RouteLogin", {}, true);
        }
    });
});
