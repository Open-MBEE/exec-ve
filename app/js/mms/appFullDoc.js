'use strict';

angular.module('mmsApp', ['mms', 'mms.directives'])
.config(function($httpProvider) {
    $httpProvider.defaults.headers.get = {'Authorization':'Basic bGhvOkNoQG5nMy5uMFcyMDM0'};
})
.controller('FullDocCtrl2', ['$scope', '$window', 'ElementService', 'ViewService', 'ConfigService', 
    function($scope, $window, ElementService, ViewService, ConfigService){
    var url = $window.location.href;
    var params = parseQueryString(url.substring(url.indexOf('?') + 1));
    $scope.ws = params.ws;
    $scope.site=params.site;
    $scope.docId=params.docId;
    $scope.viewId=params.viewId;
    $scope.section=params.section;
    $scope.version=params.time;

    var views= [];
    var view2children = {};
    var addToArray = function(viewId, curSection) {
        views.push({id: viewId, api: {
            
        }, number: curSection});

        if (view2children[viewId]) {
            var num = 1;
            view2children[viewId].forEach(function(cid) {
                addToArray(cid, curSection + '.' + num);
                num = num + 1;
            });
        }
    };

    if($scope.viewId && $scope.viewId.length>0){
        // views.push({id:$scope.viewId, api:{}});
        addToArray($scope.viewId, $scope.section);
    }
    else{
        views.push({id: $scope.docId, api: {}});
       

        ElementService.getElement($scope.docId, false, $scope.ws, $scope.version)
        .then(function(document) {
            $scope.document = document;
            var view2view = document.specialization.view2view;
            view2view.forEach(function(view) {
                view2children[view.id] = view.childrenViews;
             });
            var num = 1;
            view2children[document.sysmlid].forEach(function(cid) {
                addToArray(cid, num);
                num = num + 1;
            });
            //$scope.views = views;

        });
    }
    $scope.views = views;
}]);

var parseQueryString = function(queryString){
    var params = {}, queries, temp, i, l;
 
    // Split into key/value pairs
    queries = queryString.split("&");
 
    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }
 
    return params;    
};
