'use strict';

angular.module('mms.directives')
.directive('mmsViewSection', ['$compile', '$templateCache', 'ElementService', mmsViewSection]);

function mmsViewSection($compile, $templateCache, ElementService) {
    var template = $templateCache.get('mms/templates/mmsViewSection.html');

    var mmsViewSectionCtrl = function($scope) {

        $scope.sectionInstanceVals = [];

        // TODO this will not be needed once server side has embedded objects
        if ($scope.section && $scope.section.specialization.instanceSpecificationSpecification) {
            var instanceSpecSpecId = $scope.section.specialization.instanceSpecificationSpecification;
            ElementService.getElement(instanceSpecSpecId, false, $scope.workspace).
            then(function(element) {
                $scope.sectionInstanceVals = element.specialization.operand;
            });
        }
    };

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
        controller: ['$scope', mmsViewSectionCtrl],
        link: mmsViewSectionLink
    };
}