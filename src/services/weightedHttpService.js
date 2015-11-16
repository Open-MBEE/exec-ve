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
     * Put a new get request in the queue, the queue is LIFO
     *
     * @param {string} url url to get
     * @param {function} success success function
     * @param {function} error function
     * @param {string} proirity by weight
     */
    var get = function(url, success, error, weight) {
        
        if (inProgress >= GET_OUTBOUND_LIMIT) {// there is already more then 20 requests add it to the cache
            // push to top of list
            var request = { url : url, success : success, error: error, weight: weight };
            if(request.weight === 0) // push new request to the end of array
                queue[0].push(request);
            else
                queue[1].push(request); 
            cache[url] = request;// a map of requests by url key as url 
        } else if(request.weight === 3){
            
        }
        else {
            inProgress++;
            if (cache.hasOwnProperty(url)) {
                delete cache[url];
            }
            $http.get(url)
                .then(function(reponse){
                    
                }
                finally( function() {
                    inProgress--;
                    
                    if (queue.length > 0) {
                        var next = queue.shift();
                        get(next.url, next.success, next.error);
                    }
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
        
        $http.get(url)
        .then(function(response){
            //some code reponse.data
        },
        function(error){
            // some error 
        });
    };
    function search(cache){
        //if exists cache return true else false
        return true;
    }
    return {

    };

}