import { ExtensionService, ComponentService } from '@ve-components/services';
import { ITransclusion, ITransclusionComponentOptions } from '@ve-components/transclusions';
import { TranscludeDocController } from '@ve-components/transclusions/components/transclude-doc.component';
import { DeletableTransclusion } from '@ve-components/transclusions/deletable-transclusion.controller';
import { ButtonBarService } from '@ve-core/button-bar';
import { EditorService } from '@ve-core/editor';
import { ImageService, MathService, UtilsService } from '@ve-utils/application';
import { EditService, EventService } from '@ve-utils/core';
import { ElementService, ViewService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';

import { veComponents } from '@ve-components';

import { VePromise, VeQService } from '@ve-types/angular';

/**
 * @ngdoc directive
 * @name veComponents.component:mmsTranscludeCom
 *
 * @requires veUtils/ElementService
 * @requires veUtils/UtilsService
 * @requires veUtils/ViewService
 * @requires veComponents/ButtonBarService
 * @requires veComponents/ComponentService
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 * @requires MathJax
 *
 * * Given an element id, puts in the element's documentation binding, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 * (This is different from mmsTranscludeDoc because of special styles applied to comments)
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
export class TranscludeComController extends TranscludeDocController implements ITransclusion {
    static $inject = DeletableTransclusion.$inject;

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
        viewSvc: ViewService
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
            imageSvc,
            viewSvc
        );
        this.cfType = 'doc';
        this.cfTitle = 'comment';
        this.cfKind = 'Comment';
        this.checkCircular = true;
    }

    $onInit(): void {
        super.$onInit();
        if (this.mmsViewPresentationElemCtrl) {
            if (this.isDeletable) {
                const instanceSpec = this.mmsViewPresentationElemCtrl.getInstanceSpec();
                this.panelTitle = instanceSpec ? instanceSpec.name : 'Comment';
            }
            this.panelType = 'Comment';
        }
    }

    public getContent = (preview?: boolean): VePromise<string | HTMLElement[], string> => {
        const deferred = this.$q.defer<string | HTMLElement[]>();

        let doc = (preview ? this.edit.element.documentation : this.element.documentation) || '(No comment)';
        doc += ' - <span class="mms-commenter"> Comment by <b>' + this.element._creator + '</b></span>';

        let result = '';
        if (preview) {
            result = '<div class="panel panel-info">' + doc + '</div>';
        } else {
            result = doc;
        }
        if (!this.mmsGenerateForDiff) {
            const resultHtml = $('<p></p>').html(result).toArray();
            this.mathSvc.typeset(resultHtml).then(
                () => deferred.resolve(resultHtml),
                (reason) => {
                    deferred.reject(reason);
                }
            );
        } else {
            deferred.resolve(result);
        }
        return deferred.promise;
    };
}

export const TranscludeComComponent: ITransclusionComponentOptions = {
    selector: 'transcludeCom',
    template: `<div></div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '<',
        nonEditable: '<',
        mmsCfLabel: '@',
        mmsGenerateForDiff: '<',
        mmsCallback: '&',
    },
    require: {
        mmsViewCtrl: '?^view',
        mmsViewPresentationElemCtrl: '?^viewPe',
    },
    controller: TranscludeComController,
};

veComponents.component(TranscludeComComponent.selector, TranscludeComComponent);
