'use strict';

angular.module('mms.directives')
.directive('mmsDiagramBlock', ['go', 'growl', 'ElementService', mmsDiagramBlock]);

function mmsDiagramBlock(go, growl, ElementService) {

  var mmsDiagramBlockCtrl = function(scope) {
  };

  var mmsDiagramBlockLink = function(scope, element, attrs) {



    ElementService.getOwnedElements('_17_0_5_1_62a0209_1405023685821_452906_15774', false, 'master', 'latest')
      .then(function(data) {

        var modelComponents = [];
        var modelRelationships = [];

        var ownedElementsMap = {};
        var groupsMap = {};

        for (var i = 0; i < data.elements.length; i++) {
          ownedElementsMap[data.elements[i].sysmlid] = data.elements[i];
        }

        for (i = 0; i < data.elements.length; i++) {
          var elem = data.elements[i];

          if (elem.hasOwnProperty('specialization')) {
            // ELEMENTS
            if (elem.specialization.type === 'Element') {
              
              var modelNode = { key: elem.name, color: "lightblue"};

              if (elem.hasOwnProperty('owner')) {

                var elemOwner = ownedElementsMap[elem.owner];

                // create group if first time
                if (! (groupsMap[elemOwner.name])) {
                  groupsMap[elemOwner.name] = elemOwner;

                  var groupNode = { key: elemOwner.name, isGroup: true};

                  modelComponents.push(groupNode);

                }

                modelNode.group = elemOwner.name;
              }

              modelComponents.push(modelNode);

            } // RELATIONSHIPS
            else if (elem.specialization.type === 'DirectedRelationship') {
              
              var sourceElement = ownedElementsMap[elem.specialization.source];
              var targetElement = ownedElementsMap[elem.specialization.target];

              var relationshipNode = { from: sourceElement.name, to: targetElement.name };

              modelRelationships.push(relationshipNode);
            }

          }
        }

        var $ = go.GraphObject.make;
        var diagram =  // create a Diagram for the given HTML DIV element
          $(go.Diagram, element[0],
            {
              nodeTemplate: $(go.Node, "Auto",
                              { locationSpot: go.Spot.Center },
                              new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
                              $(go.Shape, "RoundedRectangle", new go.Binding("fill", "color"),
                                {
                                  portId: "", cursor: "pointer",
                                  fromLinkable: true, toLinkable: true,
                                  fromLinkableSelfNode: true, toLinkableSelfNode: true,
                                  fromLinkableDuplicates: true, toLinkableDuplicates: true
                                }),
                              $(go.TextBlock, { margin: 3 }, new go.Binding("text", "key"))
                            ),
              linkTemplate: $(go.Link,
                              { relinkableFrom: true, relinkableTo: true },
                              $(go.Shape),
                              $(go.Shape, { toArrow: "OpenTriangle" })
                            ),
              initialContentAlignment: go.Spot.Center,
              "undoManager.isEnabled": true
            });
        // whenever a GoJS transaction has finished modifying the model, update all Angular bindings
        function updateAngular(e) {
          if (e.isTransactionFinished) scope.$apply();
        }

        diagram.model = new go.GraphLinksModel(
          modelComponents,
          modelRelationships
        );
        diagram.model.selectedNodeData = null;

        // notice when the value of "model" changes: update the Diagram.model
        /* scope.$watch("model", function(newmodel) {
          var oldmodel = diagram.model;
          if (oldmodel !== newmodel) {
            if (oldmodel) oldmodel.removeChangedListener(updateAngular);
            newmodel.addChangedListener(updateAngular);
            diagram.model = newmodel;
          }
        }); */
        // update the model when the selection changes
        diagram.addDiagramListener("ChangedSelection", function(e) {
          var selnode = diagram.selection.first();
          diagram.model.selectedNodeData = (selnode instanceof go.Node ? selnode.data : null);
          scope.$apply();
        });

      }, function(reason) {
          growl.error('Block Diagram - Error: ' + reason.message);
      });
  };

  return {
    restrict: 'E',
    template: '<div></div>',  // just a simple DIV element
    replace: true,
    scope: { model: '=goModel' },
    controller: ['ElementService', mmsDiagramBlockCtrl],
    link: mmsDiagramBlockLink
  };
}