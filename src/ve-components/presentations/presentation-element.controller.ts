import $ from 'jquery';

import { ViewHtmlService, ViewPresentationElemController, PresentationService } from '@ve-components/presentations';
import { ViewController } from '@ve-components/presentations/view.component';
import { ComponentService, ExtensionService } from '@ve-components/services';
import { ButtonBarService } from '@ve-core/button-bar';
import { ImageService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { SchemaService } from '@ve-utils/model-schema';

import { VePromise, VeQService } from '@ve-types/angular';
import {
    ElementObject,
    InstanceSpecObject,
    InstanceValueObject,
    PresentationInstanceObject,
    ViewObject,
} from '@ve-types/mms';

export class PresentationLite {
    //Bindings
    public peObject: PresentationInstanceObject;
    public instanceSpec: InstanceSpecObject;
    public peNumber: string;
}

export class Presentation extends PresentationLite {
    //Bindings
    protected mmsProjectId: string;
    protected mmsRefId: string;
    protected mmsCommitId: string;

    //Deps
    protected mmsViewPresentationElemCtrl: ViewPresentationElemController;
    protected mmsViewCtrl: ViewController;

    subs: Rx.IDisposable[];

    //Common
    //public element: ElementObject;
    protected $transcludeEl: JQuery<HTMLElement>;
    public view: ViewObject;
    public projectId: string;
    public refId: string;
    public commitId: string;
    public instanceVal: InstanceValueObject;
    protected presentationElem: PresentationInstanceObject | ElementObject;
    protected isDirectChildOfPresentationElement: boolean;

    public number: string;
    public level: number;

    private schema = 'cameo';

    static $inject = [
        '$q',
        '$element',
        '$scope',
        '$compile',
        'growl',
        'SchemaService',
        'ViewHtmlService',
        'PresentationService',
        'ComponentService',
        'EventService',
        'ImageService',
        'ButtonBarService',
        'ExtensionService',
    ];
    constructor(
        protected $q: VeQService,
        protected $element: JQuery<HTMLElement>,
        public $scope: angular.IScope,
        protected $compile: angular.ICompileService,
        protected growl: angular.growl.IGrowlService,
        protected schemaSvc: SchemaService,
        protected viewHtmlSvc: ViewHtmlService,
        protected presentationSvc: PresentationService,
        protected componentSvc: ComponentService,
        protected eventSvc: EventService,
        protected imageSvc: ImageService,
        protected buttonBarSvc: ButtonBarService,
        protected extensionSvc: ExtensionService
    ) {
        super();
    }

    /**
     * @listens element.updated
     */
    $onInit(): void {
        this.eventSvc.$init(this);

        this.setNumber();

        let projectId = this.mmsProjectId;
        let refId = this.mmsRefId;
        let commitId = this.mmsCommitId;

        if (this.mmsViewCtrl) {
            const viewVersion = this.mmsViewCtrl.getElementOrigin();
            if (!projectId) projectId = viewVersion.projectId;
            if (!refId) refId = viewVersion.refId;
            if (!commitId) commitId = viewVersion.commitId;
        }
        this.projectId = projectId;
        this.refId = refId ? refId : 'master';
        this.commitId = commitId ? commitId : 'latest';

        this.config();
    }

    $postLink(): void {
        this.recompile();
    }

    // Presentation Api

    /**
     * @name Presentation/config
     *
     * @description Extension API method to allow presentation components to implement custom initialization steps.
     * Such as non-standard variables or services.
     */
    protected config = (): void => {
        /* Implement any initialization Logic Here */
    };

    /**
     * @name Presentation/getContent
     *
     * @description Extension API method in which presentation components should return the content they wish to display.
     */
    protected getContent = (): VePromise<string | HTMLElement[], string> => {
        return this.$q.reject('Not Yet Implemented');
    };

    /**
     * @name Presentation/recompile
     *
     * @description Re-defining this API method is an advanced technique. It is not recommended to use this for simple
     * presentation use-cases. This function causes the redrawing of the presentation element and re-compilation in the DOM.
     * This function is automatically triggered by the "element.updated" event.
     */
    protected recompile = (): void => {
        this.setNumber();
        this.getContent().then(
            (result) => {
                this.$element.empty();
                this.$transcludeEl = $(result);
                this.$transcludeEl.find('img').each((index, element) => {
                    this.imageSvc.fixImgSrc($(element));
                });
                this.$element.append(this.$transcludeEl);
                this.$compile(this.$transcludeEl)(this.$scope);
            },
            (reason) => {
                const reqOb = {
                    elementId: this.instanceSpec.id,
                    projectId: this.projectId,
                    refId: this.refId,
                    commitId: this.commitId,
                    //includeRecentVersionElement: true,
                };
                this.$element.empty();
                //TODO: Add reason/errorMessage handling here.
                this.$transcludeEl = $(
                    '<annotation mms-element-id="::elementId" mms-recent-element="::recentElement" mms-type="::type"></annotation>'
                );
                this.$element.append(this.$transcludeEl);
                this.$compile(this.$transcludeEl)(
                    Object.assign(this.$scope.$new(), {
                        elementId: reqOb.elementId,
                        recentElement: reason.recentVersionOfElement,
                        type: 'presentation',
                    })
                );
            }
        );
    };

    // Static Helper Functions
    /**
     * @name Presentation/setNumber
     * @type function
     *
     * @description Helper function which will set the level and number of the PE. Contains logic that
     * will handle cases where the {string} peNumber is parsed as an integer that will be treated as level 1
     */
    public setNumber = (): void => {
        if (this.peNumber) {
            if (Number.isInteger(this.peNumber)) this.level = 1;
            else this.level = this.peNumber.split('.').length;
            this.number = this.peNumber;
        }
    };
}
