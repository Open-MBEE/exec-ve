import { IPaneScope } from '@openmbee/pane-layout';
import $ from 'jquery';

import { ViewPresentationElemController } from '@ve-components/presentations';
import { ViewController } from '@ve-components/presentations/view.component';
import { ComponentService, ExtensionService } from '@ve-components/services';
import { SpecTool } from '@ve-components/spec-tools';
import { ButtonBarApi, ButtonBarService, IButtonBarButton } from '@ve-core/button-bar';
import { EditorService } from '@ve-core/editor';
import { veCoreEvents } from '@ve-core/events';
import { ImageService, MathService, UtilsService } from '@ve-utils/application';
import { EditObject, EditService, EventService } from '@ve-utils/core';
import { ElementService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';
import { handleChange, onChangesCallback } from '@ve-utils/utils';

import { VeComponentOptions, VePromise, VePromiseReason, VeQService } from '@ve-types/angular';
import { EditorActions } from '@ve-types/core/editor';
import { ElementObject, ElementsResponse, ViewObject } from '@ve-types/mms';

export interface ITransclusion extends angular.IComponentController {
    $scope: TranscludeScope;
    mmsElementId: string;
    mmsProjectId: string;
    mmsRefId: string;
    commitId: string;
    cfType: string;
    edit: EditObject;
    element: ElementObject;
    isEditing: boolean;
    inPreviewMode: boolean;
    skipBroadcast: boolean;
    recompileScope?: TranscludeScope;
}

export interface ITransclusionComponentOptions extends VeComponentOptions {
    bindings: TranscludeDefaultBindings;
}

interface TranscludeDefaultBindings {
    mmsElementId: '@';
    mmsProjectId: '@';
    mmsRefId: '@';
    mmsCommitId: '@';
    mmsWatchId: '<';
    mmsCfLabel: '@';
    mmsGenerateForDiff?: '<';
    noClick?: '<';
    nonEditable?: '<';
    [key: string]: string;
}

export interface TranscludeScope extends IPaneScope {
    $ctrl?: ITransclusion;
    $parent: TranscludeScope;
}

/**
 * @ngdoc component
 * @name veComponents/Transclusion
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
export class Transclusion implements ITransclusion, EditorActions {
    //Regex
    fixPreSpanRegex: RegExp = /<\/span>\s*<mms-cf/g;
    fixPostSpanRegex: RegExp = /<\/mms-cf>\s*<span[^>]*>/g;
    emptyRegex: RegExp = /^\s*$/;
    spacePeriod: RegExp = />(?:\s|&nbsp;)\./g;
    spaceSpace: RegExp = />(?:\s|&nbsp;)(?:\s|&nbsp;)/g;
    spaceComma: RegExp = />(?:\s|&nbsp;),/g;

    //Required Controllers
    protected mmsViewCtrl: ViewController;
    protected mmsViewPresentationElemCtrl: ViewPresentationElemController;
    protected mmsSpecEditorCtrl: SpecTool;

    //Bindings
    mmsElementId: string;
    mmsProjectId: string;
    mmsRefId: string;
    mmsCommitId: string;
    mmsWatchId: string;
    nonEditable: boolean;
    noClick: boolean;
    mmsCfLabel: boolean;
    mmsGenerateForDiff: boolean;
    mmsCallback: () => void;

    //Customizers
    public cfType: string;
    protected cfTitle: string;
    protected cfField: 'name' | 'value' | 'documentation';
    protected cfKind: string;
    protected checkCircular: boolean;
    protected noCompile: boolean = false;

    //Locals
    protected isDeletable: boolean;
    protected editable: () => boolean = () => false;

    public subs: Rx.IDisposable[];

    public commitId: string;
    protected projectId: string;
    protected refId: string;

    public isEditing: boolean = false;
    public inPreviewMode: boolean = false;
    public elementSaving: boolean = false;
    public editLoading: boolean = false;
    public skipBroadcast: boolean;

    public editKey: string | string[];
    public edit: EditObject;
    public element: ElementObject;
    protected type: string = '';
    protected editorType: string;

    public view: ViewObject;
    // public instanceSpec: InstanceSpecObject
    // public instanceVal: InstanceValueObject
    // protected presentationElem: PresentationInstanceObject | ElementObject

    protected panelTitle: string;
    protected panelType: string;

    protected $transcludeEl: JQuery<HTMLElement>;

    // Possible templates to manage api functions
    protected template: string;
    protected editTemplate: string;
    protected previewTemplate: string;

    public bbApi: ButtonBarApi;
    public bbId: string;
    public bars: string[];
    protected buttons: IButtonBarButton[] = [];

    public schema = 'cameo';

    //Default Toolbar Api
    /* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
    cancel(e?): void {}
    reset(e?): void {}
    delete(e?): void {}
    preview(e?): void {}
    save(e?): void {}
    saveC(e?): void {}
    /* eslint-enable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */

    static $inject: string[] = [
        '$q',
        '$scope',
        '$compile',
        '$element',
        'growl',
        'ComponentService',
        'EditorService',
        'EditService',
        'ElementService',
        'UtilsService',
        'SchemaService',
        'EventService',
        'MathService',
        'ExtensionService',
        'ButtonBarService',
        'ImageService',
    ];

    constructor(
        public $q: VeQService,
        public $scope: angular.IScope,
        protected $compile: angular.ICompileService,
        protected $element: JQuery<HTMLElement>,
        protected growl: angular.growl.IGrowlService,
        protected componentSvc: ComponentService,
        protected editorSvc: EditorService,
        protected editSvc: EditService,
        protected elementSvc: ElementService,
        protected utilsSvc: UtilsService,
        protected schemaSvc: SchemaService,
        protected eventSvc: EventService,
        protected mathSvc: MathService,
        protected extensionSvc: ExtensionService,
        protected buttonBarSvc: ButtonBarService,
        protected imageSvc: ImageService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this);

        if ((this.$element.prop('tagName') as string).includes('mms')) {
            this.growl.warning(
                'mmsTransclude(*) Syntax is deprecated and will be removed in a future version' +
                    'please see the release documentation for further details'
            );
        }
        if (this.mmsViewCtrl) {
            this.view = this.mmsViewCtrl.getView();
            this.editable = this.mmsViewCtrl.isEditable;
        }
        if (this.mmsSpecEditorCtrl && this.mmsSpecEditorCtrl.specApi.elementId === this.mmsElementId) {
            this.editable = (): boolean => this.mmsSpecEditorCtrl.specSvc.editable;
        }
        //if (this.editTemplate) {
        this.save = (e: JQuery.ClickEvent): void => {
            if (e) e.stopPropagation();
            this.saveAction(false);
        };

        this.saveC = (): void => {
            this.saveAction(true);
        };

        this.cancel = (e?: JQuery.ClickEvent): void => {
            if (e) e.stopPropagation();
            this.cancelAction();
        };

        this.reset = (e?: JQuery.ClickEvent): void => {
            if (e) e.stopPropagation();
            this.cleanUpAction(true);
        };

        this.preview = (): void => {
            this.previewAction();
        };
        //}
    }

    $onDestroy(): void {
        this.eventSvc.destroy(this.subs);
    }

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        this.watch(onChangesObj);
        handleChange(onChangesObj, 'mmsElementId', this.changeAction);
        handleChange(onChangesObj, 'mmsRefId', this.changeAction);
        handleChange(onChangesObj, 'mmsCommitId', this.changeAction);
    }

    $postLink(): void {
        this.changeAction(this.mmsElementId, '', false);
    }

    /**
     * @name veComponents/Transclusion/watch
     * Allows a transclusion to add its own custom watch behavior
     * which will be triggered by the Angular $onChanges lifecycle hook.
     *
     * @param {angular.IOnChangesObject} onChangesObj
     * @return void
     */
    protected watch: (onChangesObj: angular.IOnChangesObject) => void = () => {
        /* Implement custom watch logic here */
    };

    /**
     * @name veComponents/Transclusion#config
     *     *
     * @protected
     */
    protected destroy: () => void = () => {
        /* Implement Custom Destroy Logic Here */
    };

    public getContent = (preview?: boolean): VePromise<string | HTMLElement[], string> => {
        return this.$q.resolve('Not Yet Implemented');
    };

    protected recompile = (preview?: boolean): void => {
        this.defaultRecompile(preview);
    };

    public defaultRecompile = (preview?: boolean): void => {
        this.getContent(preview).then(
            (result) => {
                this.$element.empty();
                this.$transcludeEl = $(result);
                this.$element.append(this.$transcludeEl);
                this.$compile(this.$transcludeEl)(this.$scope.$new());
                if (this.mmsViewCtrl) {
                    this.mmsViewCtrl.elementTranscluded(this.element, this.type);
                }
                $(this.$element)
                    .find('img')
                    .each((index, element) => {
                        this.imageSvc.fixImgSrc($(element));
                    });
            },
            (reason) => {
                if (reason.status !== 200) {
                    this.growl.error(`Transclusion Error: ${reason.message}`);
                }
            }
        );
    };

    protected changeAction: onChangesCallback<string> = (newVal, oldVal, firstChange) => {
        if (!newVal || !this.mmsProjectId || firstChange || newVal === oldVal) {
            return;
        }
        if (this.checkCircular) {
            if (this.componentSvc.hasCircularReference(this, this.mmsElementId, 'doc')) {
                this.$element.html('<span class="ve-error">Circular Reference!</span>');
                return;
            }
        }
        this.projectId = this.mmsProjectId;
        this.refId = this.mmsRefId ? this.mmsRefId : 'master';
        this.commitId = this.mmsCommitId ? this.mmsCommitId : 'latest';
        if (!this.noCompile) {
            this.$element.html('(loading...)');
        }
        this.$element.addClass('isLoading');
        const reqOb = {
            elementId: this.mmsElementId,
            projectId: this.projectId,
            refId: this.refId,
            commitId: this.commitId,
            //includeRecentVersionElement: true,
        };
        this.elementSvc
            .getElement(reqOb, 1, false)
            .then(
                (data) => {
                    this.element = data;
                    if (!this.panelTitle) {
                        this.panelTitle = this.element.name + ' ' + this.cfTitle;
                        this.panelType = this.cfKind;
                    }
                    if (this.commitId === 'latest') {
                        this.subs.push(
                            this.eventSvc.$on<veCoreEvents.elementUpdatedData>(
                                'element.updated',
                                (data: { element: ElementObject; continueEdit: boolean }) => {
                                    const elementOb = data.element;
                                    const continueEdit = data.continueEdit;
                                    if (
                                        elementOb.id === this.element.id &&
                                        elementOb._projectId === this.element._projectId &&
                                        elementOb._refId === this.element._refId
                                    ) {
                                        this.element = elementOb;
                                        this.cleanUpAction(continueEdit);
                                    }
                                }
                            )
                        );
                    }
                    if (this.editTemplate) {
                        this._reopenUnsaved().then(
                            (data) => {
                                if (data) this.startEdit();
                                else this.recompile();
                            },
                            () => {
                                this.recompile();
                            }
                        );
                    } else {
                        this.recompile();
                    }
                },
                (reason) => {
                    this.$element.empty();
                    //TODO: Add reason/errorMessage handling here.
                    this.$transcludeEl = $(
                        '<annotation mms-element-id="::elementId" mms-recent-element="::recentElement" mms-type="::type" mms-field="::field"></annotation>'
                    );
                    this.$element.append(this.$transcludeEl);
                    this.$compile(this.$transcludeEl)(
                        Object.assign(this.$scope.$new(), {
                            elementId: reqOb,
                            recentElement: reason.recentVersionOfElement,
                            type: 'transclusion',
                            field: this.cfField,
                        })
                    );
                }
            )
            .finally(() => {
                this.$element.removeClass('isLoading');
                if (this.mmsCallback) this.mmsCallback();
            });
    };

    protected bbInit = (api: ButtonBarApi): void => {
        api.addButton(this.buttonBarSvc.getButtonBarButton('editor-preview', this));
        api.addButton(this.buttonBarSvc.getButtonBarButton('editor-save', this));
        api.addButton(this.buttonBarSvc.getButtonBarButton('editor-save-continue', this));
        api.addButton(this.buttonBarSvc.getButtonBarButton('editor-cancel', this));
        api.addButton(this.buttonBarSvc.getButtonBarButton('editor-reset', this));
        api.addButton(this.buttonBarSvc.getButtonBarButton('editor-delete', this));
        api.setPermission('editor-delete', this.isDeletable);
    };

    /**
     * @name Utils#reopenUnsavedElts     * called by transcludes when users have unsaved edits, leaves that view, and comes back to that view.
     * the editor will reopen if there are unsaved edits.
     * assumes no reload.
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   ve_edits - unsaved edits object
     *   startEdit - pop open the editor window
     * @param {ITransclusion} ctrl scope of the transclude directives or view section directive
     * @param {String} transcludeType name, documentation, or value
     */
    private _reopenUnsaved = (): VePromise<boolean> => {
        return new this.$q((resolve, reject) => {
            const key = this.elementSvc.getEditElementKey(this.element);
            const editOb = this.editSvc.get(key);
            if (!editOb || this.commitId !== 'latest') {
                resolve(false);
            } else {
                this.editorSvc.hasEdits(editOb, this.cfField).then(resolve, reject);
            }
        });
    };

    /**
     * @name Transclusion#startEdit     * called by transcludes to add the editor frame
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   isEditing - boolean
     *   commitId - calculated commit id
     *   isEnumeration - boolean
     *   recompileScope - child scope of directive scope
     *   skipBroadcast - boolean (whether to broadcast presentationElem.edit for keeping track of open edits)
     * sets these in the scope:
     *   edit - editable element object
     *   isEditing - true
     *   inPreviewMode - false
     *   editValues - array of editable values (for element that are of type Property, Slot, Port, Constraint)
     *
     */
    protected startEdit(cb?: () => void): void {
        if (this.editable() && !this.isEditing) {
            this.editorSvc
                .openEdit(this.element)
                .then(
                    (data) => {
                        this.isEditing = true;
                        if (this.inPreviewMode) {
                            this.editorSvc.clearAutosave(this.editKey, this.cfField);
                            this.inPreviewMode = false;
                        }
                        this.edit = data;
                        this.editKey = data.key;

                        if (cb) {
                            cb();
                        }
                        if (this.editTemplate) {
                            this.$element.empty();
                            this.$transcludeEl = $(this.editTemplate);

                            this.$element.append(this.$transcludeEl);
                            this.$compile(this.$transcludeEl)(this.$scope.$new());
                        }

                        if (!this.skipBroadcast) {
                            // Broadcast message for the toolCtrl:
                            this.eventSvc.$broadcast('editor.open', this.edit);
                        } else {
                            this.skipBroadcast = false;
                        }
                        this.editorSvc.scrollToElement(this.$element);
                    },
                    (reason: VePromiseReason<ElementsResponse<ElementObject>>) => {
                        this.growl.error(reason.message);
                    }
                )
                .finally(() => {
                    this.editLoading = false;
                });

            this.elementSvc.isCacheOutdated(this.element).then(
                (data) => {
                    if (data.status && data.server._modified > data.cache._modified) {
                        this.growl.warning('This element has been updated on the server');
                    }
                },
                (reason) => {
                    this.growl.error(reason.message);
                }
            );
        }
    }

    protected saveAction(continueEdit?: boolean): void {
        if (this.elementSaving) {
            this.growl.info('Please Wait...');
            return;
        }
        // this.editSvc.clearAutosave(ctrl.element._projectId + ctrl.element._refId + ctrl.element.id, ctrl.edit.type)
        if (this.bbApi) {
            if (!continueEdit) {
                this.bbApi.toggleButtonSpinner('editor-save');
            } else {
                this.bbApi.toggleButtonSpinner('editor-save-continue');
            }
        }

        this.elementSaving = true;

        this.editorSvc
            .save(this.editKey, continueEdit)
            .then(
                (data) => {
                    this.inPreviewMode = false;
                    this.element = data;
                    // do not call here since it's called by element.updated event listener
                    //this.cleanUpAction(continueEdit)

                    //scrollToElement(domElement);
                },
                (reason) => {
                    this.editorSvc.handleError(reason);
                }
            )
            .finally(() => {
                this.elementSaving = false;
                if (this.bbApi) {
                    if (!continueEdit) {
                        this.bbApi.toggleButtonSpinner('editor-save');
                    } else {
                        this.bbApi.toggleButtonSpinner('editor-save-continue');
                    }
                }
            });
    }

    protected cancelAction(): void {
        if (this.elementSaving) {
            this.growl.info('Please Wait...');
            return;
        }

        if (this.bbApi) {
            this.bbApi.toggleButtonSpinner('editor-cancel');
        }
        // const cancelFn: () => VePromise<boolean> = (): VePromise<boolean> => {
        //     if (ctrl.editorApi && ctrl.editorApi.cancel) {
        //         return ctrl.editorApi.cancel()
        //     }
        //     return this.$q.resolve<boolean>(true)
        // }

        this.editorSvc
            .updateEditor(this.edit.key, this.cfField)
            .then(
                (success) => {
                    // Only need to confirm the cancellation if edits have been made:
                    if (!success) {
                        this.editorSvc.handleError({
                            message: 'Problem Saving from Editor',
                            type: 'warning',
                        });
                    }
                    this.editorSvc.hasEdits(this.edit, this.cfField).then(
                        (hasEdits) => {
                            if (hasEdits) {
                                this.editorSvc.deleteEditModal(this.edit).result.then(
                                    (result) => {
                                        if (result) {
                                            this.cleanUpAction();
                                        }
                                    },
                                    () => {
                                        //Do Nothing if user wants to keep working
                                    }
                                );
                            } else {
                                this.cleanUpAction();
                            }
                        },
                        () => {
                            this.cleanUpAction();
                        }
                    );
                },
                () => {
                    this.editorSvc.handleError({
                        message: 'Error Saving from Editor; Please Retry',
                        type: 'error',
                    });
                }
            )
            .finally(() => {
                if (this.bbApi) {
                    this.bbApi.toggleButtonSpinner('editor-cancel');
                }
            });
    }

    public previewAction(): void {
        if (this.elementSaving) {
            this.growl.info('Please Wait...');
            return;
        }
        if (this.edit && this.isEditing) {
            this.editorSvc
                .hasEdits(this.edit)
                .then((hasEdits) => {
                    if (hasEdits && !this.inPreviewMode) {
                        this.skipBroadcast = true; //preview next click to go into edit mode from broadcasting
                        this.inPreviewMode = true;
                        this.recompile(true);
                    } else {
                        //nothing has changed, cancel instead of preview
                        this.growl.info('No edits found! Preview cancelled');
                        this.cleanUpAction();
                    }
                })
                .finally(() => {
                    this.isEditing = false;
                    this.editorSvc.scrollToElement(this.$element);
                });
        }
    }

    public cleanUpAction = (continueEdit?: boolean): void => {
        this.editorSvc.cleanUpEdit(this.editKey);
        this.isEditing = false;
        if (!continueEdit) {
            this.eventSvc.$broadcast('editor.close', this.edit);
            this.recompile();
        } else {
            this.startEdit();
        }
        // scrollToElement(domElement);
    };

    //Transclusion API

    protected hasHtml = (s: string): boolean => {
        return this.componentSvc.hasHtml(s);
    };

    protected cleanupVal(obj: { value: string | number }): void {
        obj.value = parseInt(obj.value as string);
    }

    protected addHtml(e: JQueryEventObject, value: { value: string | number }): void {
        e.stopPropagation();
        value.value = `<p>${value.value}</p>`;
    }
}
