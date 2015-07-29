'use strict';

angular.module('mmsApp',['mms','mms.directives','ui.router','ngSanitize'])
.config(function($stateProvider,$urlRouterProvider){

  $stateProvider.state('workspaces',{
    url:'/portal',resolve:{
      dummyLogin:function($http,URLService){
        return $http.get(URLService.getCheckLoginURL());
      }
    },views:{
      'arrmportal':{
        templateUrl:'partials/testerrr/partialsArrmHomePresent.html',controller:'slideShowCtrl'
      }
    }
  });

});