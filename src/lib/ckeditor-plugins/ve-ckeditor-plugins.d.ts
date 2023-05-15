declare namespace CKEDITOR {
    namespace plugins {
        interface autoSaveConfig {
            delay?: number;
            messageType?: string;
            saveOnDestroy?: boolean;
            saveDetectionSelectors?: string;
            diffType?: string;
            autoLoad?: boolean;
            NotOlderThen?: number;
            enableAutosave?: boolean;
            SaveKey?;
        }
    }

    interface config {
        //MMS Specific
        autosave?: plugins.autoSaveConfig;
        mmscf?: { callbackModalFnc: (ed: editor) => void };
        mmscomment?: { callbackModalFnc: (ed: editor) => void };
        mmsvlink?: { callbackModalFnc: (ed: editor) => void };
        mmsreset?: { callback: (ed: editor) => void };
    }
}
