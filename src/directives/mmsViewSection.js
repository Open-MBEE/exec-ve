'use strict';

angular.module('mms.directives')
.directive('mmsViewSection', ['$compile', mmsViewSection]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsView
 *
 * @requires mms.ViewService
 * @requires mms.ElementService
 *
 * @restrict E
 *
 * @description
 * Given a view id, renders the view according to the json given by mms.ViewService
 * The view have a text edit mode, where transclusions can be clicked, and structure
 * edit mode, where the view "contains" list ordering can be modified. The view's last 
 * modified time and author is the latest of any transcluded element modified time. 
 *
 * @param {string} vid The id of the view
 * @param {expression=} transcludeClicked The expression to handle transcluded elements 
 *     in the view being clicked, this should be a function whose argument is the element id
 */
function mmsViewSection($compile) {
    var template = '<div>' +
                '<h4 class="inline">{{section.title}}</h4>' + 
                '<div ui-sortable="sortableOptions" ng-model="section.contains">' +
                    '<div ng-repeat="contain in section.contains" ng-switch on="contain.type">' + 
                    '<div ng-class="structEditable ? \'panel panel-default\' : \'\'">'+
                    '<div ng-class="structEditable ? \'panel-body\' : \'\'">' +
                        '<mms-view-para para="contain" ng-switch-when="Paragraph"></mms-view-para>' +
                        '<mms-view-table table="contain" ng-switch-when="Table"></mms-view-table>' +
                        '<mms-view-list list="contain" ng-switch-when="List"></mms-view-list>' +
                        '<mms-view-img image="contain" ng-switch-when="Image"></mms-view-img>' +
                        '<mms-view-section section="contain" ng-switch-when="Section"></mms-view-section>' +
                    '</div></div></div>' +
                '</div>' +
            '</div>';

    var mmsViewSectionLink = function(scope, element, attrs) {
        element.append(template);
        $compile(element.contents())(scope); 
    };

    return {
        restrict: 'E',
        scope: {
            section: '=',
        },
        link: mmsViewSectionLink
    };
}