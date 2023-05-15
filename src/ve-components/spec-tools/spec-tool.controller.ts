import { IPaneScope } from '@openmbee/pane-layout';

import { ComponentService } from '@ve-components/services';
import { veCoreEvents } from '@ve-core/events';
import { ToolbarService, ToolbarApi } from '@ve-core/toolbar';
import { ApplicationService } from '@ve-utils/application';
import { EditObject, EventService } from '@ve-utils/core';
import {
    ApiService,
    ElementService,
    PermissionsService,
    ProjectService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client';

import { SpecApi, SpecService } from './services/Spec.service';

import { VeQService } from '@ve-types/angular';
import { ElementObject, RefObject, ValueObject, ViewObject } from '@ve-types/mms';

export interface ISpecTool extends angular.IComponentController {
    $scope: ISpecToolScope;
    commitId: string;
    specType: string;
    edit: EditObject;
    element: ElementObject;
    isEditing: boolean;
    inPreviewMode: boolean;
    skipBroadcast: boolean;
    editValues?: ValueObject[];
    values?: ValueObject[];
    //Functions
    addValue?(type: string): void;
    removeVal?(i: number): void;
}

export interface ISpecToolScope extends IPaneScope {
    $ctrl?: ISpecTool;
    $parent: ISpecToolScope;
}

/**
 * @ngdoc component
 * @name veComponents/SpecTool
 * @type {ISpecTool}
 *
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {angular.IRootElementService} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {Utils} utils
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc
 * @requires {ToolbarService} toolbarSvc
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
export class SpecTool implements ISpecTool {
    //Bindings
    protected toolbarId: string;

    public specApi: SpecApi;

    //Customizers
    public specType: string;
    public specTitle: string;

    public subs: Rx.IDisposable[];

    public commitId: string;
    protected projectId: string;
    protected refId: string;

    public isEditing: boolean;
    public isEnumeration: boolean;
    public inPreviewMode: boolean;
    public elementSaving: boolean;
    public skipBroadcast: boolean;

    protected gettingSpec = true;
    public element: ElementObject;
    public document: ViewObject;
    public ref: RefObject;
    public values: any[];
    public edit: EditObject;
    protected modifier;
    protected options: any;
    protected elementDataLink: string;
    protected qualifiedName: string;

    public editValues: any[];

    protected template: string | angular.Injectable<(...args: any[]) => string>;

    static $inject = [
        '$q',
        '$scope',
        '$element',
        'growl',
        'ComponentService',
        'URLService',
        'ElementService',
        'ProjectService',
        'ApplicationService',
        'ApiService',
        'ViewService',
        'PermissionsService',
        'EventService',
        'SpecService',
        'ToolbarService',
    ];

    constructor(
        protected $q: VeQService,
        public $scope: angular.IScope,
        public $element: JQuery<HTMLElement>,
        protected growl: angular.growl.IGrowlService,
        protected componentSvc: ComponentService,
        protected uRLSvc: URLService,
        protected elementSvc: ElementService,
        protected projectSvc: ProjectService,
        protected applicationSvc: ApplicationService,
        protected apiSvc: ApiService,
        protected viewSvc: ViewService,
        protected permissionsSvc: PermissionsService,
        protected eventSvc: EventService,
        public specSvc: SpecService,
        protected toolbarSvc: ToolbarService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this);

        this.editValues = this.specSvc.editValues;
        this.toolbarSvc.waitForApi(this.toolbarId).then(
            (api) => {
                if (
                    api.buttons.map((value) => value.id).filter((value) => value === this.specType).length < 1 &&
                    window.__env &&
                    window.__env.enableDebug
                ) {
                    console.log('Spec View: ' + this.specType + 'is missing a button definition');
                }
                this.configToolbar(api);
            },
            (reason) => {
                this.growl.error(reason.message);
            }
        );

        this.changeElement();

        this.subs.push(this.eventSvc.binding<boolean>('spec.ready', this.changeElement));
        //this.subs.push(this.eventSvc.$on(this.specType, this.initCallback))
    }

    $onDestroy(): void {
        this.eventSvc.destroy(this.subs);
        this.destroy();
    }

    /**
     * @name veComponents/SpecTool#config
     *
     * Use this API to implement any toolbar-specific initialization steps that would normally be called in the toolbar Promise callback
     *
     * @protected
     */
    protected configToolbar = (api: ToolbarApi): void => {
        /* Implement any toolbar initialization Logic Here */
    };

    /**
     * @name veComponents/SpecTool#initCallback
     *
     * This API is called whenever the element of focus for the Spec Tool window is changed
     *
     * @protected
     */
    protected initCallback: () => void = () => {
        /* Implement any post initialization steps here */
    };

    /**
     * @name veComponents/SpecTool#destroy
     *
     * This API is for whenever custom logic is required during the $onDestroy lifecycle stage
     * (To reset Services, unregister listeners, etc).
     * @protected
     */
    protected destroy: () => void = () => {
        /* Implement any custom on destroy logic to unregister listeners etc */
    };

    public changeElement = (ready?: boolean): void => {
        if (!ready) return;
        this.gettingSpec = true;
        this.specApi = this.specSvc.specApi;
        this.refId = this.specApi.refId;
        this.projectId = this.specApi.projectId;
        this.commitId = this.specApi.commitId;
        this.modifier = this.specSvc.getModifier();
        this.qualifiedName = this.specApi.qualifiedName;
        this.element = this.specSvc.getElement();
        this.document = this.specSvc.getDocument();
        this.values = this.specSvc.getValues();
        this.ref = this.specSvc.getRef();
        this.elementDataLink = this.specApi.dataLink;
        this.initCallback();
        this.gettingSpec = false;
    };

    //Spec Tool Common API

    public copyToClipboard($event: JQuery.ClickEvent, selector: string): void {
        this.applicationSvc.copyToClipboard(this.$element.find<HTMLElement>(selector), $event).then(
            () => {
                this.growl.info('Copied to clipboard!', { ttl: 2000 });
            },
            (err) => {
                this.growl.error('Unable to copy: ' + err.message);
            }
        );
    }

    public cleanupVal(obj: { value: unknown }): void {
        obj.value = parseInt(obj.value as string);
    }

    public propertyTypeClicked = (id: string): void => {
        const data = {
            elementId: id,
            projectId: this.element._projectId,
            refId: this.element._refId,
            commitId: 'latest',
        };
        this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', data);
    };

    public addHtml(value: { value: string }): void {
        value.value = '<p>' + value.value + '</p>';
    }

    /**
     * @name veComponents.component:mmsSpec#save
     * save edited element
     *
     * @return {Promise} promise would be resolved with updated element if save is successful.
     *      For unsuccessful saves, it will be rejected with an object with type and message.
     *      Type can be error or info. In case of conflict, there is an option to discard, merge,
     *      or force save. If the user decides to discord or merge, type will be info even though
     *      the original save failed. Error means an actual error occured.
     */
    // public save(): VePromise<ElementObject> {
    //     return this.componentSvc.save(this.edit, this.editorApi, this, false)
    // }

    public hasHtml = (s: string): boolean => {
        return this.componentSvc.hasHtml(s);
    };
}
