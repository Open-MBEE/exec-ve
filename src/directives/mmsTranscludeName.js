'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeName', ['ElementService', '$compile', mmsTranscludeName]);

function mmsTranscludeName(ElementService, $compile) {

    var mmsTranscludeNameLink = function(scope, element, attrs, mmsViewCtrl) {
        element.click(function(e) {
            if (mmsViewCtrl === null || mmsViewCtrl === undefined)
                return false;
            mmsViewCtrl.transcludeClicked(scope.eid);
            return false;
        });

        scope.$watch('eid', function(newVal, oldVal) {
            if (newVal === undefined || newVal === null || newVal === '')
                return;
            ElementService.getElement(scope.eid).then(function(data) {
                scope.element = data;
                if (mmsViewCtrl) {
                    mmsViewCtrl.elementTranscluded(scope.element);
                    scope.watch('element.name', function() {
                        mmsViewCtrl.elementTranscluded(scope.element);
                    });
                }
            });
        });
    };

    return {
        restrict: 'E',
        template: '{{element.name}}',
        scope: {
            eid: '@',
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeNameLink
    };
}