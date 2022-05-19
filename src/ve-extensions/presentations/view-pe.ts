import {VeComponentOptions} from "@ve-types/view-editor";

export interface PresentationComponentOptions extends VeComponentOptions {
    selector: string,
    style?: string[]
    bindings: {
        viewData: string,
        viewPe?: string
    }

}