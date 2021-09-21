(function (window) {



    var b = {};
    b.label                     = {};
    b.label.pi                = 'PROPRIETARY: Proprietary Information';
    b.label.export_ctrl         = 'EXPORT WARNING: No export controlled documents allowed on this server';
    b.label.no_public_release   = 'Not for Public Release or Redistribution';
    b.label.unclassified        = 'CLASSIFICATION: This system is UNCLASSIFIED';

    window.__env = window.__env || {};

    // View Editor Version
    window.__env.version = '3.7.0'
    // API url
    window.__env.apiUrl = 'https://cae-mms-uat-lb.jpl.nasa.gov';
    //window.__env.apiUrl = 'http://localhost:8080';

    // Base url
    window.__env.baseUrl = '';

    // Whether or not to enable debug mode
    // Setting this to false will disable console output
    window.__env.enableDebug = true;

    window.__env.loginBanner = {
        labels: [
            b.label.unclassified,
            b.label.pi + ' - ' + b.label.no_public_release
        ],
        background: '#0D47A1',
        color: '#e8e8e8'
    };

    window.__env.banner = {
        message: b.label.pi
    };

    window.__env.footer = {
        message: "OpenMBEE View Editor | Licensed under Apache 2.0"
    };

}(this));