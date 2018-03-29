'use strict';

angular.module('mms.directives')
.directive('mmsRefList', ['$templateCache', '$http', 'growl', '_', '$q',
        'UtilsService', 'JobService', 'ElementService', mmsRefList]);
/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsRefList
 *
 * @requires $templateCache
 * @requires $http
 * @requires $location
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
 *   <mms-jobs></mms-jobs>
 * </pre>
 *
 * @param {string=master} mmsBranch Branch to use, defaults to master
 * @param {string=null} mmsDocId the id of the current document under which the job is being run
 */
function mmsRefList($templateCache, $http, growl, _ , $q, 
    UtilsService, JobService, ElementService) {

    var template = $templateCache.get('mms/templates/mmsRefList.html');
    //:TODO have cases for each null; "running"; "failed"; "completed"; "aborted";"unstable"; "disabled"; "waiting";
    var mmsRefListLink = function (scope, element, attrs) {
        var ran;
        scope.responseCleared = true; //TODO do we need?
        scope.runCleared = true;
        scope.docEditable = false;


        // logic for adding a new job
        scope.createJob = function() {
            var deferred = $q.defer();
            var defaultName = "DocMerge_on_" + scope.docName;
            var post = {
                "id": scope.mmsDocId,
                "jobName" : defaultName,
                "jobType" : "docmerge"
            };

            JobService.createJob(post, scope.mmsProjectId, scope.mmsRefId)
            .then(function(job) {
                // growl.success('Your job has posted');
                deferred.resolve(job);
            }, function(error) {
                growl.error('Your job failed to post: ' + error.data.message);
            });
            return deferred.promise;
        };

        var runJob = function (id, fromRef) {
            scope.runCleared = false;
            var postOb = {
                "fromRefId" : fromRef
            };
            var jobRunOb = {
                "id": id,
                "post": postOb
            };
            JobService.runJob(jobRunOb, scope.mmsProjectId, scope.mmsRefId)
            .then(function(data) {
                growl.success('Your job is running!');
                // var jobInst = data.data.jobInstances;
            }, function(error) {
                growl.error('Your job failed to run: ' + error.data.message);
            }).finally(function() {
                scope.runCleared = true;
            });
        };

        // TODO disable docmerge when one is already running!!!
        // Check if the doc already has a job created
        scope.createJobandRun = function (refId) {
            // If yes, assign id to run
            scope.jobs = [];
            scope.loading = true;
            JobService.getJobs(scope.mmsDocId, scope.mmsProjectId, scope.mmsRefId).then(function (jobs) {
                scope.jobs = [];
                if (jobs.length) {
                    for (var i = 0; i < jobs.length; i++) {
                        if (jobs[i].associatedElementID === scope.mmsDocId && jobs[i].command === 'docmerge') {
                            // If yes, assign id to run
                            var docmergeJobId = jobs[i].id;
                            runJob(docmergeJobId,refId);
                            break;
                        }
                    }
                } else { // If not, create
                    scope.createJob().then(function(job) {
                        runJob(job.id,refId);
                    });
                }
            }, function (error) {
                growl.error('There was a error in retrieving your job: ' + error.status);
            }).finally(function () {
                scope.loading = false;
            });
        };

        //Callback function for document change
        var changeDocument = function (newVal, oldVal) {
            if (!newVal || (newVal == oldVal && ran))
                return;
            ran = true;
            var lastid = newVal;
            var reqOb = {elementId: scope.mmsDocId, projectId: scope.mmsProjectId, refId: scope.mmsRefId};
            ElementService.getElement(reqOb, 2, false)
            .then(function (document) {
                if (!UtilsService.isDocument(document)) {
                    scope.isDoc = false;
                    return;
                } else {
                    scope.isDoc = true;
                }
                scope.doc = document;
                scope.docName = document.name;
                scope.docEditable = document._editable && scope.mmsRefType != 'Tag';
            });
        };

        // watch for the document to change
        scope.$watch('mmsDocId', changeDocument);



        // actions for stomp
        scope.$on("stomp.updateJob", function(event, updateJob) {
            var jobId = updateJob.jobId;
            scope.jobInstances[jobId] = [updateJob];
        });

        scope.$on("stomp.branchCreated", function(event, updateRef, projectId) {
            // getRefsInProgress();
        });
    };
    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsDocId:'@',
            mmsBranches: '<',
            mmsTags: '<'
        },
        link: mmsRefListLink
    };
}
