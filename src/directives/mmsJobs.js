'use strict';

angular.module('mms.directives')
.directive('mmsJobs', ['$templateCache', '$http', '$location', '$window', 'growl', '_', '$q',
        'AuthService', 'ElementService', 'UtilsService', 'URLService', mmsJobs]);
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
        AuthService, ElementService, UtilsService, URLService) {

    var template = $templateCache.get('mms/templates/mmsJobs.html');
    //:TODO have cases for each null; "running"; "failed"; "completed"; "aborted";"unstable"; "disabled"; "waiting";
    var mmsJobsLink = function (scope, element, attrs) {
        var ran;
        scope.jobs = [];
        scope.jobInstances = {};
        scope.editorEnabled = false;
        scope.buttonEnabled = true;
        scope.responseCleared = true; //TODO do we need?
        scope.runCleared = true;
        scope.deleteCleared = true;
        scope.jobInput = {jobName: ''};
        scope.hasRefArr = false;

        var refArrString = $window.localStorage.getItem('refArr');
        var refArr = JSON.parse(refArrString);
        if (refArr) {
            scope.hasRefArr = true;
            scope.createdRefs = refArr;
        }

        var getJobInstances = function (jobId) {
            // var deferred = $q.defer();
            // var link = URLService.getJobInstancesURL(projectId, refId, $location.host()); // TODO create porxy in gruntfile for PMA
            var link = URLService.getJobInstancesURL(scope.mmsProjectId, scope.mmsRefId, jobId, 'opencae-int.jpl.nasa.gov');
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
            // return deferred.promise;
        };

        // get all the jobs for current document
        var getJobs = function () {
            // var link = URLService.getJobsURL(projectId, refId, $location.host()); // TODO create porxy in gruntfile for PMA
            var link = URLService.getJobsURL(scope.mmsProjectId, scope.mmsRefId, 'opencae-int.jpl.nasa.gov');
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
                        // .then(function (instances) {
                            // for (var i = 0; i < instances.length; i++) {
                                // scope.jobInstances[jobId] = instances;
                            // }
                //             for (var i = 0; i < jobInst.length; i++) {
                //     var instance = jobInst[i];
                //     scope.jobInstances[jobId] = instance;
                // }
                        // });
                    }
                }
            }, function (error) {
                // display some error?
                growl.error('There was a error in retrieving your job: ' + error.status);
            }).finally(function () {
                scope.loading = false;
                scope.responseCleared = true;
                //TODO might need digest to get jobs
            });
        };

        //Callback function for document change
        var changeDocument = function (newVal, oldVal) { // check if the right pane is reloaded everytime
            if (!newVal || (newVal == oldVal && ran))
                return;
            ran = true;
            var lastid = newVal;
            var reqOb = {elementId: scope.mmsDocId, projectId: scope.mmsProjectId, refId: scope.mmsRefId};
            ElementService.getElement(reqOb, 2, false)
            .then(function (document) {
                if (newVal !== lastid)
                    return;
                if (!UtilsService.isDocument(document))
                    return;
                scope.doc = document;
                scope.docName = document.name;
                scope.docEditable = document._editable && scope.mmsRefId === 'master';
                getJobs();
            });
        };

        // watch for the document to change
        scope.$watch('mmsDocId', changeDocument);

        var jenkinsRun = function (id) {
            scope.runCleared = false;
            var link = URLService.getRunJobURL(scope.mmsProjectId, scope.mmsRefId, id);
            var post = {
                "mmsServer" : "opencae-int.jpl.nasa.gov", //TODO add
                "alfrescoToken" : AuthService.getTicket()
            };
            var jobId = id;
            $http.post(link, post).then(function(data) {
                //TODO get instance and status
                growl.success('Your job is running!');
                var jobInst = data.data.jobInstances;
                for (var i = 0; i < jobInst.length; i++) {
                    var instance = jobInst[i];
                    scope.jobInstances[jobId] = instance;
                }
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
            //console.log(scope.myOutput);
            // if(scope.myOutput !== '* * * * *' && scope.myOutput)
            //     thisSchedule = scope.myOutput;
            var post = {
                "jobName" : defaultName,
                //"command": 'Jenkins,DocWeb,' + id + ',' + project.projectId,
                "command" : "docweb",
                // "arguments" : ["arg1","arg2"],
                "schedule" : thisSchedule,
                "associatedElementID" : id,
                "mmsServer" : "opencae-int.jpl.nasa.gov", //TODO add
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

        //var updateJob = function() {
        //    var id = scope.mmsDocId;
        //    var updatePost = {
        //        jobs: [{
        //            id: scope.job.id,
        //            name: scope.jobInput.jobName+'_job'
        //        }]
        //    };
        //    var link = URLService.getCreateJob();
        //    $http.post(link, updatePost).then(function() {
        //        growl.success('Your job has been updated');
        //        }, function(fail) {
        //            growl.error('Your job failed to update: ' + fail.status);
        //        });
        //};
        
        scope.deleteJob = function(jobId) {
           var link = URLService.getJobURL(scope.mmsProjectId, scope.mmsRefId, jobId, 'opencae-int.jpl.nasa.gov');
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

        //scope.enableEditor = function() {
        //    if (!scope.docEditable)
        //        return;
        //    scope.editorEnabled = true;
        //    scope.jobInput.jobName = scope.job.name.replace('_job','');
        //};
        //scope.disableEditor = function() {
        //    scope.editorEnabled = false;
        //};
        //scope.save = function() {
        //    scope.job.name = scope.jobInput.jobName+'_job';
        //    updateJob();
        //    scope.disableEditor();
        //};

        //actions for stomp
        scope.$on("stomp.job", function (event, newJobId) {
            // var link = URLService.getJobURL(projectId, refId, newJobId, $location.host()); // TODO create porxy in gruntfile for PMA
            // var link = URLService.getJobURL(scope.mmsProjectId, scope.mmsRefId, newJobId, 'opencae-int.jpl.nasa.gov');
            // $http.get(link).then( function (data) {
            //     var jobs = data.data.jobs; // get jobs json
            //     var job = {};
            //     for (var i = 0; i < jobs.length; i++) {
            //         if (jobs[i].associatedElementID === scope.mmsDocId) {
            //             // check if job already is in scope and update status
            //             job = {
            //                 name: jobs[i].name,
            //                 status: jobs[i].status,
            //                 schedule: jobs[i].schedule,
            //                 url: jobs[i].url,
            //                 command: jobs[i].command,
            //                 //create: jobs[i].created,
            //                 id: jobs[i].id
            //             };
            //             scope.jobs.push(job);
            //         }
            //     }
            // }, function (error) {
            //     // display some error?
            //     //growl.error('There was a error in retrieving your job: ' + error.status);
            // });
            // getJobs();
            // scope.$apply();
        });


        //scope.$on("stomp.updateJob", function(event, updateJob){
        //    for (var i = 0; i < updateJob.length; i++) {
        //        if(updateJob[i].ownerId === scope.mmsDocId){
        //            if(updateJob[i].status === 'completed' || updateJob[i].status === 'failed'){
        //                    scope.buttonEnabled = true;
        //            }else{
        //                scope.buttonEnabled = false;
        //            }
        //            scope.job.name = updateJob[i].name;
        //            scope.job.status = updateJob[i].status;
        //            scope.job.url = updateJob[i].url;
        //            scope.$apply();
        //        }
        //    }
        //});
        //scope.$on("stomp.deleteJob", function(event, deleteJob){
        //    for (var i = 0; i < deleteJob.length; i++) {
        //        if(deleteJob[i].ownerId === scope.mmsDocId){
        //            scope.buttonEnabled = false;
        //            scope.hasJobs = false;
        //            scope.job = ' ';
        //            scope.$apply();
        //        }
        //    }
        //});
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
