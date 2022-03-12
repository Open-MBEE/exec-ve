import * as angular from "angular";
import * as _ from "lodash";
import {Injectable, IQService} from "angular";
import {ElementService} from "../../mms/services/ElementService.service";
import {ViewService} from "../../mms/services/ViewService.service";
import {SpecService} from "./Spec.service";
import {ElementObject} from "../../lib/elementOb";
var mmsDirectives = angular.module('mmsDirectives');


export class ViewReorderService implements Injectable<any> {
    private reorderApi:ViewReorderApi;

    static injector = ['$q', 'ElementService', 'ViewService']
    constructor(private $q: IQService, private elementSvc: ElementService, private viewSvc: ViewService) {
        this.reorderApi = new ViewReorderApi(this.$q, this.elementSvc, this.viewSvc);
    }
    getApi() {
        return this.reorderApi
    }
    destroyApi() {
        this.reorderApi = new ViewReorderApi(this.$q, this.elementSvc, this.viewSvc);
    }
}

export class ViewReorderApi {
    public editing = false;
    editable: boolean;
    elementReferenceTree = [];
    originalElementReferenceTree = [];
    view: ElementObject = {_projectId: "", _refId: "", id: ""}
    mmsElementId: string
    mmsProjectId: string
    mmsCommitId: string
    mmsRefId: string

    constructor(private $q: IQService, private elementSvc: ElementService, private viewSvc: ViewService) {

    }


    public toggleEditing() {
        if (!this.editable)
            return false;
        this.editing = !this.editing;
        return true;
    };
    
    public save() {
        var elementObsToUpdate = [];
        var updateSectionElementOrder = (elementReference) => {
            var sectionEdit = {
                id: elementReference.instanceId,
                //_modified: elementReference.instanceSpecification._modified,
                _projectId: elementReference.instanceSpecification._projectId,
                _refId: elementReference.instanceSpecification._refId,
                type: elementReference.instanceSpecification.type,
                specification: {
                    type: "Expression",
                    operand: null
                }
            };
            //sectionEdit.specialization = _.cloneDeep(elementReference.instanceSpecification.specialization);
            var operand = sectionEdit.specification.operand = [];
            var origOperand = elementReference.instanceSpecification.specification.operand;
            for (var i = 0; i < elementReference.sectionElements.length; i++) {
                operand.push(elementReference.sectionElements[i].instanceVal);
                if (elementReference.sectionElements[i].sectionElements.length > 0)
                    updateSectionElementOrder(elementReference.sectionElements[i]);
            }
            if (!angular.equals(operand, origOperand)) {
                elementObsToUpdate.push(sectionEdit);
            }
        };
    
        var deferred = this.$q.defer();
        if (!this.editable || !this.editing) {
            deferred.reject({type: 'error', message: "View isn't editable and can't be saved."});
            return deferred.promise;
        }
        if (this.elementReferenceTree.length === 0) {
            deferred.reject({type: 'error', message: 'View contents were not initialized properly or is empty.'});
            return deferred.promise;
        }
        var viewEdit = {
            id: this.view.id,
            //_modified: this.view._modified,
            _projectId: this.view._projectId,
            _refId: this.view._refId,
            type: this.view.type,
            _contents: null,
            specification: null,
            view2view: null
        };
        //viewEdit.specialization = _.cloneDeep(this.view.specialization);
        if (this.view._contents)
            viewEdit._contents = JSON.parse(JSON.stringify(this.view._contents));
        if (this.view.specification)
            viewEdit.specification = JSON.parse(JSON.stringify(this.view.specification));
        var contents = viewEdit._contents || viewEdit.specification;
        var origContents = this.view._contents || this.view.specification;
        // Update the View edit object on Save
        if (contents) {
            contents.operand = [];
            for (var i = 0; i < this.elementReferenceTree.length; i++) {
                contents.operand.push(this.elementReferenceTree[i].instanceVal);
            }
        }
        if (viewEdit.view2view)
            delete viewEdit.view2view;
        if (contents && !angular.equals(contents.operand, origContents.operand)) {
            elementObsToUpdate.push(viewEdit);
        }
        for (var j = 0; j < this.elementReferenceTree.length; j++) {
            if (this.elementReferenceTree[j].sectionElements.length > 0)
                updateSectionElementOrder(this.elementReferenceTree[j]);
        }
    
        return this.elementSvc.updateElements(elementObsToUpdate, false);
    };
    
    public revert() {
        this.elementReferenceTree = _.cloneDeep(this.originalElementReferenceTree, (value, key, object) => {
            if (key === 'instanceId' || key === 'instanceSpecification' || key === 'presentationElement' || key === 'instanceVal')
                return value;
            return undefined;
        });
    };
    
    public refresh() {
        var contents = this.view._contents || this.view.specification;
        var reqOb = {elementId: this.mmsElementId, projectId: this.mmsProjectId, refId: this.mmsRefId, commitId: this.mmsCommitId};
        if (contents) {
            this.viewSvc.getElementReferenceTree(reqOb, contents)
                .then((elementReferenceTree) => {
                    this.elementReferenceTree = elementReferenceTree;
                    this.originalElementReferenceTree = _.cloneDeep(elementReferenceTree, (value, key, object) => {
                        if (key === 'instanceId' || key === 'instanceSpecification' || key === 'presentationElement' || key === 'instanceVal')
                            return value;
                        return undefined;
                    });
                }, (reason) => {
                    this.elementReferenceTree = [];
                    this.originalElementReferenceTree = [];
                });
        } else {
            this.elementReferenceTree = [];
            this.originalElementReferenceTree = [];
        }
    };
    
    public setEditing(mode) {
        if (!this.editable && mode)
            return false;
        this.editing = mode;
    };
}

ViewReorderService.$inject = ViewReorderService.injector;

mmsDirectives.service('ViewReorderService', ViewReorderService);