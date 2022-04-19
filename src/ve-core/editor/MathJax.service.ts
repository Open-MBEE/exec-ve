import angular from "angular";




import {veCore} from "../ve-core.module";

export class MathJaxService {
    private promise = Promise.resolve();  // Used to hold chain of typesetting calls

    static $inject = [];
    constructor() {}

    typeset(element, scope) {
        if (!Array.isArray(element)) {
            element = [element];
        }
        this.promise = this.promise.then(() => {
            window.MathJax.typesetPromise(element).then(scope.$apply())
        })
            .catch((err) => console.log('Typeset failed: ' + err.message));
        return this.promise;
    }
}

veCore.service('MathJaxService', MathJaxService)