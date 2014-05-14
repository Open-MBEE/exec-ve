'use strict';

angular.module('mms.directives', ['mms', 'mms.directives.tpls', 'ui.bootstrap', 'ui.sortable'])
.config(['$sceProvider', function($sceProvider) {
    $sceProvider.enabled(false);
}]);