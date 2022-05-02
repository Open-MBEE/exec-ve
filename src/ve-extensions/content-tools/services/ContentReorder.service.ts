import * as angular from "angular";
import * as _ from "lodash";
import {Injectable, IQService} from "angular";
import {ElementService} from "../../../ve-utils/services/Element.service";
import {ViewService} from "../../../ve-utils/services/View.service";
import {ViewObject} from "../../../ve-utils/types/mms";
import {veCore} from "../../../ve-core/ve-core.module";
import {SpecObject, SpecService} from "./Spec.service";

export interface ElementReferences extends ViewObject {
    sectionElements?: any
    instanceVal?: any
}

export class ContentReorderService {

    static $inject = ['$q', 'ElementService', 'ViewService'];

    public editing = false;
    editable: boolean;
    elementReferenceTree: ElementReferences[] = [];
    originalElementReferenceTree: ElementReferences[] = [];
    view: ViewObject = {_projectId: "", _refId: "", id: "", type: "Class"}
    // mmsElementId: string
    // mmsProjectId: string
    // mmsCommitId: string
    // mmsRefId: string
    specInfo: SpecObject

    constructor(private $q: IQService, private elementSvc: ElementService, private viewSvc: ViewService, private specSvc: SpecService) {
        this.specInfo = this.specSvc.specInfo;
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
        this.elementReferenceTree = _.cloneDeepWith(this.originalElementReferenceTree, (value, key) => {
            if (key === 'instanceId' || key === 'instanceSpecification' || key === 'presentationElement' || key === 'instanceVal')
                return value;
            return undefined;
        });
    };
    
    public refresh() {
        var contents = this.view._contents || this.view.specification;
        var reqOb = {elementId: this.specInfo.id, projectId: this.specInfo.projectId, refId: this.specInfo.refId, commitId: this.specInfo.commitId};
        if (contents) {
            this.viewSvc.getElementReferenceTree(reqOb, contents)
                .then((elementReferenceTree) => {
                    this.elementReferenceTree = elementReferenceTree;
                    this.originalElementReferenceTree = _.cloneDeepWith(elementReferenceTree, (value, key) => {
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

veCore.service('ContentReorderService', ContentReorderService);