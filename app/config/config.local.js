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

    //grab on load token
    //parse datae
    // call endpoints
    //fill database
    //pass token for all requests

    //Do not modify the structure of this
    //ip address of the backend <openshift_ip>    
    window.__env = {
        // View Editor Version
        version: '4.0.2',
        // API url
        // apiUrl: 'http://openmbee-mms.openmbee.svc.cluster.local:5000',
        // apiUrl: 'https://openmbee-mms.apps.arena-workspace.navair.navy.mil',
        apiUrl: 'https://localhost:8080',
        //KONG API GATEWAY URL, you will need to follow NAVAIR CI/CD Arena Documentation to understand, refer to OpenMBEE_Debrief for documentation link
        // apiUrl: 'https://kong-proxy-api.apps.arena-workspace.navair.navy.mil/openmbee-mms/mmsapi/',
        //DNS ENTRY for backend
        // apiUrl: 'https://mbee-mms.navair.navy.mil',
        // Base url
        baseUrl: '',
        // printUrl: 'https://openmbee-mms.apps.arena-workspace.navair.navy.mil/convert',
        // printUr: 'http://openmbee-mms.openmbee.svc.cluster.local:5000',
        printUrl: 'https://localhost:8080/convert',
        // printUrl: 'https://mbee-mms.navair.navy.mil/convert',
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