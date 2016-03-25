'use strict';

angular.module('mms.directives')
.directive('mmsJobs', ['$templateCache','$http', '$location', '$anchorScroll', mmsJobs]);
//'$location', '$anchorScroll','Utils','ElementService', 'WorkspaceService', '$compile', '$templateCache', '$modal', '$http', '$q', '_', newMmsJobs
/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsJobs
 *
 * @requires $templateCache
 * @requires $http
 * @requires $location
 * @requires $anchorScroll
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
 *   <mms-jobs></mms-jobs>
 * </pre>
 *
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=?:TODO?} mmsDocId 
 */
function mmsJobs($templateCache, $http, $location, $anchorScroll) {
    var template = $templateCache.get('mms/templates/mmsJobs.html');

    var mmsJobsLink = function(scope, element, attrs) {
        var cron_value;
        scope.jobInput = { jobName:' '};
        //:TODO Add something for loading...        
        //id of the element to assign to anchored scrolling
        scope.gotoAdd = function() {
            $location.hash('addSection');
            $anchorScroll();
        };
        
        // logic for adding a new job -- triggers on button
        scope.addJob = function() {
            var id = scope.docId;
            var post = {
                jobs: [{
                    name: scope.jobInput.jobName,
                    schedule: cron_value,
                    status: 'waiting',
                    url: 'sample_initial_url',
                    owner: id,
                    isMetatype: false,
                    documentation: '',
                    specialization: {
                      type: 'Element'
                    }
                }]
            };
            //Did not pass through start time for some reason
            var link = '/alfresco/service/workspaces/master/jobs';
            $http.post(link, post).then(function(){
                    console.log("POSTED");
                    scope.$setPristine(true);
            }, function(error){
                console.log("FAILED TO POST" + error.status);
            });
        };
        // This is updating the job every 5 seconds, needs to be replaced with stomp logic
        // window.setInterval(function() {
        //     var id = scope.DocId; // view id or document id 
        //     // in the tool controller set the docuement id and pass it in 
        //     var link = '/alfresco/service/workspaces/master/jobs/'+ id + '?recurse=1';
        //     var finished;
        //     $http.get(link).then(function(data){
        //         finished = success(data);
        //         console.log("get request is successful");
        //     }, function(error){
        //         finished = error;
        //         console.log("get request has FAILED");
        //     });
        // },5000); 
        //actions for stomp 
        scope.$on("stomp.job", function(event, jobs){

        });
        // gets vid info from the url that runs every five seconds
        function success(data) {
            var jobs = data.data.jobs; // get jobs json
            var jobs_size = data.data.jobs.length; // get length of jobs array
            
            var newJobs = [];
            for (var i = 0; i < jobs_size; i++) {
                newJobs.push({
                    name: jobs[i].name,
                    status: jobs[i].status,
                    schedule: jobs[i].schedule,
                    url: jobs[i].url,
                    command: jobs[i].command
                });
            }
            scope.jobs = newJobs;
        }
        // :TODO This jquery library needs to be replaced with https://github.com/jacobscarter/angular-cron-jobs
        $('#cronOptions').cron({
            initial: "0 0 * * *",
            onChange: function() {
                cron_value = $(this).cron("value");
            },
        });       
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsWs: '@',
            mmsDocId:'@'
        },
        link: mmsJobsLink
    };
}
