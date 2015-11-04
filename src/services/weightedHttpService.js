// 'use strict';
// 
// angular.module('mms')
// .factory('HttpService', ['$http', '$q', HttpService]);
// 
// /**
//  * @ngdoc service
//  * @name mms.HttpService
//  * 
//  * @description
//  * Provides prioritization and caching for $http service calls
//  */
// function HttpService($http, $q, _) {
//     
//     var queue = [];
//     var inProgress = 0;
//     var cache = {};
//     var GET_OUTBOUND_LIMIT = 20; //max number of requests sent to the rest server at one time
// 
//     /**
//      * @ngdoc method
//      * @name mms.HttpService#get
//      * @methodOf mms.HttpService
//      * 
//      * @description
//      * Put a new get request in the queue, the queue is LIFO
//      *
//      * @param {string} url url to get
//      * @param {function} success success function
//      * @param {function} error function
//      * @param {string} proirity by weight
//      */
//     var get = function(url, success, error, weight) {
//         
//         // if (inProgress >= GET_OUTBOUND_LIMIT) {// there is already more then 20 requests add it to the cache
//         //     // push to top of list
//         //     var request = { url : url, success : success, error: error };
//         //     cache[url] = request;// a map of requests by url
//         //     queue.unshift(request); //adds items to the beginning of the array/queue
//         // }
//         // else {
//         //     inProgress++; // add one to inProgress
//         //     if (cache.hasOwnProperty(url)) { // checks object for URL, if it's already in the cache delete it!
//         //         delete cache[url]; // remove from cache
//         //     }
//         //     $http.get(url)//pass the request
//         //         .success(success)
//         //         .error(error)
//         //         .finally( function() {
//         //             inProgress--;//remove it from the count
//         //             
//         //             if (queue.length > 0) {
//         //                 var next = queue.shift();
//         //                 get(next.url, next.success, next.error);//call the method again until 0 recursive
//         //             }
//         //         });
//         // }
//         
//         //case 1: immediate 
//         //case 2: medium level FIFO
//         // case 3: low level FIFO
//         
//         $http.get(url)
//         .then(function(response){
//             //some code reponse.data
//         },
//         function(error){
//             // some error 
//         });
//     };
// 
//     /**
//      * @ngdoc method
//      * @name mms.HttpService#ping
//      * @methodOf mms.HttpService
//      * 
//      * @description
//      * If the current queue has an ongoing request, put it in front
//      *
//      * @param {string} url url to get
//      */
//     // var ping = function(url) {
//     //     if (cache.hasOwnProperty(url)) {
//     //         var request = cache[url];
//     //         var index = queue.indexOf(request);
//     //         if (index > -1) {
//     //             queue.splice(index, 1);
//     //         }
//     //         queue.unshift(request);
//     //     }
//     // };
//     // immediate method of weight 2 should be processed even if it's over the outbound_limit
//     return {
//         //get: get,
//         //ping: ping
//     };
// 
// }