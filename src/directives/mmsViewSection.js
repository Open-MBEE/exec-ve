'use strict';

angular.module('mms.directives')
.directive('mmsViewSection', ['$compile', '$templateCache', mmsViewSection]);

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
function mmsViewSection($compile, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsViewSection.html');

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