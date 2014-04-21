'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['ui.router', 'mms', 'angularBootstrapNavTree'])

  .controller('ElementCtrl', ["$scope", "ElementService", function($scope, ElementService) {
    ElementService.getElement($scope.elementid).then(function(data) {
        $scope.element = data;
    });

    $scope.changeElement = function() {
        $scope.elementid = $scope.elementid == "_17_0_2_3_407019f_1386871384972_702931_26371" ? "_17_0_2_3_407019f_1390507392384_798171_29256" : "_17_0_2_3_407019f_1386871384972_702931_26371";
        ElementService.getElement($scope.elementid).then(function(data) {
            $scope.element = data;
        });
    };
  }])

  .controller('AbnTestController', function($scope, ElementService, ViewService) {

    $scope.documentid = "_17_0_2_3_407019f_1390507581047_689015_29384";
    
    // 1. Iterate over view2view and create an array of all element ids
    // 2. Call get element ids and create a map of element id -> element name structure
    // 3. Iterate over view2view and create a map of element id -> element tree node reference
    
    ViewService.getDocument($scope.documentid).then(function(data) {

      // Array of all the view element ids
      var viewElementIds = [];

      // Map of view elements from view id -> tree node object
      var viewElementIds2TreeNodeMap = {};

      // Map of view element id -> view element name
      var viewElementIds2NameMap = {};

      // document id is the root the tree heirarchy
      var rootElementId = data.id;

      // Iterate through all the views in the view2view attribute
      // view2view is a set of elements with related child views
      // Note: The JSON format is NOT nested - it uses refrencing
      for (var i = 0; i < data.view2view.length; i++) {

        var viewId = data.view2view[i].id;

        if (! viewElementIds2NameMap[viewId]) {
          viewElementIds.push(viewId);
          viewElementIds2TreeNodeMap[viewId] = [];
          viewElementIds2NameMap[viewId] = "";
        }
          
        for (var j = 0; j < data.view2view[i].childrenViews.length; j++) {
            
          var childViewId = data.view2view[i].childrenViews[j];

          if (! viewElementIds2NameMap[childViewId]) {
            viewElementIds.push(childViewId);
            viewElementIds2TreeNodeMap[childViewId] = [];
            viewElementIds2NameMap[childViewId] = "";
          }
        }
      }

      // Call the get element service and pass in all the elements
      ElementService.getElements(viewElementIds).then(function(elements) {

        // Fill out all the view names first
        for (var i = 0; i < elements.length; i++)
        {
          viewElementIds2NameMap[elements[i].id] = elements[i].name;
        }


        for (var i = 0; i < data.view2view.length; i++) {

          var viewId = data.view2view[i].id;

          viewElementIds2TreeNodeMap[viewId] = { "label" : viewElementIds2NameMap[viewId], "children" : [] };
          
          for (var j = 0; j < data.view2view[i].childrenViews.length; j++) {
            
            var childViewId = data.view2view[i].childrenViews[j];

            viewElementIds2TreeNodeMap[viewId].children.push( { "label" : viewElementIds2NameMap[childViewId], "children" : []  } );

          }
        }

        $scope.my_data = [ viewElementIds2TreeNodeMap[rootElementId] ];

      });
    });
      
    $scope.my_data = [];

  });


// Declare module for Froala
angular.module('Froala', ['ui.router', 'mms'])
  .controller('FroalaCtrl', ['$scope', '$compile', 'ElementService', function($scope, $compile, ElementService) {
    $scope.insertElement = function() {
        var p = ElementService.getElement(document.getElementById("element-id-input").value);

        // if success, insert the text then unwrap the content from the span tag
        p.then(function(data) {
            var ins = $compile('<mms-transclude-name eid="'
                              + data.id
                              + '" class="ng-isolate-scope ng-binding"></mms-transclude-name>')($scope);
            angular.element('#marker-true').html(ins);
            angular.element('#marker-true').contents().unwrap();
        });

        // if error, clean up all markers
        p.catch(function(data) {
            angular.element('span[id*=marker-true').remove();
        });
    };

    $scope.cleanUp = function() {
        angular.element('span[id*=marker-true').remove();
    };

  }]);
