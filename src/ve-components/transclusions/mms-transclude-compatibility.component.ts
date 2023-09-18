import { TranscludeArtComponent } from '@ve-components/transclusions/components/transclude-art.component';
import { TranscludeComComponent } from '@ve-components/transclusions/components/transclude-com.component';
import { TranscludeGroupDocsComponent } from '@ve-components/transclusions/components/transclude-group-docs.component';
import { TranscludeImgComponent } from '@ve-components/transclusions/components/transclude-img.component';
import { TranscludeValComponent } from '@ve-components/transclusions/components/transclude-val.component';

import { veComponents } from '@ve-components';

import { TranscludeDocComponent } from './components/transclude-doc.component';
import { TranscludeNameComponent } from './components/transclude-name.component';

veComponents
    .component('mmsTranscludeDoc', TranscludeDocComponent)
    .component('mmsTranscludeName', TranscludeNameComponent)
    .component('mmsTranscludeImg', TranscludeImgComponent)
    .component('mmsTranscludeArt', TranscludeArtComponent)
    .component('mmsTranscludeCom', TranscludeComComponent)
    .component('mmsTranscludeGroupDocs', TranscludeGroupDocsComponent)
    .component('mmsTranscludeVal', TranscludeValComponent);
