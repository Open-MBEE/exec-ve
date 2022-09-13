import * as angular from "angular";
import {ViewHtmlService} from "@ve-ext/presentations";
import {ExtensionController, ExtUtilService} from "@ve-ext";
import {ViewPresentationElemController} from "@ve-ext/presentations";
import {ElementObject, ExpressionObject, PresentationInstanceObject, ViewObject} from "@ve-types/mms";
import {PresentationService} from "@ve-ext/presentations";
import {ButtonBarApi, ButtonBarService} from "@ve-utils/button-bar";
import {EventService} from "@ve-utils/core-services";
import {SchemaService} from "@ve-utils/model-schema";
import {ViewController} from "@ve-ext/presentations/view.component";

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
    cancel(e?): void {}
    delete(e?): void {}
    preview(e?): void {}
    save(e?): void {}
    saveC(e?): void {}
    startEdit(e?): void {}

    private schema = 'cameo'

    static $inject = ['$element', '$scope', '$compile', 'growl', 'SchemaService', 'ViewHtmlService', 'PresentationService',
        'ExtUtilService', 'EventService', 'ButtonBarService']
    constructor(protected $element: JQuery<HTMLElement>, public $scope: angular.IScope,
                protected $compile: angular.ICompileService, protected growl: angular.growl.IGrowlService, protected schemaSvc: SchemaService,
                protected viewHtmlSvc: ViewHtmlService, protected presentationSvc: PresentationService,
                protected extUtilSvc: ExtUtilService, protected eventSvc: EventService, protected buttonBarSvc: ButtonBarService) {
    }

    instanceSpec?: ElementObject;
    editorApi?: any;
    values?: any[];

    $onInit() {
        this.eventSvc.$init(this);

        if (this.peNumber) {
            this.level = this.peNumber.split('.').length;
            this.number = this.peNumber;
        }
        this.bbApi = this.buttonBarSvc.initApi('', this.bbInit, this);

        var projectId = this.mmsProjectId;
        var refId = this.mmsRefId;
        var commitId = this.mmsCommitId;

        if (this.mmsViewCtrl) {
            var viewVersion = this.mmsViewCtrl.getElementOrigin();
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
            this.isDirectChildOfPresentationElement = this.extUtilSvc.isDirectChildOfPresentationElementFunc(this.$element, this.mmsViewCtrl);
            if (this.element.classifierIds[0] === this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','Section',this.schema))
                this.isDirectChildOfPresentationElement = false;
            var type = "name";

        }

        this.config();

        if (this.commitId === 'latest') {
            this.subs.push(this.eventSvc.$on('element.updated', (data: {element: ElementObject, continueEdit: boolean}) => {
                let elementOb = data.element;
                let continueEdit = data.continueEdit;
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

    protected recompile = () => {
        this.isEditing = false;
        this.inPreviewMode = false;

        if (this.peNumber) {
            this.level = this.peNumber.split('.').length;
            this.number = this.peNumber;
        }

        this.$element.empty();
        this.$transcludeEl = $(this.getContent());
        this.$transcludeEl.find('img').each((index, element) => {
            this.extUtilSvc.fixImgSrc($(element));
        });
        this.$element.append(this.$transcludeEl);
        this.$compile(this.$transcludeEl)(this.$scope);
    }

    protected config = (): void => {}

    protected getContent = (): string => {
        return 'Not Yet Implemented';
    };

    private bbInit = (api: ButtonBarApi) => {
        api.addButton(this.buttonBarSvc.getButtonBarButton("presentation-element-preview", this));
        api.addButton(this.buttonBarSvc.getButtonBarButton("presentation-element-save", this));
        api.addButton(this.buttonBarSvc.getButtonBarButton("presentation-element-saveC", this));
        api.addButton(this.buttonBarSvc.getButtonBarButton("presentation-element-cancel", this));
        api.addButton(this.buttonBarSvc.getButtonBarButton("presentation-element-delete", this));
        api.setPermission("presentation-element-delete", this.isDirectChildOfPresentationElement);
    };

}
