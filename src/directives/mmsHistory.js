'use strict';

angular.module('mms.directives')
.directive('mmsHistory', ['Utils','ElementService', '$templateCache', '$q', '_', mmsHistory]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsHistory
 *
 * @requires mms.ElementService
 * @requires $compile
 * @requires $templateCache
 * @requires _
 *
 * @restrict E
 *
 * @description
 * Outputs a history window of the element whose id is specified. History includes
 * name of modifier and date of change. Also modified date links to spec output below.
 *
 * ### template (html)
 * ## Example for showing an element history
 *  <pre>
    <mms-history mms-eid="element_id" mms-version="2014-07-01T08:57:36.915-0700"></mms-history>
    </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 */
function mmsHistory(Utils, ElementService, $templateCache, $q, _) {
    var template = $templateCache.get('mms/templates/mmsHistory.html');

    var mmsHistoryLink = function(scope, element, attrs) {
        var ran = false;
        var lastid = null;
        scope.selects = {commitSelected: null};
        scope.historyVer = 'latest';

        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsHistory#changeElement
         * @methodOf mms.directives.directive:mmsHistory
         *
         * @description
         * Change scope history when another element is selected
         */
        var changeElement = function(newVal, oldVal) {
            if (!newVal || (newVal == oldVal && ran))
                return;
            ran = true;
            lastid = newVal;
            scope.gettingHistory = true;
            var reqOb = {elementId: scope.mmsElementId, projectId: scope.mmsProjectId, refId: scope.mmsRefId};
            ElementService.getElementHistory(reqOb, 2)
            .then(function(data) {
                if (newVal !== lastid) 
                    return;
                scope.history = data;
                scope.historyVer = 'latest';
                scope.selects.commitSelected = null;
            }).finally(function() {
                scope.gettingHistory = false;
            });
        };
        scope.commitClicked = function() {
            var commit = scope.selects.commitSelected;
            if (!commit) {
                scope.historyVer = 'latest';
                return;
            }
            scope.historyVer = commit;
        };
        scope.changeElement = changeElement;
        scope.$watch('mmsElementId', changeElement);
        scope.$watch('mmsRefId', changeElement);
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsElementId: '@',
            mmsProjectId: '@',
            mmsRefId: '@'
        },
        link: mmsHistoryLink
    };
}
