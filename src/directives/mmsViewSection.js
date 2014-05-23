'use strict';

angular.module('mms.directives')
.directive('mmsViewSection', ['$compile', '$templateCache', mmsViewSection]);

function mmsViewSection($compile, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewSection.html');

    var mmsViewSectionLink = function(scope, element, attrs) {
        element.append(template);
        $compile(element.contents())(scope); 
    };

    return {
        restrict: 'E',
        scope: {
            section: '=mmsSection',
        },
        link: mmsViewSectionLink
    };
}