'use strict';

angular.module('mms', [])
.config(['$sceProvider', function($sceProvider) {
    $sceProvider.enabled(false);
}])
.constant('_', window._);