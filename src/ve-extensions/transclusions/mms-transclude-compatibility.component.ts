import {TranscludeDocComponent} from "./components/transclude-doc.component";
import {TranscludeNameComponent} from "./components/transclude-name.component";
import {TranscludeImgComponent} from "@ve-ext/transclusions/components/transclude-img.component";
import {TranscludeArtComponent} from "@ve-ext/transclusions/components/transclude-art.component";
import {TranscludeComComponent} from "@ve-ext/transclusions/components/transclude-com.component";
import {TranscludeGroupDocsComponent} from "@ve-ext/transclusions/components/transclude-group-docs.component";
import {TranscludeValComponent} from "@ve-ext/transclusions/components/transclude-val.component";

import {veExt} from "@ve-ext";


veExt.component('mmsTranscludeDoc', TranscludeDocComponent)
    .component('mmsTranscludeName', TranscludeNameComponent)
    .component('mmsTranscludeImg', TranscludeImgComponent)
    .component('mmsTranscludeArt', TranscludeArtComponent)
    .component('mmsTranscludeCom', TranscludeComComponent)
    .component('mmsTranscludeGroupDocs', TranscludeGroupDocsComponent)
    .component('mmsTranscludeVal', TranscludeValComponent)
