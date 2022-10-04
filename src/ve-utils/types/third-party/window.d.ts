//https://stackoverflow.com/questions/57132428/augmentations-for-the-global-scope-can-only-be-directly-nested-in-external-modul
import CKEDITOR from "@ve-types/third-party";
import {VeConfig} from "./config";
import {HtmlRenderedDiff} from "../../../lib/html-rendered-diff";

export {};

declare global {
  interface Window {
    $: JQuery;
    MathJax;
    CKEDITOR: CKEDITOR;
    __env: VeConfig;
    HtmlRenderedDiff: HtmlRenderedDiff;
    Promise: Promise
  }
}
