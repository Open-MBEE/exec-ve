'use strict';

angular.module('mms.directives', ['mms', 'ui.bootstrap', 'ui.sortable'])
.config(['$sceProvider', function($sceProvider) {
    $sceProvider.enabled(false);
}]);