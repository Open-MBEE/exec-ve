'use strict';

angular.module('mms')
.factory('JobService', ['$q', '$http', '$location', 'URLService', 'CacheService', 'AuthService', '_', JobService]);

/**
 * @ngdoc service
 * @name mms.JobService
 * @requires $q
 * @requires $http
 * @requires $location
 * @requires mms.URLService
 * @requries mms.CacheService
 * 
 * @description
 * This service handles VE jobs- creation, running, ...
 */
function JobService($q, $http, $location, URLService, CacheService, AuthService, _) {

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

    /**
     * @ngdoc method
     * @name mms.JobService#runJob
     * @methodOf mms.JobService
     * 
     * @description
     * Run job
     * 
     * @returns {Promise} The promise will be resolved with the job instance
     */
    var runJob = function (jobRunOb, projectId, refId) {
        var deferred = $q.defer();
        var link = URLService.getRunJobURL(projectId, refId, jobRunOb.id);
        var post = {
            "mmsServer" : serverSentPMA,
            "alfrescoToken" : AuthService.getTicket()
        };
        if (jobRunOb.post) {
            _.merge(post, jobRunOb.post);
        }
        $http.post(link, post).then(function(data) {
            // growl.success('Your job is running!');
            deferred.resolve(data.data.jobInstances);
        }, function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };


    // get all the jobs for current document
    var getJobs = function (docId, projectId, refId) {
        var deferred = $q.defer();
        var link = URLService.getJobsURL(projectId, refId, serverSentPMA);
        var docJobs = [];
        $http.get(link).then(function(data) {
            var jobs = data.data.jobs; // get jobs json
            for (var i = 0; i < jobs.length; i++) {
                if (jobs[i].associatedElementID === docId) {
                    docJobs.push(jobs[i]);
                }
            }
            deferred.resolve(docJobs);
        }, function(error) {
            deferred.reject(error);
            // growl.error('There was a error in retrieving your job: ' + error.status);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.JobService#createJob
     * @methodOf mms.JobService
     * 
     * @description
     * Create new job for doc
     *  <pre>
        JobService.createJob({
            id: 'docId', 
            jobName: 'docName_docmerge', //default ''
            jobType: 'docmerge',         //default 'docgen'
            jobSchedule: '* * * *',      //default ''
        }).then(
            function(job) { 
                alert('created ' + job.name);
            }, 
            function(reason) {
                alert('creation failed: ' + reason.message);
                //see mms.URLService#handleHttpStatus for the reason object
            }
        );
        </pre>
     * 
     * @returns {Promise} The promise will be resolved with new job
     */
    var createJob = function(jobOb, projectId, refId) {
        var deferred = $q.defer();
        var id = jobOb.id;
        var jobName = jobOb.jobName;
        var jobType = 'docgen';
        var jobSchedule = '';
        
        if (jobOb.jobType) {
            jobType = jobOb.jobType;
        }
        if (jobOb.jobSchedule) {
            jobSchedule = jobOb.jobSchedule;
        }

        // {"jobName":"JobTest",
        // "command":"docmerge",
        // "associatedElementID":"_18_5_1_83a025f_1496779295221_543977_3603",
        // "mmsServer":"opencae-int.jpl.nasa.gov",
        // "alfrescoToken":"TICKET_3d1e48c2dd70c18e4d1f5fd01a7ce210264fbd56"}
        var post = {
            "jobName" : jobName,
            "command" : jobType,
            // "arguments" : ["arg1","arg2"],
            "schedule" : jobSchedule,
            "associatedElementID" : id,
            "mmsServer" : serverSentPMA,
            "alfrescoToken" : AuthService.getTicket()
        };

        var link = URLService.getCreateJobURL(projectId, refId);
        $http.post(link, post).then(function(data) {
            // growl.success('Your job has posted');
            deferred.resolve(data.data.jobs);
        }, function(error) {
            deferred.reject(error);
            // growl.error('Your job failed to post: ' + fail.data.message);
        });
        return deferred.promise;
    };

    var createImageCacheKey = function(reqOb) {
        var refId = !reqOb.refId ? 'master' : reqOb.refId;
        var commitId = !reqOb.commitId ? 'latest' : reqOb.commitId;
        return ['image', reqOb.projectId, refId, reqOb.elementId, commitId, reqOb.accept];
    };

    return {
        createJob: createJob,
        getJobs: getJobs,
        runJob: runJob
    };

}