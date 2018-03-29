'use strict';

angular.module('mms.directives')
.directive('mmsJobs', ['$templateCache', '$http', '$location', '$window', 'growl', '_', '$q',
        'AuthService', 'ElementService', 'ProjectService', 'UtilsService', 'URLService', mmsJobs]);
/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsJobs
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
function mmsJobs($templateCache, $http, $location, $window, growl, _ , $q, 
        AuthService, ElementService, ProjectService, UtilsService, URLService) {

    var template = $templateCache.get('mms/templates/mmsJobs.html');
    //:TODO have cases for each null; "running"; "failed"; "completed"; "aborted";"unstable"; "disabled"; "waiting";
    var mmsJobsLink = function (scope, element, attrs) {
        var ran;
        var serverSentPMA = '';
        var host = $location.host();
        if (host != 'localhost' && host != '0.0.0.0') {
            var segments = host.split('-');
            if (segments.length === 1) {
                URLService.setJobsUrl('https://cae-pma.jpl.nasa.gov');
            } else {
                var env = segments[segments.length-1];
                URLService.setJobsUrl('https://cae-pma-' + env);
            }
            serverSentPMA = host;
        } else {
            //use default pma //TODO need to define env var when running dev
            URLService.setJobsUrl('https://cae-pma-test.jpl.nasa.gov');
            serverSentPMA = 'opencae-test.jpl.nasa.gov';
        }

        scope.jobs = [];
        scope.jobInstances = {};
        scope.editorEnabled = false;
        scope.buttonEnabled = true;
        scope.responseCleared = true; //TODO do we need?
        scope.runCleared = true;
        scope.deleteCleared = true;
        scope.jobInput = {jobName: ''};
        scope.hasRefArr = false;
        scope.docEditable = false;

        // Get ref list for project and details on
        var getRefsInProgress = function() {
            ProjectService.getRefs(scope.mmsProjectId)
            .then(function(data) {
                scope.refList = data.filter(function(ref) {
                    if (ref.status === 'creating')
                        return true;
                });
            });
        };

        var getJobInstances = function (jobId) {// TODO create porxy in gruntfile for PMA
            var link = URLService.getJobInstancesURL(scope.mmsProjectId, scope.mmsRefId, jobId, serverSentPMA);
            scope.responseCleared = false;
            $http.get(link).then(function(data) {
                var instances = data.data.jobInstances;
                scope.jobInstances[jobId] = instances;
                // deferred.resolve(data.data.jobInstances);
            }, function(fail) {
                growl.error('Your job failed to post: ' + fail.data.message);
            }).finally(function() {
                scope.responseCleared = true;
            });
        };

        // get all the jobs for current document
        var getJobs = function () {
            var link = URLService.getJobsURL(scope.mmsProjectId, scope.mmsRefId, serverSentPMA);
            scope.jobs = [];
            scope.loading = true;
            scope.responseCleared = false;
            $http.get(link).then(function (data) {
                var jobs = data.data.jobs; // get jobs json
                for (var i = 0; i < jobs.length; i++) {
                    if (jobs[i].associatedElementID === scope.mmsDocId) {
                        scope.jobs.push(jobs[i]);
                        var jobId = jobs[i].id;
                        getJobInstances(jobId);
                    }
                }
            }, function (error) {
                growl.error('There was a error in retrieving your job: ' + error.status);
            }).finally(function () {
                scope.loading = false;
                scope.responseCleared = true;
            });
        };

        //Callback function for document change
        var changeDocument = function (newVal, oldVal) {
            if (!newVal || (newVal == oldVal && ran))
                return;
            ran = true;
            var lastid = newVal;
            var refOb = null;
            getRefsInProgress();
            ProjectService.getRef(scope.mmsRefId, scope.mmsProjectId).then(function(data) {
                refOb = data;
                scope.mmsRefType = refOb.type;
                var reqOb = {elementId: scope.mmsDocId, projectId: scope.mmsProjectId, refId: scope.mmsRefId};
                ElementService.getElement(reqOb, 2, false)
                .then(function (document) {
                    if (newVal !== lastid) {
                        return;
                    }
                    if (!UtilsService.isDocument(document)) {
                        scope.isDoc = false;
                        return;
                    } else {
                        scope.isDoc = true;
                    }
                    scope.doc = document;
                    scope.docName = document.name;
                    scope.docEditable = document._editable && scope.mmsRefType != 'Tag';
                    getJobs();
                });
            });
        };

        // watch for the document to change
        scope.$watch('mmsDocId', changeDocument);

        var jenkinsRun = function (id) {
            scope.runCleared = false;
            var link = URLService.getRunJobURL(scope.mmsProjectId, scope.mmsRefId, id);
            var post = {
                "mmsServer" : serverSentPMA,
                "alfrescoToken" : AuthService.getTicket()
            };
            var jobId = id;
            $http.post(link, post).then(function(data) {
                growl.success('Your job is running!');
                var jobInst = data.data.jobInstances;
                scope.jobInstances[jobId] = jobInst;
            }, function(fail) {
                growl.error('Your job failed to run: ' + fail.data.message);
            }).finally(function() {
                scope.runCleared = true;
            });
        };

        // logic for running a job immediately
        scope.runNow = function (id) {
            if (!id) {
                scope.runCleared = false;
                scope.createJob().then(function (jobs) {
                    scope.jobs = jobs;
                    for (var i = 0; i < jobs.length; i++) {
                        // scope.jobs.push(jobs[i]);
                        jenkinsRun(jobs[i].id);
                    }
                }).finally(function() {
                    scope.runCleared = true;
                });
            } else {
                jenkinsRun(id);
            }
        };

        // logic for adding a new job
        scope.createJob = function() {
            var deferred = $q.defer();
            var id = scope.mmsDocId;
            var defaultName = scope.jobInput.jobName;
            scope.responseCleared = false;
            if(!scope.jobInput.jobName) {
                defaultName = scope.docName + "_job";
            }
            var thisSchedule = '';
            // Do we allow users to input schedule??
            // console.log(scope.myOutput);
            // if(scope.myOutput !== '* * * * *' && scope.myOutput)
            //     thisSchedule = scope.myOutput;
            var post = {
                "jobName" : defaultName,
                //"command": 'Jenkins,DocWeb,' + id + ',' + project.projectId,
                "command" : "docgen",
                // "arguments" : ["arg1","arg2"],
                "schedule" : thisSchedule,
                "associatedElementID" : id,
                "mmsServer" : serverSentPMA,
                "alfrescoToken" : AuthService.getTicket()
            };

            var link = URLService.getCreateJobURL(scope.mmsProjectId, scope.mmsRefId);
            $http.post(link, post).then(function(data) {
                growl.success('Your job has posted');
                deferred.resolve(data.data.jobs);
            }, function(fail) {
                growl.error('Your job failed to post: ' + fail.data.message);
            }).finally(function() {
                scope.responseCleared = true;
            });
            return deferred.promise;
        };

        scope.deleteJob = function(jobId) {
           var link = URLService.getJobURL(scope.mmsProjectId, scope.mmsRefId, jobId, $location.host());
           scope.deleteCleared = false;
           $http.delete(link).then(function() {
               //TODO remove from jobs list
               var indexOfJob = _.findLastIndex(scope.jobs, {id: jobId});
               scope.jobs.splice(indexOfJob, 1);
               growl.success('Your job has been deleted');
            }, function(fail){
                growl.error('Your job failed to be deleted: ' + fail.status);
            }).finally(function(){
                scope.deleteCleared = true;
            });
        };

        // actions for stomp
        scope.$on("stomp.updateJob", function(event, updateJob) {
            var jobId = updateJob.jobId;
            scope.jobInstances[jobId] = [updateJob];
        });

        scope.$on("stomp.branchCreated", function(event, updateRef, projectId) {
            getRefsInProgress();
        });
    };
    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsDocId:'@'
        },
        link: mmsJobsLink
    };
}
