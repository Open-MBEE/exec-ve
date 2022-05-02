import angular from "angular";
import {ElementObject} from "../../ve-utils/types/mms";
import {UtilController} from "../../ve-core/utilities/utils";
import {VeEditorApi} from "../../ve-core/editor/CKEditor.service";
import {ButtonBarApi} from "../../ve-core/button-bar/ButtonBar.service";
import {ToolbarApi} from "./services/Toolbar.api";
import {StateService} from "@uirouter/angularjs";
import {ExtensionService} from "../utilities/Extension.service";

export interface TButton {
    id: string,
    icon: string,
    tooltip: string,
    category: string,
    icon_original?: string,
    selected?: boolean
    active?: boolean
    permission?: boolean
    spinner?: boolean
    dynamic?: boolean,
    onClick?: buttonOnClickFn,
    dynamic_ids?: string[],
    dynamic_buttons?: TButton[],
    disabledFor?: string[]
    enabledFor?: string[]
}

export interface buttonOnClickFn {
    (button?: TButton):void
}

export interface toolbarInitFn {
    (api: ToolbarApi, ctrl: { $state: StateService, extensionSvc: ExtensionService } & angular.IComponentController): void
}

export interface ContentToolController extends angular.IComponentController, UtilController {
    $scope: ContentToolScope
    mmsElementId: string
    commitId: string
    contentType: string
    edit: ElementObject
    element: ElementObject
    isEditing: boolean
    inPreviewMode: boolean
    skipBroadcast: boolean
    editValues: any[]
    values?: any[]
    addValueTypes?: object
    addValueType?: string
    //Functions
    editApi?: VeEditorApi,
    addValue?(type: string): void,
    removeVal?(i: number): void

}

export interface ContentToolScope extends angular.pane.IPaneScope {
    $ctrl?: ContentToolController
    $parent: ContentToolScope
}



