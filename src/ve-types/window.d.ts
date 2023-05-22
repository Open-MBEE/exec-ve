//https://stackoverflow.com/questions/57132428/augmentations-for-the-global-scope-can-only-be-directly-nested-in-external-modul
import { MathJaxObject } from 'mathjax-full/js/components/startup';

import { HtmlRenderedDiff } from '../lib/html-rendered-diff';

import { VeConfig } from '@ve-types/config';

export {};

declare global {
    interface Window {
        $: JQuery;
        MathJax: MathJaxObject;
        __env: VeConfig;
        HtmlRenderedDiff: HtmlRenderedDiff;
        Promise: Promise;
    }
}
