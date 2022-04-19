
//https://stackoverflow.com/questions/57132428/augmentations-for-the-global-scope-can-only-be-directly-nested-in-external-modul
import CKEDITOR from "../../lib/ckeditor/ckeditor";

export {};

declare global {
  interface Window {
    MathJax;
    CKEDITOR: typeof CKEDITOR;
    __env;
  }
}