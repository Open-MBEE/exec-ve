import { MathJaxObject } from 'mathjax-full/js/components/startup';

import { veUtils } from '@ve-utils';

export class MathService {
    private promise = Promise.resolve(); // Used to hold chain of typesetting calls
    private mathJax: MathJaxObject = window.MathJax;

    static $inject = [];

    typeset(element: HTMLElement | HTMLElement[]): Promise<void> {
        this.promise = this.promise
            .then(() => {
                if (!Array.isArray(element)) {
                    element = [element];
                }
                (this.mathJax.typesetPromise as (elements: HTMLElement[]) => Promise<void>)(element).catch(
                    (err: { message: string }) => console.log(`Typeset failed: ${err.message}`)
                );
            })
            .catch((err: { message: string }) => console.log(`Typeset failed: ${err.message}`));
        return this.promise;
    }
}

veUtils.service('MathService', MathService);
