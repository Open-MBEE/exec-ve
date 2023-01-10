export interface HtmlRenderedDiff {
    generateDiff(originalHtml, modifiedHtml): string
    _findNode(nodeToFind, sourceNode): boolean | { at: number; foundIn: any }
    _deepCopyProperties: deepCopyProperties
    _containsAllowedProps: containsAllowedProps
    _hasFurtherChanges: hasFurtherChanges
    _getNodesNeedPatching: getNodesNeedPatching
    _applyVNodePatch: applyVNodePatch
    _applyVTextPatch: applyVTextPatch
    _applyInsertPatch: applyInsertPatch
    _applyRemovePatch: applyRemovePatch
    _applyVPropsPatch: applyVPropsPatch
}
