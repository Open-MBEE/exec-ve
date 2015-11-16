'use strict';

angular.module('mms')
.factory('HttpService', ['$http', '$q', HttpService]);

/**
 * @ngdoc service
 * @name mms.HttpService
 * 
 * @description
 * Provides prioritization and caching for $http service calls
 */
function HttpService($http, $q, _) {
    
    
    var queue = {};
    queue[0]= [];//high proirity
    queue[1]=[];//low prority
    var cache = {}; // cache url -> this is a easy key look up
    var duplicate = {};// dupl url -> req this track duplicate requests and ignores them at seq time
    var inProgress = 0;
    var GET_OUTBOUND_LIMIT = 20; //max number of requests sent to the rest server at one time

    /**
     * @ngdoc method
     * @name mms.HttpService#get
     * @methodOf mms.HttpService
     * 
     * @description
     * Put a new get request in the queue, the queue is FIFO
     *
     * @param {string} url url to get
     * @param {function} success success function
     * @param {function} error function
     * @param {string} proirity by weight
     */
    var get = function(url, success, error, weight) {
        //wrap in case for duplicate URL--- has to return to both promises
        if (inProgress >= GET_OUTBOUND_LIMIT) {// there is already more then 20 requests add it to the cache
            // push to top of list
            var deferred = $q.defer();
            var request = { url : url, deferred: deferred ,weight: weight };
            if(request.weight === 0) // push new request to the end of array
                queue[0].push(request);
            else
                queue[1].push(request); 
            cache[url] = request;// a map of requests by url key as url
            if(cache.hasOwnProperty(url)){
                duplicate[url] = request;
            } 
            return deferred;
        } else if(request.weight === 3){
            // do I need to check for dups?
            return $q(function(resolve, reject){
                $http.get(url).then(function(response){
                    if(reponse.status == 200){
                        resolve(response.data);
                    }
                    else{
                        reject(response);
                    }
                });
        }
        else {
            inProgress++;
            if (cache.hasOwnProperty(url)) {
                delete cache[url];
            }
            return $q(function(resolve, reject){
                $http.get(url).then(function(response){
                    if(reponse.status == 200){
                        resolve(response.data);
                    }
                    else{
                        reject(response);
                    }
                }.finally( function() {
                    inProgress--;    
                    if (queue.length > 0) {
                        var next = queue.shift();
                        get(next.url, next.defer, next.weight);
                    }
                })
            });
        }
        // $http.get(url)
        // .then(function(response) {
        //   $scope.gists = response.data;
        // })
        // .catch(function(response) {
        //   console.error('Gists error', response.status, response.data);
        // })
        // .finally(function() {
        //   console.log("finally finished gists");
        // });
        //case 1: immediate 
        //case 2: medium level FIFO
        // case 3: low level FIFO
    };
    function search(cache){
        //if exists cache return true else false
        return true;
    }
    return {

    };

}