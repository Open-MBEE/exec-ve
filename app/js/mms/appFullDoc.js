'use strict';

angular.module('mmsApp', ['mms', 'mms.directives', 'ui.router'])
.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.rule(function ($injector, $location) {
        // determine if the url is older 2.0 format (will not have a workspace)
        if ($location.url().indexOf('/workspaces') === -1)
        {
            var locationPath = 'workspaces/master' + $location.url();

            var queryParams = '';
            var pathArr = locationPath.split('/');

            // determine if this came from docweb.html or ve.html, is there a product?
            if (locationPath.indexOf('/products/') !== -1) {

                // replace products with documents
                locationPath = locationPath.replace('/products/', '/documents/');
                locationPath = locationPath.replace('/view/', '/views/');
                locationPath = locationPath.replace('/all', '/full');

                // if there is a view, there should be a time in the url prior
                pathArr = locationPath.split('/');

                // get the time param and remove it from the array
                var time = pathArr[6]; 
                pathArr.splice(6,1);

                // add time as query param if it is not latest
                if (time && time !== 'latest') {
                    queryParams += 'time=' + time;
                }

            }

            // if there is a config, remove it and add it as a tag query param
            var idxOfTag = pathArr.indexOf('config');    
            if (idxOfTag !== -1) {
                var tag = pathArr[idxOfTag+1];
                queryParams += 'tag=' + tag;
                pathArr.splice(idxOfTag, 2);
                var idxOfSite = pathArr.indexOf('sites'); //redirect old config page to tag landing page
                if (idxOfSite !== -1)
                    pathArr.splice(idxOfSite, 2);
            }

            locationPath = pathArr.join('/');


            if (queryParams !== '') {
                locationPath += '?' + queryParams;
            }

            $location.url(locationPath);
        }

    });

    $stateProvider
    .state('default', {
        url: '/',
        templateUrl: 'partials/mms/full-doc2.html',
        controller: 'FullDocCtrl2'
    });
})
.controller('FullDocCtrl2', ['$scope', '$window', 'ElementService', 'ViewService', 'ConfigService', 
    function($scope, $window, ElementService, ViewService, ConfigService){
    var url = $window.location.href;
    var params = parseQueryString(url.substring(url.indexOf('?') + 1));
    $scope.ws = params['ws'];
    $scope.site=params['site'];
    $scope.docId=params['docId'];
    $scope.viewId=params['viewId'];
    $scope.section=params['section'];
    $scope.version=params['time'];

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
