import { veUtils } from "@ve-utils";
import { Schema, SchemaMapping } from "./Schema.service";

export class DocgenSchema implements Schema {
    jsonName = 'docgen';
    schema: SchemaMapping = {
        "CollectOwnedElements": "_17_0_1_244d03ea_1319490805237_397889_23292",
        "CollectThingsOnDiagram": "_17_0_1_22b603cd_1319577320837_597116_24044",
        "CollectOwners": "_17_0_1_244d03ea_1319491813759_405316_23859",
        "CollectByStereotypeProperties": "_17_0_1_244d03ea_1319490856319_735016_23345",
        "CollectByDirectedRelationshipMetaclasses": "_17_0_1_244d03ea_1319490696098_585884_23244",
        "CollectByDirectedRelationshipStereotypes": "_17_0_1_244d03ea_1319490675924_494597_23220",
        "CollectByAssociation": "_17_0_1_244d03ea_1319490838789_76536_23321",
        "CollectTypes": "_17_0_1_244d03ea_1319490870282_714178_23369",
        "CollectClassifierAttributes": "_17_0_5_407019f_1346952773459_128964_11915",
        "CollectByExpression": "_17_0_2_3_e81034b_1378849795852_475880_29502",
        "FilterByDiagramType": "_17_0_1_244d03ea_1319490921274_829705_23417",
        "FilterByNames": "_17_0_1_244d03ea_1319490607459_890787_23148",
        "FilterByMetaclasses": "_17_0_1_244d03ea_1319490658057_783239_23196",
        "FilterByStereotypes": "_17_0_1_244d03ea_1319490639053_446661_23172",
        "FilterByExpression": "_17_0_2_3_e81034b_1378849355455_639118_29417",
        "SortByAttribute": "_17_0_2_3_407019f_1377878750778_198079_29401",
        "SortByProperty": "_17_0_2_3_407019f_1377878719961_37575_29374",
        "SortByExpression": "_17_0_2_3_407019f_1377881591361_754431_29966",
        "RemoveDuplicates": "_17_0_1_244d03ea_1319490880431_889010_23393",
        // "Parallel": "_17_0_1_244d03ea_1319490721410_468874_23268",
        // "Intersection": "_17_0_1_24c603f9_1318965749289_636288_15241",
        // "Union": "_17_0_1_24c603f9_1318965764947_847626_15265",
        // "XOR": "_17_0_2_1_407019f_1358445062164_196970_12977"
    }
}

veUtils.service('DocgenSchema', DocgenSchema);