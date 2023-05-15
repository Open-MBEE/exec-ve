import { VNode, VPatch } from 'virtual-dom';

export interface HtmlRenderedDiff {
    generateDiff(originalHtml, modifiedHtml): string;
    _findNode(nodeToFind, sourceNode): boolean | { at: number; foundIn: any };
    _deepCopyProperties(fromHere: unknown, toHere: unknown): boolean;
    _containsAllowedProps(properties: { attributes?: { [key: string]: string }; [key: string]: unknown }): boolean;
    _hasFurtherChanges(nodeToPatch: VNode, allNodesRequiredToPatch: VNode[]);
    _getNodesNeedPatching(patches: VPatch[]): VNode[];
    _applyVNodePatch(virtualPatch: VPatch, originalTree): void;
    _applyVTextPatch(virtualPatch, originalTree): void;
    _applyInsertPatch(virtualPatch: VPatch): void;
    _applyRemovePatch(virtualPatch: VPatch, sourceNode: VNode): void;
    _applyVPropsPatch(virtualPatch, originalTree, allNodesRequiredToPatch): void;
}
