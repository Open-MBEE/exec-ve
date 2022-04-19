import {ElementObject} from "../../ve-utils/types/mms";
import {ButtonBarApi} from "../button-bar/ButtonBar.service";
import * as angular from "angular";

declare interface UtilController  {
    element: ElementObject,
    edit: ElementObject,
    elementSaving: boolean,
    bbApi?: ButtonBarApi
    editorApi?: any
    isEnumeration: boolean,
    recompileScope?: angular.IScope,
    skipBroadcast: boolean
    isEditing: boolean,
    mmsProjectId: string,
    mmsRefId: string,
    commitId: string,
    inPreviewMode: boolean,
    editValues: any[],
    $scope: angular.IScope
}