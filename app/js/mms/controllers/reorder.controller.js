'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ReorderCtrl', ['$scope', '$rootScope', '$stateParams', 'document', 'time', 'ElementService', 'ViewService', '$state', 'growl', '$q', '_',
function($scope, $rootScope, $stateParams, document, time, ElementService, ViewService, $state, growl, $q, _) {
    $scope.doc = document;
    var ws = $stateParams.workspace;
    ElementService.isCacheOutdated(document.sysmlid, ws)
    .then(function(status) {
        if (status.status) {
            if (!angular.equals(document.specialization.view2view, status.server.specialization.view2view)) {
                growl.error('The document hierarchy is outdated, refresh the page first!');
            } 
        } 
    }, function(reason) {
        growl.error('Checking if document hierarchy is up to date failed: ' + reason.message);
    });
    var viewIds2node = {};
    viewIds2node[document.sysmlid] = {
        name: document.name,
        id: document.sysmlid,
        aggr: 'COMPOSITE',
        children: []
    };
    var up2dateViews = null;

    var updateNumber = function(node, curSection, key) {
        node[key] = curSection;
        var num = 1;
        node.children.forEach(function(cnode) {
            updateNumber(cnode, curSection + '.' + num, key);
            num++;
        });
    };

    $scope.treeOptions = {
        dropped : function() {
            $scope.tree.forEach(function(root) {
                root.new = '';
                var num = 1;
                root.children.forEach(function(node) {
                    updateNumber(node, num + '', 'new');
                    num++;
                });
            });
        },
        accept: function(sourceNodeScope, destNodeScope, destIndex) {
            if (destNodeScope.$element.hasClass('root'))
                return false; //don't allow moving to outside doc
            return true;
        }
    };

    function handleChildViews(v, aggr) {
        var deferred = $q.defer();
        var curNode = viewIds2node[v.sysmlid];
        if (!curNode) {
            curNode = {
                name: v.name,
                id: v.sysmlid,
                aggr: aggr,
                children: []
            };
            viewIds2node[v.sysmlid] = curNode;
        }
        var childIds = [];
        var childAggrs = [];
        if (!v.specialization.childViews || v.specialization.childViews.length === 0 || aggr === 'NONE') {
            deferred.resolve(curNode);
            return deferred.promise;
        }
        for (var i = 0; i < v.specialization.childViews.length; i++) {
            childIds.push(v.specialization.childViews[i].id);
            childAggrs.push(v.specialization.childViews[i].aggregation);
        }
        ElementService.getElements(childIds, false, ws, time, 2)
        .then(function(childViews) {
            var mapping = {};
            for (var i = 0; i < childViews.length; i++) {
                mapping[childViews[i].sysmlid] = childViews[i];
            }
            var childPromises = [];
            for (i = 0; i < childIds.length; i++) {
                var child = mapping[childIds[i]];
                if (child) //what if not found??
                    childPromises.push(handleChildViews(child, childAggrs[i]));
            }
            $q.all(childPromises).then(function(childNodes) {
                curNode.children.push.apply(curNode.children, childNodes);
                deferred.resolve(curNode);
            }, function(reason) {
                deferred.reject(reason);
            });

        }, function(reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    }

    handleChildViews(document, 'COMPOSITE')
    .then(function(docNode) {
        var num = 1;
        docNode.children.forEach(function(node) {
            updateNumber(node, num + '', 'old');
            updateNumber(node, num + '', 'new');
            num++;
        });
        $scope.tree = [docNode];
    });
    /*ViewService.getDocumentViews(document.sysmlid, false, ws, time, true, 2)
    .then(function(views) {
        up2dateViews = views;
        up2dateViews.forEach(function(view) {
            var viewTreeNode = { 
                id: view.sysmlid, 
                name: view.name, 
                children : [] 
            };
            viewIds2node[view.sysmlid] = viewTreeNode;    
        });
        document.specialization.view2view.forEach(function(view) {
            var viewId = view.id;
            view.childrenViews.forEach(function(childId) {
                if (viewIds2node[childId] && viewIds2node[viewId])
                    viewIds2node[viewId].children.push(viewIds2node[childId]);
            });
        });
        var num = 1;
        viewIds2node[document.sysmlid].children.forEach(function(node) {
            updateNumber(node, num + '', 'old');
            updateNumber(node, num + '', 'new');
            num++;
        });
        $scope.tree = [viewIds2node[document.sysmlid]];
    });*/
    $scope.saveClass = "";
    $scope.save = function() {
        $scope.saveClass = "fa fa-spin fa-spinner";
        ElementService.isCacheOutdated(document.sysmlid, ws)
        .then(function(status) {
            if (status.status) {
                if (!angular.equals(document.specialization.view2view, status.server.specialization.view2view)) {
                    growl.error('The document hierarchy is outdated, refresh the page first!');
                    $scope.saveClass = "";
                    return;
                } 
            } 

            if ($scope.tree.length > 1 || $scope.tree[0].id !== document.sysmlid) {
                growl.error('Views cannot be re-ordered outside the context of the current document.');
                $scope.saveClass = "";
                return;
            }

            var newView2View = [];
            angular.forEach(viewIds2node, function(view) {
                if ($scope.tree.indexOf(view) >= 0 && view.id !== document.sysmlid)
                    return; //allow removing views by moving them to be root
                var viewObject = {id: view.id, childrenViews: []};
                view.children.forEach(function(child) {
                    viewObject.childrenViews.push(child.id);
                });
                newView2View.push(viewObject);
            });
            var newdoc = {};
            newdoc.sysmlid = document.sysmlid;
            //newdoc.read = document.read;
            newdoc.specialization = {type: 'Product'};
            newdoc.specialization.view2view = newView2View;
            ViewService.updateDocument(newdoc, ws)
            .then(function(data) {
                growl.success('Reorder Successful');
                //document.specialization.view2view = newView2View;
                $state.go('workspace.site.document', {}, {reload:true});
            }, function(reason) {
                if (reason.status === 409) {
                    newdoc.read = reason.data.elements[0].read;
                    ViewService.updateDocument(newdoc, ws)
                    .then(function(data2) {
                        growl.success('Reorder Successful');
                        //document.specialization.view2view = newView2View;
                        $state.go('workspace.site.document', {}, {reload:true});
                    }, function(reason2) {
                        $scope.saveClass = "";
                        growl.error('Reorder Save Error: ' + reason2.message);
                    });
                } else {
                    $scope.saveClass = "";
                    growl.error('Reorder Save Error: ' + reason.message);
                }
            });
        }, function(reason) {
            growl.error('Checking if document hierarchy is up to date failed: ' + reason.message);
            $scope.saveClass = "";
        });
    };
    $scope.cancel = function() {
        var curBranch = $rootScope.mms_treeApi.get_selected_branch();
        if (!curBranch)
            $state.go('workspace.site.document', {}, {reload:true});
        else {
            var goToId = curBranch.data.sysmlid;
            if (curBranch.type === 'section')
                goToId = curBranch.view;
            $state.go('workspace.site.document.view', {view: goToId});
        }
    };
}]);