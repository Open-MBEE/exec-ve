'use strict';

angular.module('mms')
.factory('StompService', ['$rootScope', 'UtilsService', '$window', '$location','ApplicationService', StompService]);

/**
 * @ngdoc service
 * @name mms.StompService
 * @requires _
 * 
 * @description
 * Provides messages from the activemq JMS bus
 */
function StompService($rootScope, UtilsService, $window, $location, ApplicationService) {
     var stompClient = {};
     var timeStamp = Date.now().toString();//alternate for uniqueID this line is just for testing 
     console.log("Stomp: " + ApplicationService.getSource());
     var hostName = ($location.host() === 'localhost') ? 
                    'wss://ems-test-origin.jpl.nasa.gov:61614' : 
                    'wss://' + $location.host() + '-origin.jpl.nasa.gov:61614';
     // elementService.update -- when it constructs a json to the source get added 
     //in there root json oject add another key called src with the client id and 
     //filter them out in angular in the messages becase they have the source information
     stompClient = Stomp.client('wss://ems-test-origin.jpl.nasa.gov:61614');
     stompClient.connect("guest", "guest", function(){
           stompClient.subscribe("/topic/master", function(message) {
               var updateWebpage = angular.fromJson(message.body);
               var workspaceId = updateWebpage.workspace2.id;
               console.log("=========length of empty array========" + updateWebpage.workspace2.updatedElements.length);
               $rootScope.$apply( function(){
               if(updateWebpage.workspace2.addedElements.length !== 0){
                      angular.forEach( updateWebpage.workspace2.addedElements, function(value, key) {
                               UtilsService.mergeElement(value, value.sysmlid, workspaceId, false, "all" );
                               $rootScope.$broadcast("stomp.element", workspaceId, value.sysmlid);
                           });
               }
               if(updateWebpage.workspace2.updatedElements.length !== 0){
                      angular.forEach( updateWebpage.workspace2.updatedElements, function(value, key) {
                               UtilsService.mergeElement(value, value.sysmlid, workspaceId, false, "all" );
                               $rootScope.$broadcast("stomp.element", workspaceId, value.sysmlid);
                           });               
               }
            });
            //    if(updateWebpage.wor)
            //    var loop = function(updateWebpage, whichElement){
            //    angular.forEach( updateWebpage.workspace2.whichElement, function(value, key) {
            //             UtilsService.mergeElement(value, value.sysmlid, workspaceId, false, "all" );
            //             $rootScope.$broadcast("stomp.element", workspaceId, value.sysmlid);
            //         });
            //     }
               //$window.alert("The shit: \n" + updateWebpage.workspace2.updatedElements.sysmlid );
           });
       }, function(){}, '/');
     var connect = function(user, password, on_connect, on_error, vhost) {
         this.stompClient.connect(user, password,
             function(frame) {
                 $rootScope.$apply(function() {
                     on_connect.apply(stompClient, frame);
                 });
             },
             function(frame) {
                 $rootScope.$apply(function() {
                     on_error.apply(stompClient, frame);
                 });
             }, vhost);
     };
     var subscribe = function(queue, callback) {
         this.stompClient.subscribe(queue, function() {
             var args = arguments;
             $rootScope.$apply(function() {
                 callback(args[0]);
             });
         });
     };
     return {
         
     };
 }


