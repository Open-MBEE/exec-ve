import * as angular from "angular";
import {IQService} from "angular";
import * as _ from "lodash";
import{ElementService, ViewService} from "@ve-utils/mms-api-client";
import {ViewObject} from "@ve-types/mms";
import {SpecService} from "./Spec.service";
import {veExt} from "@ve-ext";

export interface ElementReferences extends ViewObject {
    sectionElements?: any
    instanceVal?: any
}

export class ReorderService {

    static $inject = ['$q', 'ElementService', 'ViewService'];

    public editing = false;
    editable: boolean;
    elementReferenceTree: ElementReferences[] = [];
    originalElementReferenceTree: ElementReferences[] = [];
    view: ViewObject = {_projectId: "", _refId: "", id: "", type: "Class"}

    constructor(private $q: IQService, private elementSvc: ElementService, private viewSvc: ViewService, private specSvc: SpecService) {
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
            for (let i = 0; i < elementReference.sectionElements.length; i++) {
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
            deferred.reject({type: 'error', message: 'View specs were not initialized properly or is empty.'});
            return deferred.promise;
        }
        var viewEdit = {
            id: this.view.id,
            //_modified: this.view._modified,
            _projectId: this.view._projectId,
            _refId: this.view._refId,
            type: this.view.type,
            _specs: null,
            specification: null,
            view2view: null
        };
        //viewEdit.specialization = _.cloneDeep(this.view.specialization);
        if (this.view._specs)
            viewEdit._specs = JSON.parse(JSON.stringify(this.view._specs));
        if (this.view.specification)
            viewEdit.specification = JSON.parse(JSON.stringify(this.view.specification));
        var specs = viewEdit._specs || viewEdit.specification;
        var origSpecs = this.view._specs || this.view.specification;
        // Update the View edit object on Save
        if (specs) {
            specs.operand = [];
            for (let i = 0; i < this.elementReferenceTree.length; i++) {
                specs.operand.push(this.elementReferenceTree[i].instanceVal);
            }
        }
        if (viewEdit.view2view)
            delete viewEdit.view2view;
        if (specs && !angular.equals(specs.operand, origSpecs.operand)) {
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
        var specs = this.view._specs || this.view.specification;
        var reqOb = {elementId: this.specSvc.specApi.elementId, projectId: this.specSvc.specApi.projectId, refId: this.specSvc.specApi.refId, commitId: this.specSvc.specApi.commitId};
        if (specs) {
            this.viewSvc.getElementReferenceTree(reqOb, specs)
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

veExt.service('ReorderService', ReorderService);
