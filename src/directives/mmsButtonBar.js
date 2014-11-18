'use strict';

angular.module('mms.directives')
.directive('mmsButtonBar', ['$templateCache', mmsButtonBar]);

function mmsButtonBar($templateCache) {
    var template = $templateCache.get('mms/templates/mmsButtonBar.html');

    var mmsButtonBarLink = function(scope, element, attrs){

    };

    return {
        restrict: 'E', 
        template: template,
        link: mmsButtonBarLink,
        scope: {
            buttons: '=',
            mmsBbApi: '=',
            direction: '@'
        }
    };
}