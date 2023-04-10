import { ITransclusion } from '@ve-components/transclusions'
import { ApiService } from '@ve-utils/mms-api-client/Api.service'
import { ElementService } from '@ve-utils/mms-api-client/Element.service'
import { ValueSpec } from '@ve-utils/utils'

import { PropertySpec } from '@ve-components'

import { veUtils } from '@ve-utils'

import { VePromise, VeQService } from '@ve-types/angular'
import {
    ConstraintObject,
    ElementObject,
    ElementsRequest,
    ElementTaggedValueObject,
    ElementValueObject,
    ExpressionObject,
    InstanceValueObject,
    LiteralObject,
    SlotObject,
    TaggedValueObject,
    ValueObject,
} from '@ve-types/mms'

export class ValueService {
    constructor(
        private $q: VeQService,
        private growl: angular.growl.IGrowlService,
        private apiSvc: ApiService,
        private elementSvc: ElementService
    ) {}
    public setupValEditFunctions(ctrl: { propertySpec: PropertySpec } & ITransclusion): void {
        ctrl.addValueTypes = {
            string: 'LiteralString',
            boolean: 'LiteralBoolean',
            integer: 'LiteralInteger',
            real: 'LiteralReal',
        }
        ctrl.addValue = (type: string): void => {
            let newValueSpec: ValueSpec
            let elementOb: LiteralObject<unknown> = {
                id: '',
                _projectId: ctrl.mmsProjectId,
                _refId: ctrl.mmsRefId,
                type: '',
            }
            switch (type) {
                case 'LiteralBoolean': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: false,
                        id: this.apiSvc.createUniqueId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                case 'LiteralInteger': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: 0,
                        id: this.apiSvc.createUniqueId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                case 'LiteralString': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: '',
                        id: this.apiSvc.createUniqueId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                case 'LiteralReal': {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: 0.0,
                        id: this.apiSvc.createUniqueId(),
                        ownerId: ctrl.element.id,
                    })
                    newValueSpec = new ValueSpec(elementOb)
                    break
                }
                default: {
                    elementOb = Object.assign(elementOb, {
                        type: type,
                        value: {},
                        id: this.apiSvc.createUniqueId(),
                        ownerId: ctrl.element.id,
                    })
                }
            }

            ctrl.editValues.push(newValueSpec)
            if (ctrl.element.type == 'Property' || ctrl.element.type == 'Port') {
                ctrl.edit.defaultValue = newValueSpec
            }
        }
        ctrl.addValueType = 'LiteralString'

        ctrl.addEnumerationValue = (): void => {
            let newValueSpec: InstanceValueObject | ElementValueObject = new ValueSpec({
                type: 'InstanceValue',
                instanceId: ctrl.propertySpec.options[0],
                _projectId: ctrl.mmsProjectId,
                _refId: ctrl.mmsRefId,
                id: this.apiSvc.createUniqueId(),
                ownerId: ctrl.element.id,
            })
            if (ctrl.propertySpec.isTaggedValue) {
                newValueSpec = new ValueSpec({
                    type: 'ElementValue',
                    elementId: ctrl.propertySpec.options[0],
                    _projectId: ctrl.mmsProjectId,
                    _refId: ctrl.mmsRefId,
                    id: this.apiSvc.createUniqueId(),
                    ownerId: ctrl.element.id,
                })
            }
            ctrl.editValues.push(newValueSpec)
            if (ctrl.element.type == 'Property' || ctrl.element.type == 'Port') {
                ctrl.edit.defaultValue = newValueSpec
            }
        }

        ctrl.removeVal = (i): void => {
            ctrl.editValues.splice(i, 1)
        }
    }

    public setupValCf(elementOb: ElementObject): ValueObject[] {
        if (elementOb.type === 'Property' || elementOb.type === 'Port') {
            if (elementOb.defaultValue) {
                return [elementOb.defaultValue] as ValueObject[]
            } else {
                return []
            }
        }
        if (elementOb.type === 'Slot') {
            return (elementOb as SlotObject).value
        }
        if (elementOb.type === 'Constraint' && elementOb.specification) {
            return [(elementOb as ConstraintObject).specification]
        }
        if (elementOb.type === 'Expression') {
            return (elementOb as ExpressionObject<ValueObject>).operand
        }
        const i = elementOb.type.indexOf('TaggedValue')
        if (i > 0) {
            let spoofType = ''
            const type = elementOb.type.slice(0, i)
            if (type === 'Element') {
                spoofType = 'ElementValue'
                elementOb.value = []
                for (const [index, val] of (elementOb as ElementTaggedValueObject).valueIds.entries()) {
                    ;(elementOb as ElementTaggedValueObject).value.push({
                        id: `${elementOb.id}-slotvalue-${index}-elementvalue`,
                        type: spoofType,
                        elementId: val,
                        _projectId: elementOb._projectId,
                        _refId: elementOb._refId,
                    } as ElementValueObject)
                }
            } else {
                spoofType = `Literal${type}`
                for (const val of (elementOb as TaggedValueObject).value) {
                    val.type = spoofType
                }
            }
            return (elementOb as TaggedValueObject).value
        }
    }

    /**
     * @name Utils#isEnumeration
     * Check if element is enumeration and if true get enumerable options
     *
     * @param {object} elementOb element object
     * @return {Promise} promise would be resolved with options and if object is enumerable.
     *      For unsuccessful saves, it will be rejected with an object with reason.
     */
    public isEnumeration(elementOb: ElementObject): VePromise<PropertySpec> {
        const deferred = this.$q.defer<PropertySpec>()
        if (elementOb.type === 'Enumeration') {
            const isEnumeration = true
            const reqOb: ElementsRequest<string> = {
                elementId: elementOb.id,
                projectId: elementOb._projectId,
                refId: elementOb._refId,
            }
            const query = {
                params: {
                    ownerId: elementOb.id,
                },
            }
            this.elementSvc.search<ElementObject>(reqOb, query).then(
                (val) => {
                    const newArray: ElementObject[] = []
                    // Filter for enumeration type
                    for (let i = 0; i < val.elements.length; i++) {
                        if (val.elements[i].type === 'EnumerationLiteral') {
                            newArray.push(val.elements[i])
                        }
                    }
                    newArray.sort((a, b) => {
                        return a.name.localeCompare(b.name)
                    })
                    deferred.resolve({
                        options: newArray,
                        isEnumeration: isEnumeration,
                    })
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
        } else {
            deferred.resolve({ options: [], isEnumeration: false })
        }
        return deferred.promise
    }

    public getPropertySpec(elementOb: ElementObject): VePromise<PropertySpec> {
        const deferred = this.$q.defer<PropertySpec>()
        let id: string = elementOb.typeId
        let isSlot = false
        let isEnumeration = false
        let isTaggedValue = false
        let options: ElementObject[] = []
        if (elementOb.type === 'Slot') {
            isSlot = true
            id = (elementOb as SlotObject).definingFeatureId
        }
        if (elementOb.type.includes('TaggedValue')) {
            isTaggedValue = true
            id = (elementOb as TaggedValueObject).tagDefinitionId
        }
        if (!id) {
            //no property type, will not be enum
            deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
            return deferred.promise
        }
        // Get defining feature or type info
        const reqOb = {
            elementId: id,
            projectId: elementOb._projectId,
            refId: elementOb._refId,
        }
        this.elementSvc.getElement(reqOb).then(
            (value) => {
                if (isSlot || isTaggedValue) {
                    if (!value.typeId) {
                        deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
                        return
                    }
                    //if it is a slot or tagged value check if the definition type is enumeration
                    reqOb.elementId = value.typeId
                    this.elementSvc.getElement(reqOb).then(
                        (val) => {
                            this.isEnumeration(val).then(
                                (enumValue: PropertySpec) => {
                                    if (enumValue.isEnumeration) {
                                        isEnumeration = enumValue.isEnumeration
                                        options = enumValue.options
                                    }
                                    deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
                                },
                                () => {
                                    deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
                                }
                            )
                        },
                        () => {
                            deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
                        }
                    )
                } else {
                    this.isEnumeration(value).then(
                        (enumValue) => {
                            if (enumValue.isEnumeration) {
                                isEnumeration = enumValue.isEnumeration
                                options = enumValue.options
                            }
                            deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
                        },
                        (reason) => {
                            deferred.reject(reason)
                        }
                    )
                }
            },
            (reason) => {
                deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue })
            }
        )
        return deferred.promise
    }
}

veUtils.service('ValueService', ValueService)
