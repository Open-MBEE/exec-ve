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

    .controller('AbnTestController', function($scope, $state, ElementService, ViewService) {

       $scope.documentid = "_17_0_2_3_407019f_1390507581047_689015_29384";
      //$scope.documentid = "_17_0_2_3_8660276_1389735483493_203695_64097";
      //$scope.documentid = "_17_0_2_3_897027c_1380234582224_623869_33513";
      var tree;

      $scope.my_tree = tree = {};

      // 1. Iterate over view2view and create an array of all element ids
      // 2. Call get element ids and create a map of element id -> element name structure
      // 3. Iterate over view2view and create a map of element id -> element tree node reference
      
      ViewService.getDocument($scope.documentid).then(function(data) {

        // Array of all the view element ids
        var viewElementIds = [];

        // Map of view elements from view id -> tree node object
        var viewElementIds2TreeNodeMap = {};
        
        // document id is the root the tree heirarchy
        var rootElementId = data.id;

        // Iterate through all the views in the view2view attribute
        // view2view is a set of elements with related child views
        // Note: The JSON format is NOT nested - it uses refrencing
        for (var i = 0; i < data.view2view.length; i++) {

          var viewId = data.view2view[i].id;
          
          viewElementIds.push(viewId);
        }

        // Call the get element service and pass in all the elements
        ElementService.getElements(viewElementIds).then(function(elements) {

          // Fill out all the view names first
          for (var i = 0; i < elements.length; i++)
          {
            var viewTreeNode = { label : elements[i].name, 
                                  data : elements[i], 
                              children : [] };

            viewElementIds2TreeNodeMap[elements[i].id] = viewTreeNode;
          }

          for (var i = 0; i < data.view2view.length; i++) {

            var viewId = data.view2view[i].id;
            
            for (var j = 0; j < data.view2view[i].childrenViews.length; j++) {
              
              var childViewId = data.view2view[i].childrenViews[j];

              viewElementIds2TreeNodeMap[viewId].children.push( viewElementIds2TreeNodeMap[childViewId] );

            }
          }

          $scope.my_data = [ viewElementIds2TreeNodeMap[rootElementId] ];

        });
      });
        
      $scope.my_data = [];

      $scope.my_tree_handler = function(branch) {
        var viewId = branch.data.id;

        $state.go('view', {viewId: viewId});

      };

      $scope.try_adding_a_branch = function() {
        var branch = tree.get_selected_branch();
        return tree.add_branch(branch, {
          label: 'New Branch',
          data: {
            name: "New Branch",
            "else": 43
          }
        });
      };

    })

    .config(function($stateProvider, $urlRouterProvider){
      $stateProvider
          .state('view', {
              url: '/view/:viewId',
              template: '<div class="row"><div class="col-lg-8 main"><mms-view vid="{{vid}}" transclude-clicked="tscClicked(elementId)"></mms-view></div><div class="col-lg-4" ui-view></div></div>',
              controller: function($scope, viewid, $state) {
                  $scope.vid = viewid.viewid;
                  $scope.tscClicked = function(elementId) {
                      $state.go('view.element', {elementId: elementId});
                  };
              },
              resolve: {
                  viewid: function($stateParams) {
                      return {viewid: $stateParams.viewId};
                  },
                  viewElements: function($stateParams, ViewService) {
                      return ViewService.getViewAllowedElements($stateParams.viewId);
                  }
              }
          })
          .state('view.element', {
              url: '/element/:elementId',
              template: '<h5>Element Spec</h5><mms-spec eid="{{eid}}" editable-field="all" transcludable-elements="viewElements"></mms-spec>',
              controller: function($scope, viewElements, elementId) {
                  $scope.viewElements = viewElements;
                  $scope.eid = elementId.elementid;
              },
              resolve: {
                  elementId: function($stateParams) {
                      return {elementid: $stateParams.elementId};
                  }
              }    
          });
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
