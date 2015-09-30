'use strict';

angular.module('mms')
.factory('StompService', ['$rootScope', 'UtilsService', '$window', '$location','ApplicationService', 'CacheService', StompService]);

/**
 * @ngdoc service
 * @name mms.StompService
 * @requires _
 * 
 * @description
 * Provides messages from the activemq JMS bus
 */
function StompService($rootScope, UtilsService, $window, $location, ApplicationService, CacheService) {
     var stompClient = {};
     var hostName = ($location.host() === 'localhost') ? 
                    'wss://ems-test-origin.jpl.nasa.gov:61614' : 
                    'wss://' + $location.host() + '-origin.jpl.nasa.gov:61614';
     stompClient = Stomp.client('wss://ems-test-origin.jpl.nasa.gov:61614');
     stompClient.connect("guest", "guest", function(){ // on success 
         stompClient.subscribe("/topic/master", function(message) {
             var updateWebpage = angular.fromJson(message.body);
             var workspaceId = updateWebpage.workspace2.id;
             if(updateWebpage.source !== ApplicationService.getSource()){
                 $rootScope.$apply( function(){
                     if(updateWebpage.workspace2.addedElements.length !== 0){
                         angular.forEach( updateWebpage.workspace2.addedElements, function(value, key) {
                             // check if element is in the cache, if not ignore
                             //var ws = !workspace ? 'master' : workspace;
                             var inCache = CacheService.exists( UtilsService.makeElementKey(value.sysmlid, workspaceId, 'latest', false) );
                             if(inCache === true)
                                UtilsService.mergeElement(value, value.sysmlid, workspaceId, false, "all" );
                             $rootScope.$broadcast("stomp.element", workspaceId, value.sysmlid , value.modifier, value.name);
                         });
                     }
                     if(updateWebpage.workspace2.updatedElements.length !== 0){
                         angular.forEach( updateWebpage.workspace2.updatedElements, function(value, key) {
                             var inCache = CacheService.exists( UtilsService.makeElementKey(value.sysmlid, workspaceId, 'latest', false) );
                             if(inCache === true)
                                UtilsService.mergeElement(value, value.sysmlid, workspaceId, false, "all" );
                             $rootScope.$broadcast("stomp.element", workspaceId, value.sysmlid , value.modifier, value.name);
                         });               
                     }
                 });
             }
             // this should happen in where...
             $rootScope.$on('$destroy', function() {
                 stompClient
                 .unsubscribe('/topic/master'/*, whatToDoWhenUnsubscribe*/);
             });
         });
     }, function(){/*on failure*/}, '/');
     // TODO: server disconnects in sufficiently long enough periods of inactivity
     //"Whoops! Lost connection to " and then reconnect
     //http://stackoverflow.com/questions/22361917/automatic-reconnect-with-stomp-js-in-node-js-application/22403521#22403521
     return {
         
     };
 }


