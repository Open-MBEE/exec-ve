import angular from 'angular'

import { veApp } from '@ve-app'

import { ElementObject } from '@ve-types/mms'

veApp.controller('ReorderGroupCtrl', [
    '$scope',
    '$stateParams',
    '$state',
    'growl',
    'ElementService',
    'CacheService',
    'TreeService',
    'projectOb',
    'refOb',
    'groupObs',
    'documentObs',

    function (
        $scope,
        $stateParams,
        $state,
        $window,
        growl,
        ElementService,
        CacheService,
        TreeService,
        projectOb,
        refOb,
        groupObs,
        documentObs
    ) {
        const _ = $window._
        $scope.isSaving = false
        $scope.targetId = ''
        $scope.treeOptions = {
            dropped: function (change) {
                sortRecursively(children)
                $scope.targetId = ''
            },
            accept: function (sourceNodeScope, destNodeScope, destIndex) {
                // allow moving to the root or to a group
                const accept =
                    destNodeScope.node &&
                    (destNodeScope.node.type === 'group' ||
                        destNodeScope.node.type === 'root')
                if (accept) {
                    if (
                        destNodeScope.$nodeScope &&
                        destNodeScope.$nodeScope.$modelValue &&
                        destNodeScope.$nodeScope.$modelValue.id
                    ) {
                        $scope.targetId =
                            destNodeScope.$nodeScope.$modelValue.id
                    }
                }
                return accept
            },
            dragStart: function (data) {
                $scope.targetId = data.dest.nodesScope.$nodeScope.$modelValue.id
            },
        }
        $scope.saveReorder = saveReorder
        $scope.cancelReorder = cancelReorder

        var children = generateTree()
        sortRecursively(children)
        const root = createNode('Top Level', 'root', children, { id: 'root' })
        $scope.tree = [root]

        function generateTree() {
            // create a node for each groupOb
            let tree = groupObs.map(function (groupOb) {
                return createNode(groupOb.name, 'group', [], groupOb)
            })

            // add document to its group
            documentObs
                .filter(function (documentOb) {
                    return documentOb._groupId
                })
                .forEach(function (documentOb) {
                    const parent = _.find(tree, function (node) {
                        return node.data.id === documentOb._groupId
                    })
                    if (parent) {
                        parent.children.push(
                            createNode(documentOb.name, 'view', [], documentOb)
                        )
                    }
                })

            // for any group that has a parent group, establish that connection
            tree.forEach(function (groupNode) {
                const foundParent = _.find(tree, function (node) {
                    return node.data.id === groupNode.data._parentId
                })
                if (foundParent) {
                    groupNode.isChild = true
                    foundParent.children.push(groupNode)
                }
                return groupNode
            })

            // only groups that don't have parents show up at root level
            tree = tree.filter(function (groupNode) {
                return !groupNode.isChild
            })

            // add all the documents that don't belong to any group
            documentObs
                .filter(function (documentOb) {
                    return !documentOb._groupId
                })
                .forEach(function (documentOb) {
                    tree.push(
                        createNode(documentOb.name, 'view', [], documentOb)
                    )
                })
            return tree
        }

        function createNode(name, type, children, data) {
            return {
                name: name,
                type: type,
                children: children,
                data: data,
                id: data.id,
            }
        }

        function cancelReorder() {
            navigateAway(false)
        }

        function saveReorder() {
            if (!$scope.isSaving) {
                $scope.isSaving = true
                const results: any[] = []
                findNodesToUpdate(results)
                const elementsToUpdate: ElementObject[] = results.map(
                    (result) => {
                        return {
                            id: result.node.data.id,
                            ownerId: result.newOwnerId,
                            _projectId: projectOb.id,
                            _refId: refOb.id,
                            type: result.node.data.type,
                        }
                    }
                )
                ElementService.updateElements(elementsToUpdate, false)
                    .then(function () {
                        cleanupCache(results)
                        navigateAway(true)
                    })
                    .catch(function () {
                        growl.error('Failed to save the grouping!')
                    })
                    .finally(function () {
                        $scope.isSaving = false
                    })
            } else {
                growl.info('please wait')
            }
        }

        function findNodesToUpdate(result) {
            // ignore root
            const root = $scope.tree[0]
            root.children.forEach(function (node) {
                // handle node change at the root level
                if (
                    (node.type === 'group' && node.data._parentId) ||
                    (node.type === 'view' && node.data._groupId)
                ) {
                    result.push({
                        node: node,
                        newOwnerId: 'holding_bin_' + projectOb.id,
                    })
                }

                // handle change at lower level
                helper(node, result)
            })

            function helper(node, result) {
                node.children.forEach(function (childNode) {
                    if (
                        (childNode.type === 'group' &&
                            childNode.data._parentId !== node.data.id) ||
                        (childNode.type === 'view' &&
                            childNode.data._groupId !== node.data.id)
                    ) {
                        result.push({
                            node: childNode,
                            newOwnerId: node.data.id,
                        })
                    }
                    helper(childNode, result)
                })
            }
        }

        function cleanupCache(results) {
            // update cache for documents list and groups list
            const listOfDocInCache = CacheService.get([
                'documents',
                projectOb.id,
                refOb.id,
            ])
            const listOfGroupInCache = CacheService.get([
                'groups',
                projectOb.id,
                refOb.id,
            ])
            results.forEach(function (result) {
                // for group or document that is moved to the root, _parentId for "group" and _groupId for "document" need to be set to undefined
                const newOwnerId =
                    result.newOwnerId.indexOf(projectOb.id) !== -1
                        ? undefined
                        : result.newOwnerId

                if (result.node.type === 'group') {
                    const cacheGroupOb = _.find(
                        listOfGroupInCache,
                        function (groupOb) {
                            return groupOb.id === result.node.data.id
                        }
                    )
                    if (cacheGroupOb) {
                        cacheGroupOb._parentId = newOwnerId
                    }
                } else if (result.node.type === 'view') {
                    const cacheDocument = _.find(
                        listOfDocInCache,
                        function (documentOb) {
                            return documentOb.id === result.node.data.id
                        }
                    )
                    if (cacheDocument) {
                        cacheDocument._groupId = newOwnerId
                    }
                }
            })
        }

        function comparator(a, b) {
            if (a.type === b.type) {
                return a.name.localeCompare(b.name)
            } else {
                if (a.type === 'group') {
                    return -1
                } else {
                    return 1
                }
            }
        }

        function sortRecursively(nodes) {
            nodes.sort(comparator)
            nodes.forEach(function (node) {
                sortRecursively(node.children)
            })
        }

        function navigateAway(reload) {
            const curBranch = TreeService.getApi().getSelectedBranch()
            if (curBranch) {
                const documentId =
                    curBranch.type === 'group'
                        ? 'site_' + curBranch.data.id + '_cover'
                        : curBranch.data.id
                $state.go(
                    'main.project.ref.preview',
                    { documentId: documentId },
                    { reload: reload }
                )
            } else {
                $state.go('main.project.ref', {}, { reload: reload })
            }
        }
    },
])
