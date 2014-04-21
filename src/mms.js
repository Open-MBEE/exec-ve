'use strict';

angular.module('mms', ['ui.bootstrap', 'ui.sortable'])
.config(['$sceProvider', function($sceProvider) {
    $sceProvider.enabled(false);
}])
.constant('_', window._);