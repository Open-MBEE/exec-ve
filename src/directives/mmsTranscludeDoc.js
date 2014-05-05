'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeDoc', ['ElementService', '$compile', mmsTranscludeDoc]);

function mmsTranscludeDoc(ElementService, $compile) {

    var mmsTranscludeDocLink = function(scope, element, attrs, mmsViewCtrl) {
        element.click(function(e) {
            if (mmsViewCtrl === null || mmsViewCtrl === undefined)
                return false;
            mmsViewCtrl.transcludeClicked(scope.eid);
            //e.stopPropagation();
            return false;
        });

        scope.$watch('eid', function(newVal, oldVal) {
            if (newVal === undefined || newVal === null || newVal === '')
                return;
            ElementService.getElement(scope.eid).then(function(data) {
                scope.element = data;
                var doc = scope.element.documentation;
                element.append(doc);
                $compile(element.contents())(scope);
                //var el = $compile(doc)(scope);
                //element.append(el);
                scope.$watch('element.documentation', function(n, o) {
                    element.empty();
                    doc = scope.element.documentation;
                    element.append(doc);
                    $compile(element.contents())(scope); 
                    //var el = $compile(doc)(scope); 
                    //element.append(el); 
                    //above prevents nested transclusions from getting view controller
                });
            });
        });
    };

    return {
        restrict: 'E',
        scope: {
            eid: '@',
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeDocLink
    };
}