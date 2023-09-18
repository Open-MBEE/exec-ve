// Libraries
// import "angular-sanitize";
// import "angular-growl-v2";
// import "angular-ui-bootstrap";
// import "./html-rendered-diff-merge";

//VE Modules
// import '@ve-utils'
// import '@ve-core'

//Module Main
import './ve-components.module';

import './services';

import './components';

// Extensions
import './trees';
import './diffs';
import './presentations';
import './transclusions';
import './spec-tools';
import './insertions';

export * from './ve-components.module';

import '../ve-extensions';
import { ElementObject } from '@ve-types/mms';

export default 've-components';

export interface PropertySpec {
    options?: ElementObject[];
    isEnumeration?: boolean;
    isSlot?: boolean;
    isTaggedValue?: boolean;
}
