'use strict';

angular.module('mms', [])
.config(function($sceProvider) {
    $sceProvider.enabled(false);
})
.constant('_', window._);