'use strict';

angular.module('mms.directives')
.directive('jiraIssueCollector', ['$templateCache', '$compile', jiraIssueCollector]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:jiraIssueCollector
 *
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given a collector id and text, puts in a button with text that brings up jira issue collector
 * (on ehm jira)
 *
 * @param {string} collectorId The id of the jira issue collector
 * @param {string} text button text
 */
function jiraIssueCollector($templateCache, $compile) {
    var jiraIssueCollectorLink = function(scope, element, attrs) {
        //element.append($templateCache.get('mms/templates/jiraIssueCollector.html'));
        //$compile(element.contents())(scope); 
        var id = scope.collectorId;
        var extendOb = {};
        extendOb[id] = {
            triggerFunction : function( showCollectorDialog ) {
                $('.' + id).click( function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showCollectorDialog();
                });
            }
        };
        window.ATL_JQ_PAGE_PROPS = $.extend(window.ATL_JQ_PAGE_PROPS, extendOb);
        jQuery.ajax({
            url: 'https://ehm.jpl.nasa.gov/jira/s/d41d8cd98f00b204e9800998ecf8427e/en_US-1rh5yq-1988229788/6163/44/1.4.3/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector.js?collectorId=' + id,
            type: "get",
            cache: false,
            dataType: "script"
        });
    };

    return {
        restrict: 'E',
        transclude: true,
        scope: {
            collectorId: '@',
            text: '@'
        },
        template: '<div style="display:inline" class="{{collectorId}}"><ng-transclude></ng-transclude></div>',
        link: jiraIssueCollectorLink
    };
}