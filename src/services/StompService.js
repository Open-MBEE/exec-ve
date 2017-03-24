'use strict';

angular.module('mms')
.factory('StompService', ['$rootScope', 'UtilsService', '$window', '$location','ApplicationService', 'CacheService', 'URLService','$http', StompService]);

/**
 * @ngdoc service
 * @name mms.StompService
 * @requires _
 *
 * @description
 * Provides messages from the activemq JMS bus
 */
function StompService($rootScope, UtilsService, $window, $location, ApplicationService, CacheService, URLService, $http) {
     var stompClient = {};
     var host;

    $http.get(URLService.getJMSHostname()).then(function successCallback(response) {
        if(response.data.connections[0].hasOwnProperty("uri")){
            var removeProtocol = response.data.connections[0].uri.replace(/.*?:\/\//g, "");
            host = 'wss://' + removeProtocol.substring(0, removeProtocol.length-6) + ':61614';
            stompConnect();
        }else{
            console.log('JSON does not contain the right key.  STOMP failed.');
        }
    }, function errorCallback(failed) {
        console.log("failed to connect to the JMS:  " + failed.status);
    });

    var stompSuccessCallback = function(message){
        var updateWebpage = angular.fromJson(message.body);
        var workspaceId = message.headers.workspace;
        if(updateWebpage.source !== ApplicationService.getSource()){
            $rootScope.$apply( function(){
                if(updateWebpage.refs.addedElements && updateWebpage.refs.addedElements.length > 0){
                    angular.forEach( updateWebpage.refs.addedElements, function(value, key) {
                        // check if element is in the cache, if not ignore
                        //var ws = !workspace ? 'master' : workspace;
                        var inCache = CacheService.exists( UtilsService.makeElementKey(value.id, workspaceId, 'latest', false) );
                        if(inCache === true)
                            UtilsService.mergeElement(value, value.id, workspaceId, false, "all" );
                        $rootScope.$broadcast("stomp.element", value, workspaceId, value.id , value._modifier, value.name);
                    });
                }
                if(updateWebpage.refs.updatedElements && updateWebpage.refs.updatedElements.length > 0){
                    angular.forEach( updateWebpage.refs.updatedElements, function(value, key) {
                        // TODO fix - only sends back id.. do we need to make a call to get obj?
                        // var inCache = CacheService.exists( UtilsService.makeElementKey(value.id, workspaceId, 'latest', false) );
                        // if(inCache === true && $rootScope.veEdits && $rootScope.veEdits['element|' + value.id + '|' + workspaceId] === undefined)
                        //     UtilsService.mergeElement(value, value.id, workspaceId, false, "all" );
                        // var history = CacheService.get(UtilsService.makeElementKey(value.id, workspaceId, 'versions'));
                        // if (history)
                        //     history.unshift({modifier: value._modifier, timestamp: value._modified});
                        // $rootScope.$broadcast("stomp.element", value, workspaceId, value.id , value._modifier, value.name);
                    });
                }
            });
        }
        if(updateWebpage.refs.addedJobs  && updateWebpage.refs.addedJobs.length > 0 ){//check length of added jobs > 0
            var newJob = updateWebpage.refs.addedJobs;
            $rootScope.$broadcast("stomp.job", newJob);
        }
        if(updateWebpage.refs.updatedJobs  && updateWebpage.refs.updatedJobs.length > 0 ){//check length of added jobs > 0
            var updateJob = updateWebpage.refs.updatedJobs;
            $rootScope.$broadcast("stomp.updateJob", updateJob);
        }
        if(updateWebpage.refs.deletedJobs  && updateWebpage.refs.deletedJobs.length > 0 ){//check length of added jobs > 0
            var deleteJob = updateWebpage.refs.deletedJobs;
            $rootScope.$broadcast("stomp.deleteJob", deleteJob);
        }
        // this should happen in where...
        $rootScope.$on('$destroy', function() {
            stompClient.unsubscribe('/topic/master'/*, whatToDoWhenUnsubscribe*/);
        });
    };
    var stompFailureCallback = function(error){
        console.log('STOMP: ' + error);
        stompConnect();
        console.log('STOMP: Reconecting in 10 seconds');
    };
    var stompConnect = function(){
        stompClient = Stomp.client(host);
        stompClient.debug = null;
        stompClient.connect("guest", "guest", function(){ // on success
            stompClient.subscribe("/topic/master", stompSuccessCallback );
        }, stompFailureCallback, '/');
    };

     return {

     };
 }
