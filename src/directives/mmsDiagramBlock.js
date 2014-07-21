'use strict';

angular.module('mms.directives')
.directive('mmsDiagramBlock', ['go', 'growl', 'ElementService', mmsDiagramBlock]);

function mmsDiagramBlock(go, growl, ElementService) {

  var mmsDiagramBlockCtrl = function(scope) {
  };

  var mmsDiagramBlockLink = function(scope, element, attrs) {

      ElementService.getOwnedElements('_17_0_5_1_62a0209_1405965827907_577690_15997', false, 'master', 'latest')
      .then(function(data) {

        var ownedElementsMap = {};

        for (var i = 0; i < data.elements.length; i++) {
          ownedElementsMap[data.elements[i].sysmlid] = data.elements[i];
        }

        // create a list of all the nodes
        var nodesMap = {};

        var elem;

        for (i = 0; i < data.elements.length; i++) {
          elem = data.elements[i];

          if (elem.hasOwnProperty('specialization') && 
              elem.specialization.type === 'Element') {

            var node = { key: elem.sysmlid, label: elem.name, children: [] };

            // does it have an owner and is the owner a member of this model?
            if (elem.hasOwnProperty('owner') && 
                ownedElementsMap[elem.owner]) {
              node.parent = elem.owner;
            }

            nodesMap[node.key] = node;
          }
        }

        // associate children nodes with all the nodes and
        var nodes = [];
 
        for (var elem_sysmlid in nodesMap) {
          var elem_node = nodesMap[elem_sysmlid];
          nodes.push(elem_node);
          if (elem_node.parent) {
            nodesMap[elem_node.parent].children.push(elem_node);
          }
        }

        // create a list of all the edges / relationships
        var edges = [];

        for (i = 0; i < data.elements.length; i++) {
          elem = data.elements[i];

          if (elem.hasOwnProperty('specialization') && 
              elem.specialization.type === 'DirectedRelationship') {
              
            var sourceElement = ownedElementsMap[elem.specialization.source];
            var targetElement = ownedElementsMap[elem.specialization.target];

            var edge = { from: sourceElement.sysmlid, to: targetElement.sysmlid };

            edges.push(edge);
          }
        }

        // a graph is a set of nodes, edges
        var graph = { nodes: nodes, edges : edges };



        // create a list of components to diagram from the graph
        var components = [];

        for (i = 0; i < graph.nodes.length; i++) {
          elem = graph.nodes[i];

          var diagramNode = { key: elem.key, text: elem.label, color: "lightblue"};

          // if the element has children then it should be a group
          if (elem.children.length > 0) {
            diagramNode.isGroup = true;
          }

          if (elem.parent) {
            diagramNode.group = elem.parent;
          }

          components.push(diagramNode);
        }

        var $ = go.GraphObject.make;
        var myDiagram =  // create a Diagram for the given HTML DIV element
          $(go.Diagram, element[0],
            {
              allowDrop: true,
                  // what to do when a drag-drop occurs in the Diagram's background
                  mouseDrop:
                    function(e) {
                        // when the selection is dropped in the diagram's background,
                        // make sure the selected Parts no longer belong to any Group
                        var ok = myDiagram.commandHandler.addTopLevelParts(myDiagram.selection, true);
                        if (!ok) myDiagram.currentTool.doCancel();
                    },
                  layout:
                    $(go.GridLayout,
                      { wrappingWidth: Infinity, alignment: go.GridLayout.Position,
                          cellSize: new go.Size(1, 1) }),
                  initialContentAlignment: go.Spot.Center,
                  groupSelectionAdornmentTemplate:  // this applies to all Groups
                    $(go.Adornment, go.Panel.Auto,
                      $(go.Shape, "Rectangle",
                        { fill: null, stroke: "dodgerblue", strokeWidth: 3 }),
                      $(go.Placeholder)),
                  "commandHandler.archetypeGroupData": { isGroup: true, category: "OfNodes" },
                  "undoManager.isEnabled": true
            });




        myDiagram.addDiagramListener("ChangedSelection", function(e) {

            var selnode = myDiagram.selection.first();
            myDiagram.model.selectedNodeData = (selnode instanceof go.Node ? selnode.data : null);
            scope.$apply();

        });


        function highlightGroup(e, grp, show) {
              if (!grp) return;
              e.handled = true;
              if (show) {
                  // cannot depend on the grp.diagram.selection in the case of external drag-and-drops;
                  // instead depend on the DraggingTool.draggedParts or .copiedParts
                  var tool = grp.diagram.toolManager.draggingTool;
                  var map = tool.draggedParts || tool.copiedParts;  // this is a Map
                  // now we can check to see if the Group will accept membership of the dragged Parts
                  if (grp.canAddMembers(map.toKeySet())) {
                      grp.isHighlighted = true;
                      return;
                  }
              }
              grp.isHighlighted = false;
          }

           function finishDrop(e, grp) {
              var ok = grp !== null && grp.addMembers(grp.diagram.selection, true);
              if (!ok) grp.diagram.currentTool.doCancel();
          }

        myDiagram.groupTemplate =
        $(go.Group, "Auto",
          { // define the group's internal layout
            layout: $(go.TreeLayout,
                      { angle: 90, arrangement: go.TreeLayout.ArrangementHorizontal, isRealtime: false }),
            // the group begins unexpanded;
            // upon expansion, a Diagram Listener will generate contents for the group
            isSubGraphExpanded: false,
            // when a group is expanded, if it contains no parts, generate a subGraph inside of it
            subGraphExpandedChanged: function(group) {
              if (group.memberParts.count === 0) {
                //randomGroup(group.data.key);
              }
            }
          },
          $(go.Shape, "RoundedRectangle",
            { fill: null, stroke: "gray", strokeWidth: 2 }),
          $(go.Panel, "Vertical",
            { defaultAlignment: go.Spot.Left, margin: 4 },
            $(go.Panel, "Horizontal",
              { defaultAlignment: go.Spot.Top },
              // the SubGraphExpanderButton is a panel that functions as a button to expand or collapse the subGraph
              $("SubGraphExpanderButton"),
              $(go.TextBlock,
                { font: "Bold 18px Sans-Serif", margin: 4 },
                new go.Binding("text", "text"))
            ),
            // create a placeholder to represent the area where the contents of the group are
            $(go.Placeholder,
              { padding: new go.Margin(0, 10) })
          ) 
        ); // end Group


          //Links organization, keep links from crossing over nodes
          myDiagram.linkTemplate =
          $(go.Link,
            { routing: go.Link.AvoidsNodes, corner: 5,
            curve: go.Link.JumpGap },
            $(go.Shape),
            $(go.Shape, { toArrow: "Standard" })
            );




        // whenever a GoJS transaction has finished modifying the model, update all Angular bindings
        function updateAngular(e) {
          if (e.isTransactionFinished) scope.$apply();
        }



        // notice when the value of "model" changes: update the Diagram.model
      /*   scope.$watch("model", function(var newmodel) {
          var oldmodel = diagram.model;
          if (oldmodel !== newmodel) {
            if (oldmodel) oldmodel.removeChangedListener(updateAngular);
            newmodel.addChangedListener(updateAngular);
            diagram.model = newmodel;
          }
        }); */
        // update the model when the selection changes
      myDiagram.nodeTemplate =
      $(go.Node, go.Panel.Auto,
        {
          // highlight when dragging over a Node that is inside a Group
          mouseDragEnter: function(e, nod, prev) { highlightGroup(e, nod.containingGroup, true); },
          mouseDragLeave: function(e, nod, next) { highlightGroup(e, nod.containingGroup, false); },
          // dropping on a Node is the same as dropping on its containing Group, if any
          mouseDrop: function(e, nod) { finishDrop(e, nod.containingGroup); }
        },
        $(go.Shape, "RoundedRectangle",
          { fill: "#ACE600", stroke: "#558000", strokeWidth: 2 },
          new go.Binding("fill", "color")),
        $(go.TextBlock,
          {   margin: 5, editable: true,
          font: "bold 13px sans-serif",
          stroke: "#446700"
          },
          new go.Binding("text", "text").makeTwoWay())
      );

     
      // Link components to diagram
      myDiagram.model = new go.GraphLinksModel(
          components,
          graph.edges
      );
    
      myDiagram.model.selectedNodeData = null;


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