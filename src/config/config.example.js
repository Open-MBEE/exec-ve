(function () {
    //Examples of commonly used banner statements
    var label = {
        pi: 'PROPRIETARY: Proprietary Information',
        export_ctrl: 'EXPORT WARNING: No export controlled documents allowed on this server',
        no_public_release: 'Not for Public Release or Redistribution',
        unclassified: 'CLASSIFICATION: This system is UNCLASSIFIED'
    };

    //Do not modify, this is necessary to initialize the config
    window.__env = window.__env || {};

    //Do not modify the structure of this
    window.__env = {
        // View Editor Version
        version: '3.7.0',
        // API url
        apiUrl: 'http://localhost:8080',
        // Base url
        baseUrl: '',
        enableDebug: true,
        // Configuration for the banner below the login modal (only visible at login)
        loginBanner: {
            labels: [
                label.unclassified,
                label.pi + ' - ' + label.no_public_release
            ],
            background: '#0D47A1',
            color: '#e8e8e8'
        },
        // Configure the banner that is placed above all content (always visible)
        banner: {
            message: label.pi
        },
        footer: {
            message: "OpenMBEE View Editor | Licensed under Apache 2.0"
        }
    }

}());