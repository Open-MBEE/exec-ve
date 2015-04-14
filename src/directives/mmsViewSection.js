'use strict';

angular.module('mms.directives')
.directive('mmsViewSection', ['$compile', '$templateCache', 'ElementService', mmsViewSection]);

function mmsViewSection($compile, $templateCache, ElementService) {
    var template = $templateCache.get('mms/templates/mmsViewSection.html');

    var mmsViewSectionCtrl = function($scope) {

        $scope.sectionInstanceVals = [];

        if ($scope.section && $scope.section.specialization && 
            $scope.section.specialization.instanceSpecificationSpecification && 
            $scope.section.specialization.instanceSpecificationSpecification.operand) {

            $scope.sectionInstanceVals = $scope.section.specialization.instanceSpecificationSpecification.operand;
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