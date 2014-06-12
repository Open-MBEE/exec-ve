'use strict';

angular.module('mms.directives')
.directive('mmsViewSection', ['$compile', '$templateCache', mmsViewSection]);

function mmsViewSection($compile, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewSection.html');

    var mmsViewSectionLink = function(scope, element, attrs, mmsViewCtrl) {
        element.append(template);
        $compile(element.contents())(scope); 
        scope.structEditable = function() {
            if (mmsViewCtrl) {
                return mmsViewCtrl.getStructEditable();
            } else
                return false;
        };
    };

    return {
        restrict: 'E',
        scope: {
            section: '=mmsSection',
        },
        require: '?^mmsView',
        link: mmsViewSectionLink
    };
}