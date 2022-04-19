import * as angular from "angular";


/**
 * @ngdoc overview
 * @name veCore
 * 
 * @requires mms
 * @requires ui.bootstrap
 * @requires ui.sortable
 * @requires angular-growl
 *
 * @description
 * # veCore module
 * This module provides prebuilt components that are commonly used by the mms
 * client applications, for example, cross referencing and element "spec window".
 * Since this module contains directives with ui elements, there's more dependencies
 * then just using the services module. In the future it will be more pick and 
 * choose instead of everything being in one module.
 *
 * ## Links to dependencies
 * * [ui.bootstrap](http://angular-ui.github.io/bootstrap/)
 * * [ui.sortable](https://github.com/angular-ui/ui-sortable) (this in turn depends on jquery and jqueryui)
 * * [jQuery](http://jquery.com/)
 * * [jQueryUI](http://jqueryui.com/)
 * * [bootstrap](http://getbootstrap.com/) (for styling and css)
 * * [angular-growl](https://github.com/JanStevens/angular-growl-2)
 * * [font awesome](http://fortawesome.github.io/Font-Awesome/)
 *
 * ## Example app that uses this module
 * The following example is an app that uses the directive mmsSpec to display
 * a spec window for an element
 *
 * ### HTML (index.html)
 *  <pre>
    <!doctype html>
    <html ng-app="exampleApp">
        <head>
            <title>Example app</title>
            <link rel="stylesheet" href="bootstrap.css" type="text/css"/>
            <link rel="stylesheet" href="mms.css"/> <!-- mms directives css stylings -->
            <link rel="stylesheet" href="font-awesome.css"/>
            <link rel="stylesheet" href="angular-growl.css"/>
        </head>
        <body>
            <div growl></div> <!-- for notifications -->

            <spec mms-eid="_element_id"></spec>
            <!-- this will display a 'spec window' for the element -->
        
        <!-- dependencies -->
        <script src="jquery.js"></script>
        <script src="jquery-ui.js"></script>
        <script src="lodash.js"></script>
        <script src="angular.js"></script>
        <script src="sortable.js"></script>
        <script src="ui-bootstrap-tpls.js"></script>
        <script src="angular-growl.js"></script>

        <!-- mms -->
        <script src="mms.js"></script>
        <script src="veCore.tpls.js"></script>
        <script src="veCore.js"></script>

        <!-- your app -->
        <script src="app.js"></script>
        </body>
    </html>
    </pre>
 * ### JS (app.js)
 *  <pre>
    angular.module('exampleApp', ['veUtils', 'veCore']);
    </pre>
 */

export const veCore = angular.module('veCore', ['veUtils', 'ui.bootstrap', 'angular-growl', 'angularjs-dropdown-multiselect', 'ui.tree-filter']);

  veCore.config(['$sceProvider', 'growlProvider', 'uiTreeFilterSettingsProvider', function($sceProvider, growlProvider, uiTreeFilterSettingsProvider) {
    $sceProvider.enabled(false);
    growlProvider.onlyUniqueMessages(false);
    growlProvider.globalTimeToLive({success: 5000, error: -1, warning: 5000, info: 5000});
    growlProvider.globalPosition('bottom-right');
    uiTreeFilterSettingsProvider.addresses = ['label'];
    uiTreeFilterSettingsProvider.descendantCollection = 'children';
}])
.filter('veRealNum', function() {
    return function(n) {
        if (Number.isInteger(n)) {
            return n + '.0';
        }
        return n;
    };
})
.constant('CKEDITOR', window.CKEDITOR)
