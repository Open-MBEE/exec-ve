(function (window) {

    var b = {
        label : {
            pi : 'PROPRIETARY: Proprietary Information',
            export_ctrl : 'EXPORT WARNING: No export controlled documents allowed on this server',
            no_public_release : 'Not for Public  Release or Redistribution',
            unclassified : 'CLASSIFICATION: This system is UNCLASSIFIED',
        },
        applied_labels : [],
        veNav_address : ''
    };

    window.__env = window.__env || {};

    // API url
    window.__env.apiUrl = 'https://cae-mms-uat-lb.jpl.nasa.gov';

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