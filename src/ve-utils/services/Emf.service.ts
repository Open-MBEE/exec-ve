import {Class, Dependency, Generalization, InstanceSpec, Package, ValueSpec} from "../utils/emf.util";


import {veUtils} from "@ve-utils";

export class EmfService {
    /**
     * @ngdoc method
     * @name veUtils/UtilsService#createClassElement
     * @methodOf veUtils/UtilsService
     *
     * @description
     * returns a class object with all emf fields set to default, with
     * fields from passed in object substituted
     *
     */
    public createClassElement(obj): Class {
        return new Class(obj)
    };

    public createInstanceElement(obj) {
        return new InstanceSpec(obj);
    };

    public createValueSpecElement(obj) {
        return new ValueSpec(obj);
    };

    public createGeneralizationElement(obj) {
        return new Generalization(obj)
    };

    public createPackageElement(obj) {
        return new Package(obj)
    };

    public createDependencyElement(obj) {
        return new Dependency(obj);
    };

}

veUtils.service('EmfService', EmfService);