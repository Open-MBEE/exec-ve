import angular from 'angular';

import ITreeNode = AngularUITree.ITreeNode;

import { ElementObject, ElementsRequest, ViewObject } from '@ve-types/mms';

/**
 * @typedef TreeBranch
 */
export interface TreeBranch extends ITreeNode {
    label: string;
    type: string;
    priority?: number;
    group?: ElementObject;
    data: ViewObject;
    children: TreeBranch[];
    hide?: boolean;
    level?: number;
    new?: string;
    loading?: boolean;
    aggr?: string;
    propertyId?: string;
    parent_uid?: string;
    uid?: string;
    viewId?: string;
    selected?: boolean;
    expanded?: boolean;
    expandable?: boolean;
    favorite?: boolean;
    onSelect?(branch: TreeBranch): void;
    onDblClick?(branch: TreeBranch): void;
}

export interface TreeRow {
    branch: TreeBranch;
    children: TreeBranch[];
    visibleChild: boolean;
    label: string;
    level: number;
    section: string;
    typeIcon: string;
    visible: boolean;
}

export interface TreeApi extends ElementsRequest<string> {
    rootId?: string;
    refType: string;
    sectionNumbering?: boolean;
    numberingDepth?: number;
    numberingSeparator?: string;
    expandLevel?: number;
    search?: string;
    sort?: boolean;
    startChapter?: number;
    treeContentLoading?: boolean;
    treeCategory?: string;
    expandCallback?(elementId: string, branch: TreeBranch, recurse: boolean);
    onSelect?(branch: TreeBranch): void;
    onDblClick?(branch: TreeBranch): void;
}

export interface TreeConfig {
    id: string;
    title?: string;
    icon?: string;
    types?: string[];
    treeData?: TreeBranch[];
    treeRows?: TreeRow[];
}

export interface TreeIcons {
    iconExpand: string;
    iconCollapse: string;
    iconDefault: string;
}

export interface VeTreeNodeScope extends AngularUITree.ITreeNodeScope {
    node: TreeBranch;
}

export interface View2NodeMap {
    [key: string]: TreeBranch;
}

declare namespace AngularUITree {
    interface IEventSourceInfo {
        cloneModel: any;
        index: number;
        nodeScope: ITreeNodeScope;
        nodesScope: ITreeNodeScope;
    }

    interface IPosition {
        dirAx: number;
        dirX: number;
        dirY: number;
        distAxX: number;
        distAxY: number;
        distX: number;
        distY: number;
        lastDirX: number;
        lastDirY: number;
        lastX: number;
        lastY: number;
        moving: boolean;
        nowX: number;
        nowY: number;
        offsetX: number;
        offsetY: number;
        startX: number;
        startY: number;
    }

    interface IEventInfo {
        dest: {
            index: number;
            nodesScope: IParentTreeNodeScope;
        };
        elements: any;
        pos: IPosition;
        source: IEventSourceInfo;
    }

    interface IAcceptCallback {
        (source: ITreeNodeScope, destination: ITreeNodeScope, destinationIndex: number): boolean;
    }

    interface IDragCallback {
        (eventInfo: IEventInfo): void;
    }

    interface ICallbacks {
        accept?: IAcceptCallback;
        dragStart?: IDragCallback;
        dropped?: IDragCallback;
        dragStop?: IDragCallback;
    }

    /**
     * Internal representation of node in the UI
     */
    interface ITreeNodeScope extends angular.IScope {
        $element: JQuery<HTMLElement>;
        $modelValue: any; // Model value for node;
        $nodeScope: ITreeNodeScope; // uiTreeNode Scope of this node
        $parentNodeScope: IParentTreeNodeScope[]; // uiTreeNode Scope of parent node;
        $childNodesScope: ITreeNodeScope[]; // uiTreeNodes Scope of child nodes.
        $parentNodesScope: angular.IScope; // uiTreeNodes Scope of parent nodes.
        $treeScope: angular.IScope; // uiTree scope
        $handleScope: angular.IScope; // it's handle scope
        $type: 'uiTreeNode';
        node: ITreeNode;
    }

    interface IParentTreeNodeScope extends ITreeNodeScope {
        isParent(nodeScope: ITreeNodeScope): boolean;
    }

    // /**
    //  * Node in list
    //  */
    // interface ITreeNode {}
    //
    // interface ITreeNodeExample extends ITreeNode {
    //     id: number | string
    //     nodes: ITreeNodeExample[]
    //     title: string
    // }
}
