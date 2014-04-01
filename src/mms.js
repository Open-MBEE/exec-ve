'use strict';

angular.module('mms', ['ui.bootstrap'])
.config(['$sceProvider', function($sceProvider) {
    $sceProvider.enabled(false);
}])
.constant('_', window._);