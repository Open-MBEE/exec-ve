'use strict';

angular.module('mms.directives')
.directive('mmsJobs', ['$templateCache','$http', '$location', 'ElementService','UtilsService','growl', mmsJobs]);
/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsJobs
 *
 * @requires $templateCache
 * @requires $http
 * @requires $location
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
 * @param {string=null} mmsDocId 
 */
function mmsJobs($templateCache, $http, $location, ElementService, UtilsService, growl) {
    var template = $templateCache.get('mms/templates/mmsJobs.html');

    var mmsJobsLink = function(scope, element, attrs) {
        //var cron_value;
        var documentName;
        var project;
        var ran = false;
        var lastid = null;
        //scope.serverData = "0 0 * * *";
        // scope.test = function(){
        //         console.log('Hello');
        //         console.log(scope.myOutput);
        // };
        scope.jobInput = { jobName:''};
        
        // get all the jobs for current document
        var getJobs = function(){
            var id = scope.mmsDocId;  
            var link = '/alfresco/service/workspaces/master/jobs/'+ id + '?recurse=1';
            scope.loading = true;
            scope.hasJobs = false;
            $http.get(link).then(function(data){
                var jobs = data.data.jobs; // get jobs json
                var jobs_size = data.data.jobs.length; // get length of jobs array
                var newJobs = [];
                for (var i = 0; i < jobs_size; i++) {
                    newJobs.push({
                        name: jobs[i].name,
                        status: jobs[i].status,
                        schedule: jobs[i].schedule,
                        url: jobs[i].url,
                        command: jobs[i].command,
                        sysmlid: jobs[i].sysmlid
                    });
                }
                if(newJobs.length > 0)
                    scope.hasJobs = true;
                scope.loading = false;
                scope.jobs = newJobs;
            }, function(error){
                // display some error?
                growl.error('There was a error in retrieving your jobs: ' + error.status); 
                scope.loading = false;
            });    
        };
        
        //Callback function for document change
        var changeDocument = function(newVal, oldVal) {// check if the right pane is reloaded everytime
            if (!newVal || (newVal == oldVal && ran))
                return;
            ran = true;
            lastid = newVal;
            ElementService.getElement(scope.mmsDocId, false, 'master', 'latest', 2)
            .then(function(document) {
                if (newVal !== lastid)
                    return;
                if(!document.specialization || document.specialization.type !== 'Product')
                    return;
                documentName = document.name;
                project = UtilsService.getIdInfo(document, null);
                scope.docName = documentName;
                getJobs();
            });
        };
        
        // watch for the docuement to change
        scope.$watch('mmsDocId', changeDocument);
        
        // logic for running a job immediately 
        scope.runNow = function(){
            if(scope.jobs.length < 1){
                scope.createJob();
                jenkinsRun();
            }else{
                console.log(scope.jobs[0].sysmlid);
                jenkinsRun();
            }
        };
        var jenkinsRun = function() {
            var link = '/alfresco/service/workspaces/master/jobs/'+scope.jobs[0].sysmlid+'/execute';
            //http://localhost:8080/alfresco/service/workspaces/master/jobs/scope.jobs[0].sysmlid/execute
            $http.post(link, ' ').then(function(){
                growl.success('Your job is running!');
            }, function(fail){
                growl.error('Your job failed run: ' + fail.status);
            });
        };
        
        // logic for adding a new job 
        scope.createJob = function() {
            var id = scope.mmsDocId;    
            var post = {
                jobs: [{
                    name: scope.jobInput.jobName,
                    command: 'Jenkins,DocWeb,' + documentName + ',' + project.projectName,
                    schedule: scope.myOutput,
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

            var link = '/alfresco/service/workspaces/master/jobs';
            $http.post(link, post).then(function(){
                //scope.$setPristine(true);
                scope.jobInput = { jobName:''};
                growl.success('Your job has posted');
            
            }, function(fail){
                growl.error('Your job failed to post: ' + fail.status);
            });
        }; 
        
        //actions for stomp 
        scope.$on("stomp.job", function(event, newJob){
            var jobs = newJob; // get jobs json
            scope.hasJobs = true;
            if(jobs.owner === scope.mmsDocId){
                scope.jobs.push({
                    name: newJob.name,
                    status: newJob.status,
                    schedule: newJob.schedule,
                    url: newJob.url,
                    command: newJob.command
                });
            }
        });
        scope.$on("stomp.updateJob", function(event, updateJob){
            if(updateJob.owner === scope.mmsDocId){
                angular.forEach(scope.jobs, function(value, key) {
                    if(value.url === updateJob.url){
                        value.name = updateJob.name;
                        value.status = updateJob.status;
                        value.schedule = updateJob.schedule;
                        value.url = updateJob.url;
                        value.command = updateJob.command;
                    }
                });
            }
        });
        // :TODO This jquery library needs to be replaced with https://github.com/jacobscarter/angular-cron-jobs
        // $('#cronOptions').cron({
        //     initial: "0 0 * * *",
        //     onChange: function() {
        //         cron_value = $(this).cron("value");
        //     },
        // });
        scope.myConfig = {
            options : {
                allowMinute : false,
                allowHour : false
            }
        };      
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
