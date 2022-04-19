import * as angular from 'angular';
import {ElementObject} from "./mms";
import ITreeNode = AngularUITree.ITreeNode;

export interface TreeBranch extends ITreeNode {
    label: string
    type: string
    data: ElementObject
    children: TreeBranch[]
    level?: number
    new?: string
    loading?: boolean
    aggr?: string
    propertyId?: string,
    parent_uid?: string
    uid?: string
    viewId?: string
    selected?: boolean
    expanded?: boolean;
    expandable?: boolean;
    onSelect?: string
}

export interface TreeRow {
    branch: TreeBranch
    children: TreeBranch[]
    expand_icon: string
    label: string
    level: number
    section: string
    type_icon: string
    visible: boolean
}

export interface VeTreeNodeScope extends AngularUITree.ITreeNodeScope {
    node: TreeBranch
}

export interface View2NodeMap {
    [key:string]: TreeBranch
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

    interface IDroppedCallback {
        (eventInfo: IEventInfo): void;
    }

    interface ICallbacks {
        accept?: IAcceptCallback;
        dragStart?: IDroppedCallback;
        dropped?: IDroppedCallback;
    }

    /**
     * Internal representation of node in the UI
     */
    interface ITreeNodeScope extends angular.IScope {
        $element: angular.IRootElementService;
        $modelValue: any; // Model value for node;
        $parentNodeScope: IParentTreeNodeScope[]; // uiTreeNode Scope of parent node;
        $childNodesScope: ITreeNodeScope[]; // uiTreeNodes Scope of child nodes.
        $parentNodesScope: angular.IScope// uiTreeNodes Scope of parent nodes.
        $treeScope: angular.IScope; // uiTree scope
        $handleScope: angular.IScope; // it's handle scope
        $type: 'uiTreeNode';
        node: ITreeNode;
    }

    interface IParentTreeNodeScope extends ITreeNodeScope {
        isParent(nodeScope: ITreeNodeScope): boolean;
    }

    /**
     * Node in list
     */
    interface ITreeNode {}

    interface ITreeNodeExample extends ITreeNode {
        id: number | string;
        nodes: ITreeNodeExample[];
        title: string;
    }
}
