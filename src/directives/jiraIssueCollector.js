'use strict';

angular.module('mms.directives')
.directive('jiraIssueCollector', ['$templateCache', '$compile', jiraIssueCollector]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeName
 *
 * @requires mms.ElementService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's name binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and name change,
 * and on click
 *
 * @param {string} mmsEid The id of the element whose name to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function jiraIssueCollector($templateCache, $compile) {
    var jiraIssueCollectorLink = function(scope, element, attrs) {
        //element.append($templateCache.get('mms/templates/jiraIssueCollector.html'));
        //$compile(element.contents())(scope); 
        window.ATL_JQ_PAGE_PROPS = $.extend(window.ATL_JQ_PAGE_PROPS, {
                    'ae470811' : {
                        triggerFunction : function( showCollectorDialog ) {
                            $('.ae470811').click( function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                showCollectorDialog();
                            });
                        }
                    }
                });
        jQuery.ajax({
            url: "https://ehm.jpl.nasa.gov/jira/s/d41d8cd98f00b204e9800998ecf8427e/en_US-1rh5yq-1988229788/6163/44/1.4.3/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector.js?collectorId=ae470811",
            type: "get",
            cache: false,
            dataType: "script"
        });
    };

    return {
        restrict: 'E',
        template: '<button class="ae470811">bam</button>',
        link: jiraIssueCollectorLink
    };
}