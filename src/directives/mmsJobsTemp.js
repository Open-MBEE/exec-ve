'use strict';

angular.module('mms.directives')
.directive('mmsJobsTemp', ['Utils','ElementService', 'WorkspaceService', '$compile', '$templateCache', '$modal', '$http', '$q', '$location', '$anchorScroll', '_', mmsJobsTemp]);
//'$location', '$anchorScroll','Utils','ElementService', 'WorkspaceService', '$compile', '$templateCache', '$modal', '$http', '$q', '_', newMmsJobs
/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsJobs
 *
 * @requires mms.ElementService
 * @requires $compile
 * @requires $templateCache
 * @requires _
 *
 * @restrict E
 *
 * @description
 * Shows you jobs that you have running, going to run and history of jobs.
 * As well as let you edit and add jobs
 *
 * ### template (html)
 * ## Example for showing an element jobs
 *  <pre>
 <mms-jobs></mms-jobs>
 </pre>
 *
 */
function mmsJobsTemp(Utils, ElementService, WorkspaceService, $compile, $templateCache, $modal, $http, $q, $location, $anchorScroll, _) {
    var template = $templateCache.get('mms/templates/mmsJobs.html');

    var mmsJobsLink = function(scope, element, attrs) {
        var job;
        var location_ralf;//N/A should be $location
        var anchor_ralf;// N/A should be $anchorScroll
        var cron_value;
        scope.addJob = {
            name: '',
            command: '',
            schedule: '',
            start: '',
            status: 'waiting',
            owner: scope.vid,
            specialization: {
              type: 'Element'
            }
        };
        
        job = scope.addJob;
        
        //id of the element to assign to anchored scrolling
        scope.gotoAdd = function() {
            $location.hash('addSection');
            $anchorScroll();
        };
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsEid: '@',
            mmsWs: '@'
        },
        link: mmsJobsLink
    };
}
