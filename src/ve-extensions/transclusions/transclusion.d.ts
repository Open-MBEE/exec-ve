import angular from "angular";
import {ElementObject} from "../../ve-utils/types/mms";
import {ButtonBarApi} from "../../ve-core/button-bar/ButtonBar.service";
import {UtilController} from "../../ve-core/utilities/utils";
import {VeEditorApi} from "../../ve-core/editor/CKEditor.service";


export interface TransclusionController extends angular.IComponentController, UtilController {
    $scope: TranscludeScope
    mmsElementId: string
    commitId: string
    cfType: string
    edit: ElementObject
    element: ElementObject
    isEditing: boolean
    inPreviewMode: boolean
    skipBroadcast: boolean
    addValueTypes?: object
    addValueType?: string
    recompileScope?: TranscludeScope,
    //Functions
    editApi?: VeEditorApi,
    addValue?(type: string): void,
    removeVal?(i: number): void

}

export interface TranscludeScope extends angular.pane.IPaneScope {
    $ctrl?: TransclusionController
    $parent: TranscludeScope
}

