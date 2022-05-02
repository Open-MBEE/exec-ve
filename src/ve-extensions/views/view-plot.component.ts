import * as angular from "angular";
import {VeViewExtensionOptions} from "./view-pe";
import {UtilsService} from "../../ve-utils/services/Utils.service";
import {TransclusionService} from "../transclusions/Transclusion.service";
import {veExt} from "../ve-extensions.module";

let ViewPlotComponent: VeViewExtensionOptions = {
    selector: 'viewPlot',
    template: ``,
    bindings: {
        viewData: '<',
        viewPe: '<'
    },
    controller: class ViewPlotController implements angular.IComponentController {

        public viewData
        public viewPe
        
        public plot

        constructor(private $element: JQuery<HTMLElement>, private $scope: angular.IScope,
                    private $compile: angular.ICompileService, private utilsSvc: UtilsService, private transclusionSvc: TransclusionService) {}

        $onInit() {
            this.plot = this.viewData;
            if ( this.plot.type === "Plot") {
                if ( this.plot.config !== undefined  && this.plot.config.trim().length !== 0){
                    try{
                        this.plot.config = JSON.parse(this.plot.config.replace(/'/g, '"'));
                        if( this.plot.config.ptype !== undefined) {
                            this.plot.ptype = this.plot.config.ptype;
                        }
                    }
                    catch (err){
                        console.log("error ignored");
                    }
                }
                this.$element[0].innerHTML = '<figure><mms-' + this.plot.ptype + '-plot plot="plot"></mms-' + this.plot.ptype + '-plot><figcaption>{{$ctrl.plot.title}}</figcaption></figure>';
                this.$compile(this.$element[0].innerHTML)(this.$scope);
            }
        }
    }
}

veExt.component(ViewPlotComponent.selector,ViewPlotComponent);