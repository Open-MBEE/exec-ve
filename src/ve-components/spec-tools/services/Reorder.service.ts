import angular from 'angular'
import _ from 'lodash'

import { ElementService, ViewService } from '@ve-utils/mms-api-client'

import { veComponents } from '@ve-components'

import { SpecService } from './Spec.service'

import { VePromise, VeQService } from '@ve-types/angular'
import {
    BulkResponse,
    ElementObject,
    ElementsRequest,
    ExpressionObject,
    InstanceValueObject,
    PresentationReference,
    ViewInstanceSpec,
    ViewObject,
} from '@ve-types/mms'

export class ReorderService {
    static $inject = ['$q', 'growl', 'ElementService', 'ViewService']

    public editing = false
    elementReferenceTree: PresentationReference[] = []
    originalElementReferenceTree: PresentationReference[] = []
    view: ViewObject | ViewInstanceSpec

    constructor(
        private $q: VeQService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private viewSvc: ViewService,
        private specSvc: SpecService
    ) {}

    public save(): VePromise<ElementObject[], BulkResponse<ElementObject>> {
        const elementObsToUpdate: ElementObject[] = []
        const updateSectionElementOrder = (
            elementReference: PresentationReference
        ): void => {
            const sectionEdit: ViewInstanceSpec = {
                id: elementReference.instanceId,
                //_modified: elementReference.instanceSpecification._modified,
                _projectId: elementReference.instanceSpecification._projectId,
                _refId: elementReference.instanceSpecification._refId,
                type: elementReference.instanceSpecification.type,
                specification: _.cloneDeep(
                    elementReference.instanceSpecification.specification
                ),
            }
            //sectionEdit.specialization = _.cloneDeep(elementReference.instanceSpecification.specialization);
            const operand: InstanceValueObject[] =
                (sectionEdit.specification.operand = [])

            if (!elementReference.instanceSpecification.specification) {
                this.growl.error('Malformed Reference Tree; Aborting')
            }
            const origOperand = (
                elementReference.instanceSpecification
                    .specification as ExpressionObject<InstanceValueObject>
            ).operand
            elementReference.sectionElements.forEach(
                (sectionElement, index) => {
                    operand.push(sectionElement.instanceVal)
                    if (sectionElement.sectionElements.length > 0)
                        updateSectionElementOrder(sectionElement)
                }
            )

            if (!_.isEqual(operand, origOperand)) {
                elementObsToUpdate.push(sectionEdit)
            }
        }

        const deferred = this.$q.defer<ElementObject[]>()
        if (!this.specSvc.editable || !this.specSvc.getEditing()) {
            deferred.reject({
                type: 'error',
                message: "View isn't editable and can't be saved.",
            })
            return deferred.promise
        }
        if (this.elementReferenceTree.length === 0) {
            deferred.reject({
                type: 'error',
                message:
                    'View specs were not initialized properly or is empty.',
            })
            return deferred.promise
        }
        const viewEdit: ViewInstanceSpec | ViewObject = {
            id: this.view.id,
            //_modified: this.view._modified,
            _projectId: this.view._projectId,
            _refId: this.view._refId,
            type: this.view.type,
            specification: null,
        }
        if (this.view.specification) {
            viewEdit.specification = _.cloneDeep(
                (this.view as ViewInstanceSpec).specification
            )
            const specs = (viewEdit as ViewInstanceSpec).specification
            const origSpecs = (this.view as ViewInstanceSpec).specification
            // Update the View edit object on Save
            if (specs.operand) {
                specs.operand = []
                this.elementReferenceTree.forEach((elementRef) => {
                    ;(specs as ExpressionObject).operand.push(
                        elementRef.instanceVal
                    )
                })
                if (specs && !_.isEqual(specs.operand, origSpecs.operand)) {
                    elementObsToUpdate.push(viewEdit)
                }
            }
            // Recurse
            this.elementReferenceTree.forEach((elementReference) => {
                if (
                    elementReference.sectionElements &&
                    elementReference.sectionElements.length > 0
                ) {
                    updateSectionElementOrder(elementReference)
                }
            })
        }

        return this.elementSvc.updateElements(elementObsToUpdate, false)
    }

    public revert = (): void => {
        this.elementReferenceTree = _.cloneDeepWith(
            this.originalElementReferenceTree,
            (value: unknown, key) => {
                if (
                    key === 'instanceId' ||
                    key === 'instanceSpecification' ||
                    key === 'presentationElement' ||
                    key === 'instanceVal'
                )
                    return value
                return undefined
            }
        ) as PresentationReference[]
    }

    public refresh = (): void => {
        let contents: ExpressionObject<InstanceValueObject> = null
        if (this.view._contents) {
            contents = (this.view as ViewObject)._contents
        }
        if (this.view.specification) {
            contents = (this.view as ViewInstanceSpec).specification
        }
        const reqOb: ElementsRequest<string> = {
            elementId: this.specSvc.specApi.elementId,
            projectId: this.specSvc.specApi.projectId,
            refId: this.specSvc.specApi.refId,
            commitId: this.specSvc.specApi.commitId,
        }
        if (contents) {
            this.viewSvc.getElementReferenceTree(reqOb, contents).then(
                (elementReferenceTree) => {
                    this.elementReferenceTree = elementReferenceTree
                    this.originalElementReferenceTree = _.cloneDeepWith(
                        elementReferenceTree,
                        (value: unknown, key) => {
                            if (
                                key === 'instanceId' ||
                                key === 'instanceSpecification' ||
                                key === 'presentationElement' ||
                                key === 'instanceVal'
                            )
                                return value
                            return undefined
                        }
                    ) as PresentationReference[]
                },
                (reason) => {
                    this.elementReferenceTree = []
                    this.originalElementReferenceTree = []
                }
            )
        } else {
            this.elementReferenceTree = []
            this.originalElementReferenceTree = []
        }
    }
}

veComponents.service('ReorderService', ReorderService)
