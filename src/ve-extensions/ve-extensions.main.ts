import ve, {VeExtensionOptions} from "./ve-extensions.d"
//Dependencies
import "angular-sanitize";

//Module Main
import "./ve-extensions.module"

import "./views"

if (window.__env.extensions) {
    for(let extension of window.__env.extensions) {
        let ext = extension as VeExtensionOptions;
        if (ext.path) {
            import(ext.path);
        }
    }
}