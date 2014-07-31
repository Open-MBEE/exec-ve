'use strict';

angular.module('mms.directives.diff')
.directive('mmsDiffTree', ['$templateCache', 'DiffService', mmsDiffTree]);

function mmsDiffTree($templateCache, DiffService) {
  
  var MMSDiffTreeController = function($scope) {
    // Diff the two workspaces picked in the Workspace Picker
    var response = DiffService.diff('ws1', 'ws2');
    var originals = response.workspace1.elements;
    var deltas = response.workspace2;

var diff = {
    "workspace1":{
        "elements":[
            {
                "documentation":"Lorem ipsum dolor set amit.",
                "sysmlid":"_123_394241_12",
                "name":"",
                "owner":"Lunch",
                "specialization":{
                    "type":"Property",
                    "isDerived":"false",
                    "value":[
                        {
                            "type":"LiteralString",
                            "string":"binada_string"                                
                        }                           
                    ]                              
                }                 
            },
            {
                "documentation":"Bacon ipsum pork set amit.",
                "sysmlid":"_456_93419_14",
                "name":"Burger",
                "owner":"Lunch",
                "specialization":{
                    "type":"Property",
                    "isDerived":"false",
                    "value":[                       
                        {
                            "type":"LiteralString",
                            "string":"binada_string"                                
                        }                           
                    ]                          
                }                 
            },
            {
                "documentation":"Foobar baz foo spam.",
                "sysmlid":"_789_18919_19",
                "name":"Pad Thai",
                "owner":"Lunch",
                "specialization":{
                    "type":"Property",
                    "isDerived":"false",
                    "value":[
                        {
                            "type":"LiteralString",
                            "string":"binada_string"                                
                        }                           
                    ]                      
                }                 
            },
            {
                "documentation":"Foobar baz foo spam.",
                "sysmlid":"Lunch",
                "name":"Lunch",
                "owner":"Meals",
                "specialization":{
                    "type":"Element"              
                }                 
            },
            {
                "documentation":"Foobar baz foo spam.",
                "sysmlid":"Dinner",
                "name":"Dinner",
                "owner":"Meals",
                "specialization":{
                    "type":"Element"              
                }                 
            },
            {
                "documentation":"Foobar baz foo spam.",
                "sysmlid":"Meals",
                "name":"Meals",
                "owner":"null",
                "specialization":{
                    "type":"Package"
                }    
            }              
        ],
        "graph": [
            {
                "sysmlid": "Meals",
                "edges": ["Lunch", "Dinner"]
            },
            {
                "sysmlid": "Lunch",
                "edges": ["_123_394241_12", "_456_93419_14", "_789_18919_19"]
            },
            {
                "sysmlid": "Dinner",
                "edges": []
            }
        ]    
    },
    "workspace2":{
        "updatedElements":[
            {
                "sysmlid":"_123_394241_12",
                "name":"Skewer"                 
            }            
        ],
        "addedElements":[
            {
                "documentation":"Salad ipsum dolor set amit.",
                "sysmlid":"_192_19342_22",
                "name":"Salad",
                "owner": "Lunch",
                "specialization":{
                    "type":"Property",
                    "isDerived":"false",
                    "value":[                       
                        {
                            "type":"LiteralString",
                            "string":"binada_string"                                
                        }                           
                    ]                      
                }                 
            }            
        ],
        "deletedElements":[
            {
                "sysmlid": "_456_93419_14"
            }
        ],
        "movedElements":[
            {
                "sysmlid":"_789_18919_19",
                "owner":"Dinner"                 
            }            
        ]     
    }
};
var id2node = {};
var treeData = [];

diff.workspace1.elements.forEach(function(e) {
    var node = {};
    node.data = e;
    id2node[e.sysmlid] = node;
    node.label = e.name;
    node.type = e.specialization.type;
    node.children = [];
});
diff.workspace1.elements.forEach(function(e) {
    if (!id2node.hasOwnProperty(e.owner))
        treeData.push(id2node[e.sysmlid]);
    else
        id2node[e.owner].children.push(id2node[e.sysmlid]);
});
diff.workspace2.addedElements.forEach(function(e) {
    var node = {};
    node.data = e;
    id2node[e.sysmlid] = node;
    node.label = e.name;
    node.type = e.specialization.type;
    node.children = [];
    node.status = "added";
});
diff.workspace2.addedElements.forEach(function(e) {
    if (!id2node.hasOwnProperty(e.owner))
        treeData.push(id2node[e.sysmlid]);
    else
        id2node[e.owner].children.push(id2node[e.sysmlid]);
});
diff.workspace2.deletedElements.forEach(function(e) {
    id2node[e.sysmlid].status = "deleted";
});
diff.workspace2.updatedElements.forEach(function(e) {
    id2node[e.sysmlid].status = "updated";
});
diff.workspace2.movedElements.forEach(function(e) {
    var ws1node = id2node[e.sysmlid];
    ws1node.status = "moved";
    //id2node[e.owner].children.push(ws1node);
});

var options = {
    types: {
        "Element": "fa fa-square",
        "Property": "fa fa-circle",
        "View": "fa fa-square",
        "Dependency": "fa fa-long-arrow-right",
        "DirectedRelationship": "fa fa-long-arrow-right",
        "Generalization": "fa fa-chevron-right",
        "Package": "fa fa-folder",
        "Connector": "fa fa-expand"
    },
    statuses: {
        "moved": "",
        "added": "",
        "deleted": "",
        "updated": "",
        "conflict": "",
        "resolved": ""
    }
};
$scope.treeData = treeData;
$scope.options = options;

    // Populate the left pane containment tree
    $scope.elementNames = [];
    angular.forEach(originals, function(value, key) {
      $scope.elementNames.push(value.name);
    });

    // Proxy function called with ngClick in template
    $scope.loadTableWithElement = function(element) {
      DiffService.loadTableWithElement(element);
    };
  };

  var MMSDiffTreeTemplate = $templateCache.get('mms/templates/mmsDiffTree.html');

  return {
    restrict: 'E',
    template: MMSDiffTreeTemplate,
    controller: ['$scope', MMSDiffTreeController]
  };
}