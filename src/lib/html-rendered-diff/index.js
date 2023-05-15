(function () {
    const TextDiff = require('diff/lib/diff/word');
    const VirtualDomDiff = require('virtual-dom/diff');
    const VirtualText = require('virtual-dom/vnode/vtext');
    const VirtualNode = require('virtual-dom/vnode/vnode');
    const IsVNode = require('virtual-dom/vnode/is-vnode');
    const IsVText = require('virtual-dom/vnode/is-vtext');
    const VPATCH = require('virtual-dom/vnode/vpatch');
    const ToHtml = require('vdom-to-html');
    const ToVNode = require('@openmbee/html-to-vdom')({
        VNode: VirtualNode,
        VText: VirtualText,
    });

    let api = {
        generateDiff: generateDiff,
        _findNode: findNode,
        _deepCopyProperties: deepCopyProperties,
        _containsAllowedProps: containsAllowedProps,
        _hasFurtherChanges: hasFurtherChanges,
        _getNodesNeedPatching: getNodesNeedPatching,
        _applyVNodePatch: applyVNodePatch,
        _applyVTextPatch: applyVTextPatch,
        _applyInsertPatch: applyInsertPatch,
        _applyRemovePatch: applyRemovePatch,
        _applyVPropsPatch: applyVPropsPatch,
    };

    if (typeof window !== 'undefined') {
        window.HtmlRenderedDiff = api;
    }

    if (typeof module !== 'undefined') {
        module.exports = api;
    }

    let allNodesRequiredToPatch = [];

    /**
     * Patches is an object with this format {'a': original tree, 0: virtualPatch or [virtualPatch..], 1: virtualPatch or [VirtualPatch...]}
     * The key in Patches Object (besides 'a') represents the location of the affected node(VirtualText|VirtualNode) in the original tree
     * if we were to flatten the tree and all its descendants. In most cases, each key is mapped only to a VirtualPatch object except for
     * a case where there is a Prop Patch followed immediately by an Insert Patch at one level lower (Ex: <div class="a"></div> vs <div class="b">text|Node</div>)
     * There are types of patch:
     *  1. VNODE: happens when we need to replace a VirtualText|VirtualNode (from the original tree) with a VirtualNode (from the new tree)
     *  2. VTEXT: happens when we need to replace a VirtualText|VirtualNode (from the original tree) with a VirtualText (from the new tree)
     *          - There is a special case when we try to replace a VirtualText instead of VirtualNode. In such case, instead of replace it completely,
     *          we use text-diff algorithm to generate a diff between both VirtualText
     *  3. INSERT: happens when we need to insert a new VirtualText|VirtualNode (from the new tree) into the original tree
     *  4. REMOVE: happens when we need to remove a VirtualText|VirtualNode (from the original tree)
     *  5. PROPS: happens when there are changes in a VirtualNode properties including html attributes(class..), style, src, href... etc
     *          - In all cases, we would apply the new properties to the VirtualNode(from the original tree) so that it matches the VirtualNode(from the new tree)
     *          - We only show the differences ( by displaying both the old and the new VirtualNode ) if and only if:
     *              1. there are no further changes under this VirtualNodes
     *              2. if the changes in properties include the one we care about ( class, style, src, and href )
     * **/
    function patcher(patches) {
        if (!patches) {
            return;
        }

        let listOfPatches = getAllPatches(patches);
        allNodesRequiredToPatch = getNodesNeedPatching(listOfPatches);
        let originalTree = patches['a'];
        listOfPatches.forEach((virtualPatch) => {
            switch (virtualPatch.type) {
                case VPATCH.VNODE:
                    applyVNodePatch(virtualPatch, originalTree);
                    break;
                case VPATCH.PROPS:
                    applyVPropsPatch(virtualPatch, originalTree, allNodesRequiredToPatch);
                    break;
                case VPATCH.VTEXT:
                    applyVTextPatch(virtualPatch, originalTree);
                    break;
                case VPATCH.INSERT:
                    applyInsertPatch(virtualPatch);
                    break;
                case VPATCH.REMOVE:
                    applyRemovePatch(virtualPatch, originalTree);
                    break;
            }
        });
        return originalTree;
    }

    /** VirtualNode Patch ( against another VirtualNode|VirtualText )  **/
    function applyVNodePatch(virtualPatch, originalTree) {
        let nodeToAdd = virtualPatch.patch; // this must be a VirtualNode
        let nodeToRemove = virtualPatch.vNode; // this can be a VirtualNode or a VirtualText
        let found = findNode(nodeToRemove, originalTree);
        if (found) {
            let wrapNodeToAdd = new VirtualNode('SPAN', { attributes: { class: 'patcher-replace-in' } }, [nodeToAdd]);
            let wrapNodeToRemove = new VirtualNode('SPAN', { attributes: { class: 'patcher-replace-out' } }, [
                nodeToRemove,
            ]);
            found.foundIn.splice(found.at, 1, wrapNodeToAdd);
            found.foundIn.splice(found.at, 0, wrapNodeToRemove);
        } else {
            console.log('Applying VNodePatch. This case is not possible');
        }
    }

    /** VirtualText Patch (against another VirtualNode|VirtualText **/
    function applyVTextPatch(virtualPatch, originalTree) {
        let nodeToAdd = virtualPatch.patch;
        let nodeToRemove = virtualPatch.vNode;
        let found = findNode(nodeToRemove, originalTree);
        if (found) {
            if (IsVNode(nodeToRemove)) {
                let wrapNodeToAdd = createWrapper('SPAN', 'patcher-replace-in', [nodeToAdd]);
                let wrapNodeToRemove = createWrapper('SPAN', 'patcher-replace-out', [nodeToRemove]);
                found.foundIn.splice(found.at, 1, wrapNodeToAdd);
                found.foundIn.splice(found.at, 0, wrapNodeToRemove);
            } else if (IsVText(nodeToRemove)) {
                // text-diff
                let diffResults = TextDiff.diffWords(nodeToRemove.text, nodeToAdd.text);
                if (diffResults.length > 0) {
                    let childNodes = [];
                    diffResults.forEach((result) => {
                        let className = result.added
                            ? 'patcher-text-insertion'
                            : result.removed
                            ? 'patcher-text-deletion'
                            : 'patcher-text-same';
                        childNodes.push(createWrapper('SPAN', className, [new VirtualText(result.value)]));
                    });

                    let topWrapper = createWrapper('SPAN', 'patcher-text-diff', childNodes);
                    found.foundIn.splice(found.at, 1, topWrapper);
                }
            }
        } else {
            console.log('applying VTextPatch. This case is not possible 2');
        }
    }

    /** VirtualProps Patch **/
    function applyVPropsPatch(virtualPatch, originalTree, allNodesRequiredToPatch) {
        let nodeToPatch = virtualPatch.vNode;
        let patchProperties = virtualPatch.patch;
        applyVPropPatchHelper(nodeToPatch, patchProperties, originalTree, allNodesRequiredToPatch);
    }

    /** Helper function for applying property updates to VirtualNode. Only generate wrapper node to show
     * diff if an only if there are no other patches for nodeToPatch or its descendants **/
    function applyVPropPatchHelper(nodeToPatch, patchProperties, originalTree, allNodesRequiredToPatch) {
        const containPropWeCare = containsAllowedProps(patchProperties);
        const affectedByOtherPatches = hasFurtherChanges(nodeToPatch, allNodesRequiredToPatch);
        if (containPropWeCare && !affectedByOtherPatches) {
            let cloneOfNodeToPatch = new VirtualNode(nodeToPatch.tagName, {}, nodeToPatch.children);
            deepCopyProperties(nodeToPatch.properties, cloneOfNodeToPatch.properties);
            deepCopyProperties(patchProperties, nodeToPatch.properties);

            let wrapBefore = createWrapper('SPAN', 'patcher-attribute-replace-out', [cloneOfNodeToPatch]);
            let wrapAfter = createWrapper('SPAN', 'patcher-attribute-replace-in', [nodeToPatch]);
            let found = findNode(nodeToPatch, originalTree);
            if (found) {
                // add it
                let foundIn = found.foundIn;
                let at = found.at;
                foundIn.splice(at, 1, wrapAfter);
                foundIn.splice(at, 0, wrapBefore);
            } else {
                console.log('Applying prop patch. This is not possible');
            }
        } else {
            // just need to apply property changes
            deepCopyProperties(patchProperties, nodeToPatch.properties);
        }
    }

    /** Insert Patch. We are only gonna wrap if nodeToInsert is a VText to avoid issue with table  **/
    function applyInsertPatch(virtualPatch) {
        let nodeToInsert = virtualPatch.patch;
        let whereToInsert = virtualPatch.vNode;
        if (IsVText(nodeToInsert)) {
            whereToInsert.children.push(
                new VirtualNode('SPAN', { attributes: { class: 'patcher-insert' } }, [nodeToInsert])
            );
        } else if (IsVNode(nodeToInsert)) {
            if (nodeToInsert.properties.attributes && nodeToInsert.properties.attributes.class) {
                nodeToInsert.properties.attributes.class += ' patcher-insert';
            } else {
                nodeToInsert.properties.attributes.class = 'patcher-insert';
            }
            whereToInsert.children.push(nodeToInsert);
        }
    }

    /** Remove this from sourceNode. We are only gonna wrap if nodeToInsert is a VText to avoid issue with table  **/
    function applyRemovePatch(virtualPatch, sourceNode) {
        let nodeToDelete = virtualPatch.vNode;
        let found = findNode(nodeToDelete, sourceNode);
        if (found) {
            if (IsVText(nodeToDelete)) {
                let wrapDeleteNode = new VirtualNode('SPAN', { attributes: { class: 'patcher-delete' } }, [
                    nodeToDelete,
                ]);
                found.foundIn.splice(found.at, 1, wrapDeleteNode);
            } else {
                if (nodeToDelete.properties.attributes && nodeToDelete.properties.attributes.class) {
                    nodeToDelete.properties.attributes.class += ' patcher-delete';
                } else {
                    nodeToDelete.properties.attributes.class = 'patcher-delete';
                }
                found.foundIn.splice(found.at, 1, nodeToDelete);
            }
        }
    }

    /** Look for a nodeToFind in sourceNode.
     *      nodeToFind: can be a VirtualText or a VirtualNode
     *      sourceNode: must be a VirtualNode
     *      Return false if not found.
     *      Return {foundIn: array of where nodeToFind is in, at: index in that array}
     * **/
    function findNode(nodeToFind, sourceNode) {
        if ((!IsVNode(nodeToFind) && !IsVText(nodeToFind)) || !IsVNode(sourceNode)) {
            return false;
        }
        return helper(nodeToFind, sourceNode);

        function helper(nodeToFind, sourceNode) {
            if (IsVText(sourceNode)) {
                return false;
            }
            let children = sourceNode.children;
            // Look at child level
            for (let i = 0; i < children.length; i++) {
                let childNode = children[i];
                if (nodeToFind === childNode) {
                    return { foundIn: children, at: i };
                }
            }

            // look at descendants
            for (let i = 0; i < children.length; i++) {
                let childNode = children[i];
                let found = helper(nodeToFind, childNode);
                if (found) {
                    return found;
                }
            }
            return false;
        }
    }

    /** Deep copy properties
     *      fromHere: copy from here
     *      toHere: copy to here
     *      Return true, if successful. False if either parameter is not an object
     * **/
    function deepCopyProperties(fromHere, toHere) {
        if (typeof fromHere !== 'object' || typeof toHere !== 'object' || fromHere === null || toHere === null) {
            return false;
        }
        Object.entries(fromHere).forEach((entry) => {
            let key = entry[0];
            let value = entry[1];
            if (typeof value === 'string') {
                toHere[key] = value;
            } else if (typeof value === 'object') {
                toHere[key] = {};
                deepCopyProperties(value, toHere[key]);
            }
        });
        return true;
    }

    /** Only the following properties should be considered during attribute diffing
     *      properties: must be an object
     *      Return false if "properties" is not an object.
     *      Return true if "properties" contains at least one of the following properties
     *      (style, src, href, class (under attributes)
     * **/
    function containsAllowedProps(properties) {
        if (properties === null || typeof properties !== 'object') {
            return false;
        }
        return Object.entries(properties).some((property) => {
            let key = property[0];
            let value = property[1];
            if (typeof value === 'string') {
                return key === 'style' || key === 'src' || key === 'href';
            } else if (typeof value === 'object' && key === 'attributes') {
                return 'class' in properties.attributes;
            }
        });
    }

    /** No further changes if nodeToPatch doesn't have children or if non of its descendants are affected by other patches
     *      Return false, if there are more patches for nodeToPatch or at least on one of it descendants
     *      Return true, if either nodeToPatch is not a VirtualNode or there is no more patches
     * **/
    function hasFurtherChanges(nodeToPatch, allNodesRequiredToPatch) {
        if (!IsVNode(nodeToPatch) || nodeToPatch.children.length === 0 || allNodesRequiredToPatch.length === 0) {
            return false;
        }
        return helper(nodeToPatch);

        function helper(nodeToPatch) {
            if (IsVText(nodeToPatch)) {
                return false;
            }
            // check at child level
            let isAffected = nodeToPatch.children.some((childNode) => {
                let isAffected = allNodesRequiredToPatch.some((nodeNeedPatching) => {
                    return nodeNeedPatching === childNode;
                });
                if (isAffected) {
                    return true;
                }
            });

            if (isAffected) {
                return true;
            }
            // check at next level
            isAffected = nodeToPatch.children.some((childNode) => {
                let isAffected = helper(childNode);
                if (isAffected) {
                    return true;
                }
            });
            return isAffected;
        }
    }

    /**
     * Extra patch object
     */
    function getAllPatches(patches) {
        if (!patches || typeof patches !== 'object') {
            return [];
        }
        let results = [];
        Object.entries(patches)
            .filter((entry) => {
                return entry[0] !== 'a';
            })
            .forEach((entry) => {
                let virtualPatch = entry[1]; // this could be an array (case where propPatch follow by multiple insertion patches
                if (virtualPatch.constructor === Array) {
                    virtualPatch.forEach((patch) => {
                        results.push(patch);
                    });
                } else {
                    results.push(virtualPatch);
                }
            });
        return results;
    }

    /** Return a list of Nodes that need patching
     *      patches: an object containing all the patches {index: []/{}}
     * **/
    function getNodesNeedPatching(patches) {
        return patches.map((patch) => {
            return patch.vNode;
        });
    }

    /** Wrap VirtualNode|VirtualText **/
    function createWrapper(tagName, className, children) {
        return new VirtualNode(tagName, { attributes: { class: className } }, children);
    }

    function generateDiff(originalHtml, modifiedHtml) {
        // we need to wrap both parameter in a the same tag to avoid change at the root level
        originalHtml = '<span>' + originalHtml + '</span>';
        modifiedHtml = '<span>' + modifiedHtml + '</span>';
        let patches = VirtualDomDiff(ToVNode(originalHtml), ToVNode(modifiedHtml));
        let result = patcher(patches);
        return ToHtml(result);
    }
})();
