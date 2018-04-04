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
 * Displays a list of branches/tags with details. Provides options for taking action on ref.
 * For the time being it only allows for running a doc merge job on current document.
 *
 * @param {string=master} mmsProjectId Current project
 * @param {string=master} mmsRefId Current branch
 * @param {string=null} mmsDocId the id of the current document
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
        var createJob = function() {
            var deferred = $q.defer();
            var defaultName = "DocMerge_on_" + scope.docName;
            var jobOb = {
                "id": scope.mmsDocId,
                "jobName" : defaultName,
                "jobType" : "docmerge"
            };

            JobService.createJob(jobOb, scope.mmsProjectId, scope.mmsRefId)
            .then(function(job) {
                deferred.resolve(job);
                growl.success('Creating your job');
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
            }, function(error) {
                growl.error('Your job failed to run: ' + error.data.message);
            }).finally(function() {
                scope.runCleared = true;//TODO clear when stomp gets completed message -use jobservice to handle?
            });
        };

        // TODO disable docmerge when one is already running!!!
        scope.createJobandRun = function (refId) {
            // If yes, assign id to run
            scope.jobs = [];
            // Check if the doc already has a job created
            JobService.getJobs(scope.mmsDocId, scope.mmsProjectId, scope.mmsRefId).then(function (jobs) {
                var jobExists = false;
                if (jobs.length) {
                    for (var i = 0; i < jobs.length; i++) {
                        if (jobs[i].associatedElementID === scope.mmsDocId && jobs[i].command === 'docmerge') {
                            // If yes, assign id to run
                            var docmergeJobId = jobs[i].id;
                            runJob(docmergeJobId,refId);
                            jobExists = true;
                            break;
                        }
                    }
                    if (!jobExists) {
                        createJob().then(function(job) {
                            runJob(job.id,refId);
                        });
                    }
                } else { // If not, create
                    createJob().then(function(job) {
                        runJob(job.id,refId);
                    });
                }
            }, function (error) {
                growl.error('There was a error in retrieving your job: ' + error.status);
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

        // Stomp message when merge complete?
        // scope.$on("stomp.branchCreated", function(event, updateRef, projectId) {
        //     // getRefsInProgress();
        // });
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
