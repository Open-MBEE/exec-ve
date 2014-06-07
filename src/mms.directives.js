'use strict';

angular.module('mms.directives', ['mms', 'mms.directives.tpls', 'ui.bootstrap', 'ui.sortable', 'angular-growl'])
.config(['$sceProvider', 'growlProvider', function($sceProvider, growlProvider) {
    $sceProvider.enabled(false);
    growlProvider.onlyUniqueMessages(false);
    growlProvider.globalTimeToLive({success: 2000, error: 5000, warning: 5000, info: 5000});
    growlProvider.globalPosition('bottom-right');
}]);