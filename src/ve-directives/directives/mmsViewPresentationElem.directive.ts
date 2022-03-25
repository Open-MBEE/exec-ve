import * as angular from "angular";
var veDirectives = angular.module('veDirectives');

veDirectives.directive('mmsViewPresentationElem', ['ViewService', 'ElementService', '$templateCache', '$timeout', '$location',
    '$anchorScroll', '$compile', mmsViewPresentationElem]);

/**
 * @ngdoc component
 * @name veDirectives.component:mmsViewPresentationElem
 *
 * @requires mms.ViewService
 * @requires mms.ElementService
 * @requires $templateCache
 * @requires $location
 * @requires $timeout
 * @requires $rootScope
 * @requires $anchorScroll
 * @requires growl
 *
 *
 * @restrict E
 *
 * @description
 * Given a InstanceVal, parses the element reference tree to get the corresponding
 * presentation element, and renders it in the view
 * 
 * @param {Object} mmsInstanceVal A InstanceValue json object 
 * @param {Object} mmsParentSection the parent section if available
 */
let ViewPresentationElemComponent: angular.ve.ComponentOptions = {
    selector: 'viewPresentationElem',
    template: `
    <div ng-if="$ctrl.presentationElemLoading" class="fa fa-spinner fa-spin"></div>
<div id="{{$ctrl.instanceSpec.id}}" ng-if="!$ctrl.presentationElemLoading" ng-switch on="$ctrl.presentationElem.type">
    <mms-view-para class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="Paragraph"></mms-view-para>
    <mms-view-table data-mms-table="$ctrl.presentationElem" mms-pe="$ctrl.instanceSpec" ng-switch-when="Table"></mms-view-table>
    <mms-view-table-t class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="TableT"></mms-view-table-t>
    <mms-view-list class="read-width" data-mms-list="$ctrl.presentationElem" ng-switch-when="List"></mms-view-list>
    <mms-view-list-t class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="ListT"></mms-view-list-t>
    <mms-view-img data-mms-image="$ctrl.presentationElem" mms-pe="$ctrl.instanceSpec" ng-switch-when="Image"></mms-view-img>
    <mms-view-section data-mms-section="$ctrl.presentationElem" ng-switch-when="InstanceSpecification"></mms-view-section>
    <mms-view-equation class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="Equation"></mms-view-equation>
    <mms-view-figure class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="Figure"></mms-view-figure>
    <mms-view-figure class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="ImageT"></mms-view-figure>
    <mms-transclude-com class="read-width" mms-element-id="{{$ctrl.presentationElem.source}}" mms-project-id="{{$ctrl.instanceSpec._projectId}}" mms-ref-id="{{$ctrl.instanceSpec._refId}}" ng-switch-when="Comment"></mms-transclude-com>
    <mms-view-plot data-mms-plot="$ctrl.presentationElem" ng-switch-when="Plot"></mms-view-plot>
    <mms-ts-diagram mms-pe-id="{{$ctrl.instanceSpec.id}}" mms-project-id="{{$ctrl.instanceSpec._projectId}}" mms-ref-id="{{$ctrl.instanceSpec._refId}}" mms-tsp-spec="$ctrl.presentationElem" ng-switch-when="TomSawyerDiagram"></mms-ts-diagram>
</div>    
`
}
function mmsViewPresentationElem(ViewService, ElementService, $templateCache, $timeout, $location, $anchorScroll, $compile) {
    var template = 'partials/mms-directives/mmsViewPresentationElem.html';

    var mmsViewPresentationElemCtrl = function($scope) {
        
        $scope.presentationElemLoading = true;
        this.getInstanceSpec = function() {
            return $scope.instanceSpec;
        };

        this.getInstanceVal = function() {
            return $scope.mmsInstanceVal;
        };

        this.getPresentationElement = function() {
            return $scope.presentationElem;
        };

        this.getParentSection = function() {
            return $scope.mmsParentSection;
        };
    };

    var mmsViewPresentationElemLink = function(scope, element: angular.IRootElementService, attrs, mmsViewCtrl) {
        if (scope.mmsInstanceVal) {
            if (!scope.mmsInstanceVal.instanceId) {
                element.html('<span class="mms-error">Reference is null</span>');
                return;
            }
            var projectId = null;
            var refId = null;
            var commitId = null;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getElementOrigin();
                projectId = viewVersion.projectId;
                refId = viewVersion.refId;
                commitId = viewVersion.commitId;
            }
            // Parse the element reference tree for the presentation element:
            element.addClass("isLoading");
            var reqOb = {elementId: scope.mmsInstanceVal.instanceId, projectId: projectId, refId: refId, commitId: commitId, includeRecentVersionElement: true};
            ElementService.getElement(reqOb, 1)
            .then(function(instanceSpec) {
                scope.presentationElem = ViewService.getPresentationElementSpec(instanceSpec);
                scope.instanceSpec = instanceSpec;
                scope.presentationElemLoading = false;
                var hash = $location.hash();
                if (hash === instanceSpec.id) {
                    $timeout(function() {
                        $anchorScroll();
                    }, 1000, false);
                }
                if (mmsViewCtrl) {
                    mmsViewCtrl.elementTranscluded(instanceSpec);
                }
                element.on('click', (function(e) {
                    if (mmsViewCtrl)
                        mmsViewCtrl.transcludeClicked(instanceSpec);
                    e.stopPropagation();
                }));
            }, function(reason) {
                if (reason.status === 500) {
                    element.html('<span class="mms-error">View element reference error: ' + scope.mmsInstanceVal.instanceId + ' invalid specification</span>');
                } else {
                    element.html('<annotation mms-req-ob="::reqOb" mms-recent-element="::recentElement" mms-type="::type"></annotation>');
                    $compile(element.contents())(Object.assign(scope.$new(), {
                        reqOb: reqOb,
                        recentElement: reason.data.recentVersionOfElement,
                        type: ViewService.AnnotationType.mmsPresentationElement
                    }));
                }
            }).finally(function() {
                element.removeClass("isLoading");
            }); 
        } 
    };

    return {
        restrict: 'E',
        templateUrl: template,
        require: '?^^view',
        scope: {
            mmsInstanceVal: '<',
            mmsParentSection: '<',
        },
        controller: ['$scope', mmsViewPresentationElemCtrl],
        link: mmsViewPresentationElemLink
    };
}