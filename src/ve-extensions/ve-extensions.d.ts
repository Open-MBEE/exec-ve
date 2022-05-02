import * as angular from 'angular';
import {TButton} from "./content-tools/content-tool";

export interface PEController extends angular.IComponentController {
    foo: string
}
export interface VeExtensionConfig {
    id: string,
    path: string,
}



export interface ContentToolConfig  extends VeExtensionConfig {
    name: string,
    button: TButton,
    dynamic_button: TButton[]
}

export interface ExtensionsConfig {}

// <div id="{{$ctrl.instanceSpec.id}}" ng-if="!$ctrl.presentationElemLoading" ng-switch on="$ctrl.presentationElem.type">
//     <mms-view-para class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="Paragraph"></mms-view-para>
//     <mms-view-table data-mms-table="$ctrl.presentationElem" mms-pe="$ctrl.instanceSpec" ng-switch-when="Table"></mms-view-table>
//     <mms-view-table-t class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="TableT"></mms-view-table-t>
//     <mms-view-list class="read-width" data-mms-list="$ctrl.presentationElem" ng-switch-when="List"></mms-view-list>
//     <mms-view-list-t class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="ListT"></mms-view-list-t>
//     <mms-view-img data-mms-image="$ctrl.presentationElem" mms-pe="$ctrl.instanceSpec" ng-switch-when="Image"></mms-view-img>
//     <mms-view-section data-mms-section="$ctrl.presentationElem" ng-switch-when="InstanceSpecification"></mms-view-section>
//     <mms-view-equation class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="Equation"></mms-view-equation>
//     <mms-view-figure class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="Figure"></mms-view-figure>
//     <mms-view-figure class="read-width" data-mms-para="$ctrl.presentationElem" ng-switch-when="ImageT"></mms-view-figure>
//     <mms-transclude-com class="read-width" mms-element-id="{{$ctrl.presentationElem.source}}" mms-project-id="{{$ctrl.instanceSpec._projectId}}" mms-ref-id="{{$ctrl.instanceSpec._refId}}" ng-switch-when="Comment"></mms-transclude-com>
//     <mms-view-plot data-mms-plot="$ctrl.presentationElem" ng-switch-when="Plot"></mms-view-plot>
//     <mms-ts-diagram mms-pe-id="{{$ctrl.instanceSpec.id}}" mms-project-id="{{$ctrl.instanceSpec._projectId}}" mms-ref-id="{{$ctrl.instanceSpec._refId}}" mms-tsp-spec="$ctrl.presentationElem" ng-switch-when="TomSawyerDiagram"></mms-ts-diagram>
//     </div>