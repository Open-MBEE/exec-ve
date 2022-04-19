import angular from "angular";
import {ElementObject} from "../../ve-utils/types/mms";
import {ButtonBarApi} from "../../ve-core/button-bar/ButtonBar.service";
import {UtilController} from "../../ve-core/utilities/utils";

// element: ElementObject,
//     elementSaving: boolean,
//     bbApi?: ButtonBarApi
// editorApi?: any
// isEditing: boolean,
//     commitId: string,
//     isEnumeration: boolean,
//     recompileScope: any,
//     skipBroadcast: boolean
// edit: ElementObject,
//     inPreviewMode: boolean,
//     editValues: boolean


export interface TranscludeController extends angular.IComponentController, UtilController {
    $scope: TranscludeScope
    mmsElementId: string
    commitId: string
    cfType: string
    edit: ElementObject
    element: ElementObject
    isEditing: boolean
    inPreviewMode: boolean
    skipBroadcast: boolean
    editValues: any[]
    addValueTypes?: object
    addValueType?: string
    recompileScope?: TranscludeScope,
    //Functions
    save?(): void,
    saveC?(): void,
    cancel?(): void,
    startEdit?(): void,
    preview?(): void

}

export interface TranscludeScope extends angular.pane.IPaneScope {
    $ctrl?: TranscludeController
    $parent: TranscludeScope
}

