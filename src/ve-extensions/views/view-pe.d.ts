import * as angular from "angular";

export interface VeViewExtensionOptions extends angular.IComponentOptions {
    selector: string,
    style?: string[]
    bindings: {
        viewData: string,
        viewPe?: string
    }

}