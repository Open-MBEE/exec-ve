import * as angular from "angular";
import {Presentation, PresentationComponentOptions, PresentationService, ViewHtmlService} from "@ve-components/presentations";
import {EventService, ImageService, UtilsService} from "@ve-utils/services";
import {veComponents} from "@ve-components";
import {SchemaService} from "@ve-utils/model-schema";
import {ButtonBarService} from "@ve-core/button-bar";
import {PresentationInstanceObject} from "@ve-types/mms";
import {ComponentService} from "@ve-components/services";

let ViewPlotComponent: PresentationComponentOptions = {
    selector: 'presentPlot',
    template: ``,
    bindings: {
       peObject: '<',
        element: '<',
        peNumber: '<'
    },
    controller: class ViewPlotController extends Presentation implements angular.IComponentController {

        public plot: PresentationInstanceObject

        static $inject = Presentation.$inject
        constructor($element: JQuery<HTMLElement>, $scope: angular.IScope,
                    $compile: angular.ICompileService, growl: angular.growl.IGrowlService, schemaSvc: SchemaService, viewHtmlSvc: ViewHtmlService,
                    presentationSvc: PresentationService,  componentSvc: ComponentService, eventSvc: EventService, imageSvc: ImageService, buttonBarSvc: ButtonBarService) {
            super($element, $scope, $compile, growl, schemaSvc, viewHtmlSvc, presentationSvc, componentSvc, eventSvc, imageSvc, buttonBarSvc)
        }

        config = () => {
            this.plot = this.peObject;
        }

        getContent = () => {
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
                return '<figure><plot-' + this.plot.ptype + ' plot="plot"></plot-' + this.plot.ptype + '><figcaption>{{$ctrl.plot.title}}</figcaption></figure>';
            }
        }
    }
}

veComponents.component(ViewPlotComponent.selector,ViewPlotComponent);
