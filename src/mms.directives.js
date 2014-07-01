'use strict';

/**
 * @ngdoc overview
 * @name mms.directives
 *
 * @requires mms
 * @requires ui.bootstrap
 * @requires ui.sortable
 * @requires angular-growl
 *
 * @description
 * module
 */
angular.module('mms.directives', ['mms', 'mms.directives.tpls', 'ui.bootstrap', 'ui.sortable', 'angular-growl'])
.config(['$sceProvider', 'growlProvider', function($sceProvider, growlProvider) {
    $sceProvider.enabled(false);
    growlProvider.onlyUniqueMessages(false);
    growlProvider.globalTimeToLive({success: 5000, error: -1, warning: 5000, info: 5000});
    growlProvider.globalPosition('bottom-right');
}]);