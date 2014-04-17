'use strict';

angular.module('mms')
.directive('mmsTranscludeName', ['ElementService', '$compile', '$modal', mmsTranscludeName]);

function mmsTranscludeName(ElementService, $compile, $modal) {

    var mmsTranscludeNameLink = function(scope, element, attrs, mmsViewCtrl) {
        var modalTemplate = '<div class="modal-header"><h3>Element</h3></div>' +
                    '<div class="modal-body"><mms-spec eid="{{eid}}" editable-field="name"></mms-spec></div>' +
                    '<div class="modal-footer"><button class="btn btn-primary" ng-click="close()">Close</button></div>';
        
        element.click(function(e) {
            if (mmsViewCtrl === null || mmsViewCtrl === undefined || !mmsViewCtrl.isEditable())
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