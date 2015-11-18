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
     /* var hostName = ($location.host() === 'localhost') ? 
                     'wss://ems-int-origin.jpl.nasa.gov:61614':
                     'wss://'+$location.host().split(".")[0]+'-origin.jpl.nasa.gov'; 
                    this is used when running localhost for testing
                    */
     var hostName = 'wss://'+$location.host().split(".")[0]+'-origin.jpl.nasa.gov:61614'; 
     stompClient = Stomp.client(hostName);
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
                             $rootScope.$broadcast("stomp.element", value, workspaceId, value.sysmlid , value.modifier, value.name);
                         });
                     }
                     if(updateWebpage.workspace2.updatedElements.length !== 0){
                         angular.forEach( updateWebpage.workspace2.updatedElements, function(value, key) {
                             //var affectedIds = value.affectedIds;
                             var inCache = CacheService.exists( UtilsService.makeElementKey(value.sysmlid, workspaceId, 'latest', false) );
                             if(inCache === true)
                                UtilsService.mergeElement(value, value.sysmlid, workspaceId, false, "all" );
                             var history = CacheService.get(UtilsService.makeElementKey(value.sysmlid, workspaceId, 'versions'));
                             if (history) 
                                history.unshift({modifier: value.modifier, timestamp: value.modified});
                             $rootScope.$broadcast("stomp.element", value, workspaceId, value.sysmlid , value.modifier, value.name);
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
     }, function(error){/*on failure*/
         console.log("========== the callback for the failure is here ============");
         //console.log(error.headers.message);
     }, '/');
     // TODO: server disconnects in sufficiently long enough periods of inactivity
     //"Whoops! Lost connection to " and then reconnect
     //http://stackoverflow.com/questions/22361917/automatic-reconnect-with-stomp-js-in-node-js-application/22403521#22403521
     return {
         
     };
 }


