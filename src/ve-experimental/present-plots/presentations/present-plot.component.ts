import * as angular from "angular";
import {Presentation, PresentationComponentOptions, PresentationService, ViewHtmlService} from "@ve-ext/presentations";
import {EventService, UtilsService} from "@ve-utils/core-services";
import {veExt, ExtUtilService} from "@ve-ext";
import {SchemaService} from "@ve-utils/model-schema";
import {ButtonBarService} from "@ve-utils/button-bar";
import {PresentationInstanceObject} from "@ve-types/mms";

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
                    presentationSvc: PresentationService,  extUtilSvc: ExtUtilService, eventSvc: EventService, buttonBarSvc: ButtonBarService) {
            super($element, $scope, $compile, growl, schemaSvc, viewHtmlSvc, presentationSvc, extUtilSvc, eventSvc, buttonBarSvc)
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

veExt.component(ViewPlotComponent.selector,ViewPlotComponent);
