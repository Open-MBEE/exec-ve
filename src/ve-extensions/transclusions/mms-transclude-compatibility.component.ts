import {TranscludeDocComponent} from "./transclude-doc.component";
import {TranscludeNameComponent} from "./transclude-name.component";

import {veExt} from "../ve-extensions.module";

veExt.component('mmsTranscludeDoc', TranscludeDocComponent)
    .component('mmsTranscludeName', TranscludeNameComponent)