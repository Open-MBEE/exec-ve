'use strict';

angular.module('mms.directives')
.directive('mmsViewSectionStruct', ['$compile', '$templateCache', mmsViewSectionStruct]);

function mmsViewSectionStruct($compile, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewSectionStruct.html');

    var mmsViewSectionStructLink = function(scope, element, attrs, mmsViewStructCtrl) {
        element.append(template);
        $compile(element.contents())(scope); 
        scope.editing = function() {
            if (mmsViewStructCtrl) {
                return mmsViewStructCtrl.getEditing();
            } else
                return false;
        };
    };

    return {
        restrict: 'E',
        scope: {
            section: '=mmsSection',
        },
        require: '?^mmsViewStruct',
        link: mmsViewSectionStructLink
    };
}