import ve, {VeExtensionOptions} from "./ve-extensions.d"
//Libraries
// import "angular-sanitize";
// import "angular-growl-v2";
// import "angular-ui-bootstrap";

//VE Modules
import "../ve-core"
import "../ve-utils"

//Module Main
import "./ve-extensions.module"

import "./utilities"
import "./transclusions"
import "./views"

if (window.__env.extensions) {
    for(let extension of window.__env.extensions) {
        let ext = extension as VeExtensionOptions;
        if (ext.path) {
            import(ext.path);
        }
    }
}