import {veUtils} from "@ve-utils";
import {SchemaMapping} from "@ve-utils/model-schema/Schema.service";

export interface CameoSchema extends SchemaMapping {
    TYPE_TO_CLASSIFIER_ID: {[key: string]: string};
    OPAQUE_CLASSIFIERS: string[] //Should reference ID's from the TYPE_TO_CLASSIFIER_ID Object
    DOCUMENT_IDS: {
        [key: string]: string
    };
    GROUP_ST_ID: string;
}

export class CameoSchemaService implements CameoSchema {
    public jsonName = 'cameo';

    public VIEW_SID = '_11_5EAPbeta_be00301_1147420760998_43940_227';
    public OTHER_VIEW_SID = ['_17_0_1_407019f_1332453225141_893756_11936',
        '_17_0_1_232f03dc_1325612611695_581988_21583', '_18_0beta_9150291_1392290067481_33752_4359'];
    public DOCUMENT_SID = '_17_0_2_3_87b0275_1371477871400_792964_43374';
    public BLOCK_SID = '_11_5EAPbeta_be00301_1147424179914_458922_958';
    public REQUIREMENT_SID = ['_project-bundle_mission_PackageableElement-mission_u003aRequirement_PackageableElement',
        '_18_0_5_f560360_1476403587924_687681_736366','_18_0_5_f560360_1476403587924_687681_736366',
        '_11_5EAPbeta_be00301_1147873190330_159934_2220'];

    public TYPE_TO_CLASSIFIER_TYPE = {
        Table: 'TableT',
        Paragraph: 'ParagraphT',
        Section: 'SectionT',
        Comment: 'ParagraphT',
        List: 'ListT',
        Image: 'ImageT',
        Equation: 'Equation',
        TomSawyerDiagram: 'TomSawyerDiagram',
    }

    public TYPE_TO_CLASSIFIER_ID = {
        Image: '_17_0_5_1_407019f_1430628206190_469511_11978',
        List: '_17_0_5_1_407019f_1430628190151_363897_11927',
        Paragraph: '_17_0_5_1_407019f_1430628197332_560980_11953',
        Table: '_17_0_5_1_407019f_1430628178633_708586_11903',
        Section: '_17_0_5_1_407019f_1430628211976_255218_12002',
        ListT: '_17_0_5_1_407019f_1431903739087_549326_12013',
        TableT: '_17_0_5_1_407019f_1431903724067_825986_11992',
        ImageT: '_17_0_5_1_407019f_1431903748021_2367_12034', //manual images + timely, etc
        Equation: '_17_0_5_1_407019f_1431905053808_352752_11992',
        ParagraphT: '_17_0_5_1_407019f_1431903758416_800749_12055',
        SectionT: '_18_0_2_407019f_1435683487667_494971_14412',
        TomSawyerDiagram: '_18_5_2_8bf0285_1506035630029_725905_15942',
        Figure: '_18_5_2_8bf0285_1506035630979_342273_15944',
        FigureT: '_18_5_2_8bf0285_1506035630029_725905_15942',
    }

    public OPAQUE_CLASSIFIERS = [
        this.TYPE_TO_CLASSIFIER_ID.Image,
        this.TYPE_TO_CLASSIFIER_ID.List,
        this.TYPE_TO_CLASSIFIER_ID.Paragraph,
        this.TYPE_TO_CLASSIFIER_ID.Section,
        this.TYPE_TO_CLASSIFIER_ID.Table,
        this.TYPE_TO_CLASSIFIER_ID.Figure,
    ]

    public DOCUMENT_IDS = {
        HEADER: '_17_0_1_407019f_1326234342817_186479_2256',
        FOOTER: '_17_0_1_407019f_1326234349580_411867_2258',
        NUM_DEPTH: '_18_5_3_8bf0285_1526605771405_96327_15754',
        NUM_SEP: '_18_5_3_8bf0285_1526605817077_688557_15755'
    }



    public GROUP_ST_ID = '_18_5_3_8bf0285_1520469040211_2821_15754'


}


veUtils.service('CameoSchemaService', CameoSchemaService);