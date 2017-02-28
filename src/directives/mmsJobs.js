'use strict';

angular.module('mms.directives')
.directive('mmsJobs', ['$templateCache','$http', '$location', 'ElementService','UtilsService','growl','_','$q','URLService', mmsJobs]);
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
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=null} mmsDocId the id of the current document under which the job is being run
 */
function mmsJobs($templateCache, $http, $location, ElementService, UtilsService, growl, _ , $q, URLService) {
    var template = $templateCache.get('mms/templates/mmsJobs.html');
    //:TODO have cases for each null; "running"; "failed"; "completed"; "aborted";"unstable"; "disabled"; "waiting";
    var mmsJobsLink = function(scope, element, attrs) {
        var documentName;
        var project;
        var ran = false;
        var lastid = null;
        scope.editorEnabled = false;
        scope.buttonEnabled = true;
        scope.responseCleared = true;
        scope.runCleared = true;
        scope.deleteCleared = true;
        scope.jobInput = { jobName:''};

        // get all the jobs for current document
        var getJobs = function(){
            var id = scope.mmsDocId;
            var link = URLService.getJobs(id);
            scope.loading = true;
            scope.hasJobs = false;
            scope.responseCleared = false;
            //scope.runCleared = false;
            $http.get(link).then(function(data){
                var jobs = data.data.jobs; // get jobs json
                var jobs_size = data.data.jobs.length; // get length of jobs array
                var newJobs = {};

                for (var i = 0; i < jobs_size; i++) {
                    var test = jobs[i].status === 'completed';
                    if(jobs[i].name.endsWith('_job')){
                        if(jobs[i].status === 'completed' || jobs[i].status === 'failed'){
                            scope.buttonEnabled = true;
                        }else{
                            scope.buttonEnabled = false;
                        }
                        newJobs = {
                            name: jobs[i].name,
                            status: jobs[i].status,
                            schedule: jobs[i].schedule,
                            url: jobs[i].url,
                            command: jobs[i].command,
                            create: jobs[i].created,
                            id: jobs[i].id
                        };
                    }
                }
                if(!_.isEmpty(newJobs))
                    scope.hasJobs = true;
                scope.loading = false;
                scope.job = newJobs;
            }, function(error){
                // display some error?
                growl.error('There was a error in retrieving your job: ' + error.status);
                scope.loading = false;
            }).finally(function(){
                scope.responseCleared = true;
                //scope.runCleared = true;
            });
        };

        //Callback function for document change
        var changeDocument = function(newVal, oldVal) {// check if the right pane is reloaded everytime
            if (!newVal || (newVal == oldVal && ran))
                return;
            ran = true;
            lastid = newVal;
            ElementService.getElement(scope.mmsDocId, false, 'master', 'latest', 2, true)
            .then(function(document) {
                if (newVal !== lastid)
                    return;
                if(!UtilsService.isDocument(document))
                    return;
                scope.doc = document;
                documentName = document.name;
                scope.docEditable = document.editable && scope.mmsWs === 'master';
                ElementService.getIdInfo(document, null)
                .then(function(data) {
                    project = data;
                });
                scope.docName = documentName;
                getJobs();
            });
        };

        // watch for the docuement to change
        scope.$watch('mmsDocId', changeDocument);

        var jenkinsRun = function() {
            var link = URLService.getJenkinsRun(scope.job.id);
            //http://localhost:8080/alfresco/service/workspaces/master/jobs/scope.jobs[0].id/execute
            scope.runCleared = false;
            $http.post(link, ' ').then(function(){
                growl.success('Your job is running!');
            }, function(fail){
                growl.error('Your job failed run: ' + fail.status);
            }).finally(function(){
                scope.runCleared = true;
            });
        };

        // logic for running a job immediately
        scope.runNow = function(){
            if(!scope.job.name){
                scope.createJob().then(function(){
                    jenkinsRun();
                });
            }else{
                jenkinsRun();
            }
        };
        // logic for adding a new job
        scope.createJob = function() {
            var deferred = $q.defer();
            var id = scope.mmsDocId;
            var defaultName = scope.jobInput.jobName;
            scope.responseCleared = false;
            if(!scope.jobInput.jobName){
                defaultName = scope.docName + "_job";
            }
            var thisSchedule = ' ';
            //console.log(scope.myOutput);
            if(scope.myOutput !== '* * * * *' && scope.myOutput)
                    thisSchedule = scope.myOutput;
            var post = {
                jobs: [{
                    name: defaultName,
                    command: 'Jenkins,DocWeb,' + id + ',' + project.projectId,
                    schedule: thisSchedule,
                    status: 'in queue',
                    url: 'sample_initial_url',
                    ownerId: id,
                    documentation: '',
                    type: 'Element'
                }]
            };

            var link = URLService.getCreateJob();
            $http.post(link, post).then(function(data){
                scope.jobInput = { jobName:''};
                growl.success('Your job has posted');
                var job = data.data.elements;
                var job_size = data.data.elements.length;
                for (var i = 0; i < job_size; i++) {
                    if(job[i].type === 'Element'){
                        scope.job.id = job[i].id;
                    }
                }
                deferred.resolve();
            }, function(fail){
                growl.error('Your job failed to post: ' + fail.status);
            }).finally(function(){
                scope.responseCleared = true;
            });
            return deferred.promise;
        };

        var updateJob = function() {
            var id = scope.mmsDocId;
            var updatePost = {
                jobs: [{
                    id: scope.job.id,
                    name: scope.jobInput.jobName+'_job'
                }]
            };
            var link = URLService.getCreateJob();
            $http.post(link, updatePost).then(function(){
                growl.success('Your job has been updated');
                }, function(fail){
                    growl.error('Your job failed to update: ' + fail.status);
                });
        };
        scope.deleteJob = function(){
            var jobDelete = {
                jobs: [{
                    id: scope.job.id
                }]
            };
            var link = URLService.getJob(scope.job.id);
            scope.deleteCleared = false;
            $http.delete(link, jobDelete).then(function(){
                growl.success('Your job has been deleted');
                }, function(fail){
                    growl.error('Your job failed to be deleted: ' + fail.status);
                }).finally(function(){
                    scope.deleteCleared = true;
                });
        };

        scope.enableEditor = function() {
            if (!scope.docEditable)
                return;
            scope.editorEnabled = true;
            scope.jobInput.jobName = scope.job.name.replace('_job','');
        };
        scope.disableEditor = function() {
            scope.editorEnabled = false;
        };
        scope.save = function() {
            scope.job.name = scope.jobInput.jobName+'_job';
            updateJob();
            scope.disableEditor();
        };

        //actions for stomp
        scope.$on("stomp.job", function(event, newJob){
            for (var i = 0; i < newJob.length; i++) {
                if(newJob[i].ownerId === scope.mmsDocId){
                    scope.hasJobs = true;
                    if(newJob[i].status === 'completed' || newJob[i].status === 'failed'){
                        scope.buttonEnabled = true;
                    }else{
                        scope.buttonEnabled = false;
                    }
                    scope.job = {
                        name: newJob[i].name,
                        status: newJob[i].status,
                        create: newJob[i].created,
                        url: newJob[i].url,
                        id: newJob[i].id,
                    };
                    scope.$apply();
                }
            }
        });
        scope.$on("stomp.updateJob", function(event, updateJob){
            for (var i = 0; i < updateJob.length; i++) {
                if(updateJob[i].ownerId === scope.mmsDocId){
                    if(updateJob[i].status === 'completed' || updateJob[i].status === 'failed'){
                            scope.buttonEnabled = true;
                    }else{
                        scope.buttonEnabled = false;
                    }
                    scope.job.name = updateJob[i].name;
                    scope.job.status = updateJob[i].status;
                    scope.job.url = updateJob[i].url;
                    scope.$apply();
                }
            }
        });
        scope.$on("stomp.deleteJob", function(event, deleteJob){
            for (var i = 0; i < deleteJob.length; i++) {
                if(deleteJob[i].ownerId === scope.mmsDocId){
                    scope.buttonEnabled = false;
                    scope.hasJobs = false;
                    scope.job = ' ';
                    scope.$apply();
                }
            }
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
