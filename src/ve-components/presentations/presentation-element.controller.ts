import * as angular from "angular";
import {ViewHtmlService} from "@ve-components/presentations";
import {ExtensionController, ComponentService} from "@ve-components/services";
import {ViewPresentationElemController} from "@ve-components/presentations";
import {ElementObject, ExpressionObject, PresentationInstanceObject, ViewObject} from "@ve-types/mms";
import {PresentationService} from "@ve-components/presentations";
import {ButtonBarApi, ButtonBarService} from "@ve-core/button-bar";
import {EventService, ImageService} from "@ve-utils/services";
import {SchemaService} from "@ve-utils/model-schema";
import {ViewController} from "@ve-components/presentations/view.component";

export interface IPresentation extends ExtensionController {
    number: string
    level: number
}



export class Presentation implements IPresentation {

    //Bindings
    public peObject: PresentationInstanceObject
    public element: ExpressionObject
    public peNumber: string
    protected mmsProjectId: string;
    protected mmsRefId: string;
    protected mmsCommitId: string;

    //Deps
    protected mmsViewPresentationElemCtrl: ViewPresentationElemController
    protected mmsViewCtrl: ViewController

    subs: Rx.IDisposable[]
    public bbApi: ButtonBarApi
    public bars: string[]

    //Common
    //public element: ElementObject;
    public edit: ElementObject;
    public editValues: any;
    protected $transcludeEl: JQuery<HTMLElement>;
    public view: ViewObject
    public projectId: string
    public refId: string
    public commitId: string
    public instanceVal: any
    protected presentationElem: any
    protected isDirectChildOfPresentationElement: boolean

    public number: string
    public level: number
    public isEditing: boolean
    public skipBroadcast: boolean
    public inPreviewMode: boolean
    public cleanUp
    public elementSaving: boolean

    //Default Editor Api
    /* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
    cancel(e?): void {}
    delete(e?): void {}
    preview(e?): void {}
    save(e?): void {}
    saveC(e?): void {}
    startEdit(e?): void {}
    /* eslint-enable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */

    private schema = 'cameo'

    static $inject = ['$element', '$scope', '$compile', 'growl', 'SchemaService', 'ViewHtmlService', 'PresentationService',
        'ComponentService', 'EventService', 'ImageService', 'ButtonBarService']
    constructor(protected $element: JQuery<HTMLElement>, public $scope: angular.IScope,
                protected $compile: angular.ICompileService, protected growl: angular.growl.IGrowlService, protected schemaSvc: SchemaService,
                protected viewHtmlSvc: ViewHtmlService, protected presentationSvc: PresentationService,
                protected componentSvc: ComponentService, protected eventSvc: EventService, protected imageSvc: ImageService,
                protected buttonBarSvc: ButtonBarService) {
    }

    instanceSpec?: ElementObject;
    editorApi?: any;
    values?: any[];

    /**
     * @listens element.updated
     */
    $onInit() {
        this.eventSvc.$init(this);

        this.setNumber();

        this.bbApi = this.buttonBarSvc.initApi('', this.bbInit, this);

        let projectId = this.mmsProjectId;
        let refId = this.mmsRefId;
        let commitId = this.mmsCommitId;

        if (this.mmsViewCtrl) {
            const viewVersion = this.mmsViewCtrl.getElementOrigin();
            if (!projectId)
                projectId = viewVersion.projectId;
            if (!refId)
                refId = viewVersion.refId;
            if (!commitId)
                commitId = viewVersion.commitId;
        }
        this.projectId = projectId;
        this.refId = refId ? refId : 'master';
        this.commitId = commitId ? commitId : 'latest';

        if (this.mmsViewCtrl && this.mmsViewPresentationElemCtrl) {

            this.isEditing = false;
            this.inPreviewMode = false;
            this.elementSaving = false;
            this.cleanUp = false;
            this.instanceVal = this.mmsViewPresentationElemCtrl.getInstanceVal();
            this.presentationElem = this.mmsViewPresentationElemCtrl.getPresentationElement();
            this.view = this.mmsViewCtrl.getView();
            this.isDirectChildOfPresentationElement = this.componentSvc.isDirectChildOfPresentationElementFunc(this.$element, this.mmsViewCtrl);
            if (this.element.classifierIds[0] === this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','Section',this.schema))
                this.isDirectChildOfPresentationElement = false;

        }

        this.config();

        if (this.commitId === 'latest') {
            this.subs.push(this.eventSvc.$on('element.updated', (data: {element: ElementObject, continueEdit: boolean}) => {
                const elementOb = data.element;
                const continueEdit = data.continueEdit;
                if (elementOb.id === this.element.id && elementOb._projectId === this.element._projectId &&
                    elementOb._refId === this.element._refId && !continueEdit) {
                    this.recompile();
                }
            }));
        }
    }

    $postLink() {
        this.recompile();
    }



    private bbInit = (api: ButtonBarApi) => {
        api.addButton(this.buttonBarSvc.getButtonBarButton("presentation-element-preview", this));
        api.addButton(this.buttonBarSvc.getButtonBarButton("presentation-element-save", this));
        api.addButton(this.buttonBarSvc.getButtonBarButton("presentation-element-saveC", this));
        api.addButton(this.buttonBarSvc.getButtonBarButton("presentation-element-cancel", this));
        api.addButton(this.buttonBarSvc.getButtonBarButton("presentation-element-delete", this));
        api.setPermission("presentation-element-delete", this.isDirectChildOfPresentationElement);
    };


    // Presentation Api

    /**
     * @name Presentation/config
     *
     * @description Extension API method to allow presentation components to implement custom initialization steps.
     * Such as non-standard variables or services.
     */
    protected config = (): void => {
        /* Implement any initialization Logic Here */
    }

    /**
     * @name Presentation/getContent
     *
     * @description Extension API method in which presentation components should return the content they wish to display.
     */
    protected getContent = (): string => {
        return 'Not Yet Implemented';
    };

    /**
     * @name Presentation/recompile
     *
     * @description Re-defining this API method is an advanced technique. It is not recommended to use this for simple
     * presentation use-cases. This function causes the redrawing of the presentation element and re-compilation in the DOM.
     * This function is automatically triggered by the "element.updated" event.
     */
    protected recompile = () => {
        this.isEditing = false;
        this.inPreviewMode = false;

        this.setNumber();

        this.$element.empty();
        this.$transcludeEl = $(this.getContent());
        this.$transcludeEl.find('img').each((index, element) => {
            this.imageSvc.fixImgSrc($(element));
        });
        this.$element.append(this.$transcludeEl);
        this.$compile(this.$transcludeEl)(this.$scope);
    }


    // Static Helper Functions
    /**
     * @name Presentation/setNumber
     * @type function
     *
     * @description Helper function which will set the level and number of the PE. Contains logic that
     * will handle cases where the {string} peNumber is parsed as an integer that will be treated as level 1
     */
    public setNumber = () => {
        if (this.peNumber) {
            if (Number.isInteger(this.peNumber))
                this.level = 1;
            else
                this.level = this.peNumber.split('.').length;
            this.number = this.peNumber;
        }
    }

}
