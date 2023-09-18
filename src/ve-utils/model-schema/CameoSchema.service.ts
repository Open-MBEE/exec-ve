import { Schema, SchemaMapping } from '@ve-utils/model-schema/Schema.service';

import { veUtils } from '@ve-utils';

export class CameoSchema implements Schema {
    jsonName = 'cameo';
    schema: SchemaMapping = {
        VIEW_SID: '_11_5EAPbeta_be00301_1147420760998_43940_227',
        OTHER_VIEW_SID: [
            '_17_0_1_407019f_1332453225141_893756_11936',
            '_17_0_1_232f03dc_1325612611695_581988_21583',
            '_18_0beta_9150291_1392290067481_33752_4359',
        ],
        DOCUMENT_SID: '_17_0_2_3_87b0275_1371477871400_792964_43374',
        BLOCK_SID: '_11_5EAPbeta_be00301_1147424179914_458922_958',
        REQUIREMENT_SID: [
            '_project-bundle_mission_PackageableElement-mission_u003aRequirement_PackageableElement',
            '_18_0_5_f560360_1476403587924_687681_736366',
            '_18_0_5_f560360_1476403587924_687681_736366',
            '_11_5EAPbeta_be00301_1147873190330_159934_2220',
        ],
        TYPE_TO_CLASSIFIER_TYPE: {
            Table: 'TableT',
            Paragraph: 'ParagraphT',
            Section: 'SectionT',
            Comment: 'ParagraphT',
            List: 'ListT',
            Image: 'ImageT',
            Equation: 'Equation',
            TomSawyerDiagram: 'TomSawyerDiagram',
        },
        TYPE_TO_CLASSIFIER_ID: {
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
        },
        DOCUMENT_IDS: {
            Header: '_17_0_1_407019f_1326234342817_186479_2256',
            Footer: '_17_0_1_407019f_1326234349580_411867_2258',
            NumDepth: '_18_5_3_8bf0285_1526605771405_96327_15754',
            NumSep: '_18_5_3_8bf0285_1526605817077_688557_15755',
        },
        GROUP_ST_ID: '_18_5_3_8bf0285_1520469040211_2821_15754',
    };
    map: SchemaMapping = {
        OPAQUE_CLASSIFIERS: [
            this.schema.TYPE_TO_CLASSIFIER_ID['Image'],
            this.schema.TYPE_TO_CLASSIFIER_ID['List'],
            this.schema.TYPE_TO_CLASSIFIER_ID['Paragraph'],
            this.schema.TYPE_TO_CLASSIFIER_ID['Section'],
            this.schema.TYPE_TO_CLASSIFIER_ID['Table'],
            this.schema.TYPE_TO_CLASSIFIER_ID['Figure'],
        ],
    };
}

veUtils.service('CameoSchema', CameoSchema);

// TODO: Create Cameo Project Creation Service
// {
//     "elements": [
//     {
//         "id": "{{projectId}}_pm",
//         "type": "Model",
//         "documentation": "Created Automatically by MBEE System",
//         "appliedStereotypeInstanceId": "{{projectId}}_pm_asi",
//         "ownerId": "{{projectId}}"
//     },
//     {
//         "id": "{{projectId}}_pm_asi",
//         "stereotypedElementId": "{{projectId}}_pm",
//         "appliedStereotypeInstanceId": null,
//         "type": "InstanceSpecification",
//         "ownerId": "{{projectId}}_pm",
//         "slotIds": [
//             "{{projectId}}_pm_asi-slot-_17_0_2_3_407019f_1383165366792_59388_29094"
//         ],
//         "classifierIds": [
//             "_17_0_2_3_407019f_1383165357327_898985_29071"
//         ],
//         "visibility": null,
//         "documentation": "",
//         "specification": null,
//         "name": ""
//     },
//     {
//         "appliedStereotypeInstanceId": null,
//         "type": "Slot",
//         "ownerId": "{{projectId}}_pm_asi",
//         "owningInstanceId": "{{projectId}}_pm_asi",
//         "id": "{{projectId}}_pm_asi-slot-_17_0_2_3_407019f_1383165366792_59388_29094",
//         "value": [
//             {
//                 "type": "LiteralString",
//                 "ownerId": "{{projectId}}_pm_asi-slot-_17_0_2_3_407019f_1383165366792_59388_29094",
//                 "owningSlotId": "{{projectId}}_pm_asi-slot-_17_0_2_3_407019f_1383165366792_59388_29094",
//                 "owningPackageId": null,
//                 "id": "{{projectId}}_pm_asi-slot-_17_0_2_3_407019f_1383165366792_59388_29094-slotvalue-0-literalstring",
//                 "supplierDependencyIds": [],
//                 "value": "https://cae-mms-lb.jpl.nasa.gov"
//             },
//             {
//                 "type": "LiteralString",
//                 "ownerId": "{{projectId}}_pm_asi-slot-_17_0_2_3_407019f_1383165366792_59388_29094",
//                 "owningSlotId": "{{projectId}}_pm_asi-slot-_17_0_2_3_407019f_1383165366792_59388_29094",
//                 "id": "{{projectId}}_pm_asi-slot-_17_0_2_3_407019f_1383165366792_59388_29094-slotvalue-1-literalstring",
//                 "supplierDependencyIds": [],
//                 "value": "http://localhost:8080"
//             }
//         ],
//         "definingFeatureId": "_17_0_2_3_407019f_1383165366792_59388_29094"
//     },
//     {
//         "twcVersion": -1,
//         "mountedElementId": "PROJECT-4b2e0639-8830-47bd-b0fc-91b3aabb5e45_pm",
//         "mountedElementProjectId": "PROJECT-4b2e0639-8830-47bd-b0fc-91b3aabb5e45",
//         "type": "Mount",
//         "mountedRefId": "master",
//         "ownerId": "{{projectId}}_pm"
//     },
//     {
//         "twcVersion": -1,
//         "mountedElementId": "PROJECT-72379b04-6dc6-43b6-8e2b-e79a5a6de142_pm",
//         "mountedElementProjectId": "PROJECT-72379b04-6dc6-43b6-8e2b-e79a5a6de142",
//         "type": "Mount",
//         "mountedRefId": "master",
//         "ownerId": "{{projectId}}_pm"
//     },
//     {
//         "twcVersion": -1,
//         "mountedElementId": "PROJECT-275116e7-5669-4796-8d65-3c2c8c8d3f9e_pm",
//         "mountedElementProjectId": "PROJECT-275116e7-5669-4796-8d65-3c2c8c8d3f9e",
//         "type": "Mount",
//         "mountedRefId": "master",
//         "ownerId": "{{projectId}}_pm"
//     },
//     {
//         "twcVersion": -1,
//         "mountedElementId": "PROJECT-44892a3bf693c0a47eb2f3bf10930f_pm",
//         "mountedElementProjectId": "PROJECT-44892a3bf693c0a47eb2f3bf10930f",
//         "type": "Mount",
//         "mountedRefId": "master",
//         "ownerId": "{{projectId}}_pm"
//     },
//     {
//         "twcVersion": -1,
//         "mountedElementId": "PROJECT-9b4d2b1641e6203934d95e7bde5fe08_pm",
//         "mountedElementProjectId": "PROJECT-9b4d2b1641e6203934d95e7bde5fe08",
//         "type": "Mount",
//         "mountedRefId": "master",
//         "ownerId": "{{projectId}}_pm"
//     },
//     {
//         "twcVersion": -1,
//         "mountedElementId": "PROJECT-ID_5_9_12_2_36_25_PM__3355cc91_137159f37b3__5c3b_sscae_cmr_137_78_160_100_pm",
//         "mountedElementProjectId": "PROJECT-ID_5_9_12_2_36_25_PM__3355cc91_137159f37b3__5c3b_sscae_cmr_137_78_160_100",
//         "type": "Mount",
//         "mountedRefId": "master",
//         "ownerId": "{{projectId}}_pm"
//     },
//     {
//         "twcVersion": -1,
//         "mountedElementId": "PROJECT-595f5a46-4bbd-4126-86a6-ec01f155cb67_pm",
//         "mountedElementProjectId": "PROJECT-595f5a46-4bbd-4126-86a6-ec01f155cb67",
//         "type": "Mount",
//         "mountedRefId": "master",
//         "ownerId": "{{projectId}}_pm"
//     },
//     {
//         "twcVersion": -1,
//         "mountedElementId": "PROJECT-b818821ad5fb9956e13d5fa929369fcb_pm",
//         "mountedElementProjectId": "PROJECT-b818821ad5fb9956e13d5fa929369fcb",
//         "type": "Mount",
//         "mountedRefId": "master",
//         "ownerId": "_12_0EAPbeta_be00301_1156851270584_552173_1"
//     },
//     {
//         "twcVersion": -1,
//         "mountedElementId": "PROJECT-877558e9224f114d50dea1f39a1c119_pm",
//         "mountedElementProjectId": "PROJECT-877558e9224f114d50dea1f39a1c119",
//         "type": "Mount",
//         "mountedRefId": "master",
//         "ownerId": "{{projectId}}_pm"
//     }
// ]
// }
