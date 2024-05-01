import * as SVG from '@svgdotjs/svg.js';

import { ExtensionService, ComponentService } from '@ve-components/services';
import { Transclusion, ITransclusion } from '@ve-components/transclusions';
import { ButtonBarService } from '@ve-core/button-bar';
import { EditorService } from '@ve-core/editor';
import { veCoreEvents } from '@ve-core/events';
import { UtilsService, MathService, ImageService } from '@ve-utils/application';
import { EditService, EventService } from '@ve-utils/core';
import { ElementService, URLService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';

/**
 * @ngdoc component
 * @name veComponents/TranscludeImgController
 * @type {ITransclusion}
 *
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {angular.IRootElementService} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {ComponentService} componentSvc
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc

 * @requires {AuthService} authSvc
 * @requires {EventService} eventSvc
 * @requires {ButtonBarService} buttonBarSvc
 * @requires {MathService} mathSvc
 * * Given an element id, puts in the element's documentation binding, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 *
 * ## Example
 *  <pre>
 <transclude-doc mms-element-id="element_id"></transclude-doc>
 </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class TranscludeImgController extends Transclusion implements ITransclusion {
    //Locals
    includeExt = ['svg', 'png'];
    svg: { url: string; image: boolean; ext: string }[];
    png: { url: string; image: boolean; ext: string }[];
    artifacts: { url: string; image: boolean; ext: string }[];

    private svgData: SVG.Svg;

    static $inject: string[] = [...Transclusion.$inject, 'URLService', '$http'];

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        editorSvc: EditorService,
        editSvc: EditService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        schemaSvc: SchemaService,
        eventSvc: EventService,
        mathSvc: MathService,
        extensionSvc: ExtensionService,
        buttonBarSvc: ButtonBarService,
        imageSvc: ImageService,
        private urlSvc: URLService,
        private $http: VeHttpService
    ) {
        super(
            $q,
            $scope,
            $compile,
            $element,
            growl,
            componentSvc,
            editorSvc,
            editSvc,
            elementSvc,
            utilsSvc,
            schemaSvc,
            eventSvc,
            mathSvc,
            extensionSvc,
            buttonBarSvc,
            imageSvc
        );
        this.cfType = 'img';
        this.cfTitle = 'Diagram';
        this.cfKind = 'Image';
        this.checkCircular = true;
    }

    $onInit(): void {
        super.$onInit();
        // this.$element.on('click', (e) => {
        //     if (this.mmsViewCtrl) this.mmsViewCtrl.transcludeClicked(this.element);

        //     e.stopPropagation();
        // });
    }

    public getContent = (preview?): VePromise<string | HTMLElement[], string> => {
        const artifacts = this.element._artifacts;
        return new this.$q((resolve, reject) => {
            if (artifacts !== undefined) {
                const reqOb = {
                    elementId: this.mmsElementId,
                    projectId: this.projectId,
                    refId: this.refId,
                    commitId: this.commitId,
                    //includeRecentVersionElement: true,
                };
                this.artifacts = artifacts
                    .filter((a) => this.includeExt.includes(a.extension))
                    .map((a) => {
                        return {
                            url: this.urlSvc.getArtifactURL(reqOb, a.extension),
                            image: a.mimetype.indexOf('image') > -1,
                            ext: a.extension,
                        };
                    });
                this.svg = this.artifacts.filter((a) => a.ext === 'svg');
                this.png = this.artifacts.filter((a) => a.ext === 'png');
            }
            resolve(
                `<div id=${this.mmsElementId}-svg class=mms-svg></div><img ng-hide=true class="mms-png" ng-src="${this.png[0].url}"  alt="${this.element.name}"/>`
            );
        });
    };

    protected postRecompile = (content: string | HTMLElement[]): void => {
        if (this.svg) {
            this.$http.get<string>(this.svg[0].url).then((result) => {
                const parse = SVG.SVG().svg(result.data);
                this.svgData = parse.children()[0] as SVG.Svg;
                this.svgData.width('100%');
                this.svgData.height('100%');
                //this.svgData.attr('pointer-events', 'bounding-box')
                this.svgData.addTo(`#${this.mmsElementId}-svg`);
                this.svgData
                    .last()
                    .children()
                    .filter((child) => {
                        return child.hasClass('element');
                    })
                    .forEach((child) => {
                        const path = child.first();
                        console.log('HI!');
                        path.fill('transparent');
                        path.on('click', (e) => {
                            const id: string = child.attr('id');
                            this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', {
                                elementId: id,
                                projectId: this.projectId,
                                refId: this.refId,
                            });
                            e.stopPropagation();
                        });
                    });
            });
        }
    };
}

export const TranscludeImgComponent: VeComponentOptions = {
    selector: 'transcludeImg',
    template: `<div></div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '@',
        nonEditable: '<',
        mmsCfLabel: '<',
        mmsGenerateForDiff: '<',
        mmsCallback: '&',
    },
    require: {
        mmsViewCtrl: '?^view',
        mmsViewPresentationElemCtrl: '?^viewPe',
    },
    controller: TranscludeImgController,
};

veComponents.component(TranscludeImgComponent.selector, TranscludeImgComponent);
