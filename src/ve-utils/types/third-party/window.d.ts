//https://stackoverflow.com/questions/57132428/augmentations-for-the-global-scope-can-only-be-directly-nested-in-external-modul
import CKEDITOR from "../../lib/types/ckeditor";
import {VeConfig} from "./config";

export {};

declare global {
  interface Window {
    $: JQuery;
    MathJax;
    CKEDITOR: typeof CKEDITOR;
    __env: VeConfig;
  }
}