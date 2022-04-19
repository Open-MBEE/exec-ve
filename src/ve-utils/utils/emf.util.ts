import {ElementObject} from "../types/mms";

export class Element implements ElementObject {
    id: string = ''
    _projectId: string = ''
    _refId: string = ''
    _appliedStereotypeIds?: string[] = []
    appliedStereotypeInstanceId?: string | null = null
    documentation?: string = ''
    mdExtensionsIds?: string[] = []
    syncElementId?: string | null = null
    type: string = 'Element'

    constructor(elementOb?: ElementObject) {
        if (elementOb) {
            Object.assign(this, elementOb)
        }
    }
}
export class NamedElement extends Element {
    name: string = ""
    nameExpression: string | null = null
    clientDependencyIds: string[] = []
    supplierDependencyIds: string[] = []
}

class PackageableElement extends NamedElement {
    ownerId: string | null = null
    visibility: string | null = "public"
    templateParameterId: string | null = null

}

class TypedElement extends PackageableElement {
    typeId: string | null = null
}

class TemplateableElement extends PackageableElement {
    templateBindingIds: string[] = []
}



export class Property extends TypedElement {
    type = "Property"
    defaultValue: any[] = []
}

export class Class extends TemplateableElement {
    classifierBehaviorId: string | null = null
    collaborationUseIds:string[] = []
    elementImportIds:string[] = []
    generalizationIds:string[] = []
    classRealizationIds:string[] = []
    isAbstract:boolean = false
    isActive:boolean = false
    isFinalSpecialization:boolean = false
    isLeaf: boolean = false
    ownedAttributeIds: string[] = []
    ownedOperationIds: string[] = []
    packageImportIds: string[] = []
    powertypeExtentIds: string[] = []
    redefinedClassifierIds: string[] = []
    representationI: string[] = []


    type = "Class"
    useCaseIds: string[] = []
}
export class InstanceSpec extends PackageableElement {
    classifierIds:string[] = []
    deploymentIds:string[] = []
    slotIds:string[] = []
    specification: Element | null = null
    stereotypedElementId: string | null = null
    type = "InstanceSpecification"

}

export class ValueSpec extends TypedElement {
    valueExpression:string = ""
    operand: any[] = []
    type = "ValueSpecification"
}

export class Package extends TemplateableElement {
    type = "Package"
    visibility =  null
    elementImportIds:string[] = []
    packageImportIds:string[] = []
    URI: string = ""
    packageMergeIds:string[] = []
    profileApplicationIds:string[] = []
}
export class Generalization extends Element {
    generalizationSetIds:string[] = []
    isSubstitutable:boolean = true
    type = "Generalization"
}
export class Dependency extends PackageableElement {
    type = "Dependency"
    visibility = null
}
