import {VeComponentOptions} from "@ve-types/view-editor";

export interface PresentationComponentOptions extends VeComponentOptions {
    selector: string,
    style?: string[]
    bindings: {
        peObject: string,
        element: string,
        peNumber: string,
        mmsProjectId?: '@',
        mmsRefId?: '@',
        mmsCommitId?: '@',
        [key: string]: string
    }
    required?: {
        mmsViewPresentationElemCtrl: string
        mmsViewCtrl: string
        [key: string]: string
    }

}