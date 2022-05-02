import {MathJaxObject} from "../types/mathjax";
import {veUtils} from "../ve-utils.module";

export class MathJaxService {
    private promise = Promise.resolve();  // Used to hold chain of typesetting calls
    private mathJax: MathJaxObject = window.MathJax

    static $inject = [];
    constructor() {}

    typeset(element: HTMLElement | HTMLElement[]): Promise<void> {
        this.promise = this.promise.then(() => {
            if (!Array.isArray(element)) {
                element = [element];
            }
            this.mathJax.typesetPromise(element).then(
            )
        })
            .catch((err) => console.log('Typeset failed: ' + err.message));
        return this.promise;
    }
}

veUtils.service('MathJaxService', MathJaxService)