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
    //queue[0]= [];//high proirity
    //queue[1]=[];//low prority
    var cache = {}; // cache url -> this is a easy key look up
    //var duplicate = {};// dupl url -> req this track duplicate requests and ignores them at seq time
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
    var get = function(url, successCallback, errorCallback, weight) {
        if (inProgress >= GET_OUTBOUND_LIMIT) {
            //var deferred = $q.defer();
            var request = { url : url, sucessCallback: sucessCallback , errorCallback: errorCallback ,weight: weight };
            if(request.weight === 0) // push new request to the end of array
                queue[0].push(request);
            else
                queue[1].push(request); 
            if(cache.hasOwnProperty(url)){//list of duplicates in cache
                 if(cache[url].weight < request.weight)
                    cache[url].weight = request.weight;
            }
            else {
                cache[url] = request;// a map of requests by url key as url
            } 
            //return deferred; 
        } 
        else {
            inProgress++;
            if (cache.hasOwnProperty(url)) {
                delete cache[url];
            }//TODO the delete is problematic beacuse we depend on the cache to look for dups, but we don't want to 
            // delete it until the request is finished.
            $http.get(url).then(
                function(response){sucessCallback(response.data, response.status, response.headers, response.config)},
                function(response){errorCallback(response.data, response.status, response.headers, response.config)})
                .finally( function() {
                    inProgress--; 
                    var next;   
                    if (queue[1].length > 0) {
                        next = queue[1].shift();
                        get(next.url, next.sucessCallback, next.errorCallback, next.weight);
                    }
                    if(queue[1].length <= 0 && queue[0].length > 0){
                        next = queue[0].shift();
                        get(next.url, next.sucessCallback, next.errorCallback, next.weight);
                    }
                })
            });
        }
        // function getRequest(){
        //     return $q(function(resolve, reject){
        //         $http.get(url).then(function(response){
        //             if(reponse.status == 200){
        //                 resolve(response.data);
        //             }
        //             else{
        //                 reject(response);
        //             }
        //         });
        // }}
    };
    // function search(cache){
    //     //if exists cache return true else false
    //     return true;
    // }
    // NEW FUNCTION THAT CHANGES EVERTHING TO LOW PRIORITY 
    /**
     * @ngdoc method
     * @name mms.HttpService#ping
     * @methodOf mms.HttpService
     * 
     * @description
     * If the current queue has an ongoing request, put it in front
     *
     * @param {string} url url to get
     */
    var ping = function(url, weight) { // ping should simply change the weight
        if (cache.hasOwnProperty(url)) {
            var request = cache[url];
            var index = queue[0].indexOf(request);
            if(request.weight === 0)// if 0 change to 1
                request.weight = 1;
            if (index > -1) {
                queue[0].splice(index, 1);
            }
            queue[1].push(request);// move to back of 1
        }
    };
    return {
        get: get,
        ping: ping
    };

}