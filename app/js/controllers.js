'use strict';

/* Controllers */

angular.module('myApp')
.controller('NavTreeCtrl', function($scope, $state, $stateParams, ElementService, ViewService) {
    $scope.documentid = $stateParams.docId;
       //$scope.documentid = "_17_0_2_3_407019f_1390507581047_689015_29384";
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

        $state.go('doc.view', {viewId: viewId});

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

    });
