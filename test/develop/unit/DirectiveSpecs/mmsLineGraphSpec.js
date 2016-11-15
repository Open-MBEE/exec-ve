(function(){
  'use strict';

  describe('mmsLineGraph directive', function() {
    var scope;
    var element;
    var $rootScope, $compile, CacheService, UtilsService, $httpBackend, requestHandler;

    beforeEach(function () {
      module('mms.directives');
      inject(function ($injector) {
        $rootScope   = $injector.get('$rootScope');
        $compile     = $injector.get('$compile');
        $httpBackend = $injector.get('$httpBackend');
        CacheService = $injector.get('CacheService');
        UtilsService = $injector.get('UtilsService');
        scope        = $rootScope.$new();
        element = $compile('<mms-line-graph data-eid="_18_0_5_41f01aa_1457039248084_722842_72366" data-x-col="Frequency (Hz)" data-y-col="E-Field Limit (dBμV/m)">$title</mms-line-graph>')(scope);
        // $httpBackend.when('GET', '/alfresco/service/workspaces/master/elements/_18_0_5_f280366_1456334450568_46028_112932').respond(200,
        //   {"elements": [{
        //     "nodeRefId": "workspace://SpacesStore/ae72d5a5-0f63-4495-b3a9-a4c10f664139",
        //     "versionedRefId": "versionStore://version2Store/8f12fdba-91a2-4405-8726-da8c8a0b1deb",
        //     "sysmlid": "_18_0_5_41f01aa_1457039248084_722842_72366",
        //     "isMetatype": false,
        //     "editable": true,
        //     "creator": "engo",
        //     "modified": "2016-03-03T13:18:02.165-0800",
        //     "modifier": "engo",
        //     "created": "Thu Mar 03 13:08:11 PST 2016",
        //     "name": "Falcon 9 Full Thrust worst-case radiated environment",
        //     "documentation": "",
        //     "owner": "_18_0_5_41f01aa_1457030937142_675013_67496",
        //     "appliedMetatypes": ["_9_0_62a020a_1105704885251_933969_7897"],
        //     "read": "2016-10-13T11:42:50.805-0700",
        //     "specialization": {
        //       "instanceSpecificationSpecification": {
        //         "string": "{\"body\":[[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286227_486522_91384\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286233_68291_91393\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286235_592419_91396\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}],[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286238_900002_91401\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286245_668949_91410\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286247_327089_91413\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}],[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286250_627481_91418\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286256_513711_91427\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286259_847145_91430\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}],[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286263_806257_91435\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286269_295300_91444\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286271_636639_91447\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}],[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286274_864310_91452\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286282_540613_91461\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286283_846167_91464\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}],[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286287_635831_91469\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286293_666913_91478\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286295_134491_91481\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}]],\"title\":\"Falcon 9 Full Thrust worst-case radiated environment\",\"style\":\"normal\",\"showIfEmpty\":false,\"type\":\"Table\",\"header\":[[{\"content\":[{\"sourceType\":\"text\",\"text\":\"<p>Number<\\/p>\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"text\",\"text\":\"<p>Frequency (Hz)<\\/p>\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"text\",\"text\":\"<p>E-Field Limit (dBμV\\/m)<\\/p>\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}]]}",
        //         "type": "LiteralString"
        //       },
        //       "slots": [],
        //       "classifier": ["_17_0_5_1_407019f_1430628178633_708586_11903"],
        //       "type": "InstanceSpecification"
        //     }
        //   }]}
        // );
        $httpBackend.when('GET', '/alfresco/service/workspaces/master/elements/_18_0_5_41f01aa_1457039248084_722842_72366').respond(200,
          {"elements": [{
            "nodeRefId": "workspace://SpacesStore/ae72d5a5-0f63-4495-b3a9-a4c10f664139",
            "versionedRefId": "versionStore://version2Store/8f12fdba-91a2-4405-8726-da8c8a0b1deb",
            "sysmlid": "_18_0_5_41f01aa_1457039248084_722842_72366",
            "isMetatype": false,
            "editable": true,
            "creator": "engo",
            "modified": "2016-03-03T13:18:02.165-0800",
            "modifier": "engo",
            "created": "Thu Mar 03 13:08:11 PST 2016",
            "name": "Falcon 9 Full Thrust worst-case radiated environment",
            "documentation": "",
            "owner": "_18_0_5_41f01aa_1457030937142_675013_67496",
            "appliedMetatypes": ["_9_0_62a020a_1105704885251_933969_7897"],
            "read": "2016-10-13T11:46:53.433-0700",
            "specialization": {
              "instanceSpecificationSpecification": {
                "string": "{\"body\":[[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286227_486522_91384\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286233_68291_91393\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286235_592419_91396\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}],[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286238_900002_91401\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286245_668949_91410\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286247_327089_91413\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}],[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286250_627481_91418\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286256_513711_91427\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286259_847145_91430\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}],[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286263_806257_91435\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286269_295300_91444\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286271_636639_91447\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}],[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286274_864310_91452\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286282_540613_91461\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286283_846167_91464\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}],[{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286287_635831_91469\",\"sourceProperty\":\"name\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286293_666913_91478\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"reference\",\"source\":\"_18_0_2_41f01aa_1456855286295_134491_91481\",\"sourceProperty\":\"value\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}]],\"title\":\"Falcon 9 Full Thrust worst-case radiated environment\",\"style\":\"normal\",\"showIfEmpty\":false,\"type\":\"Table\",\"header\":[[{\"content\":[{\"sourceType\":\"text\",\"text\":\"<p>Number<\\/p>\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"text\",\"text\":\"<p>Frequency (Hz)<\\/p>\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"},{\"content\":[{\"sourceType\":\"text\",\"text\":\"<p>E-Field Limit (dBμV\\/m)<\\/p>\",\"type\":\"Paragraph\"}],\"colspan\":\"1\",\"rowspan\":\"1\"}]]}",
                "type": "LiteralString"
              },
              "slots": [],
              "classifier": ["_17_0_5_1_407019f_1430628178633_708586_11903"],
              "type": "InstanceSpecification"
            }
          }]}
        );
        $httpBackend.when('PUT', '/alfresco/service/workspaces/master/elements').respond(200,
          {"elements": [
              {
                  "nodeRefId": "workspace://SpacesStore/f1b01966-901a-4f83-b079-fcd03a52bd75",
                  "versionedRefId": "versionStore://version2Store/1ad1d9f2-3fbe-490d-95c7-5cb4d9426271",
                  "sysmlid": "_18_0_2_41f01aa_1456855286227_486522_91384",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T10:18:03.013-0800",
                  "ownedAttribute": [
                      "_18_0_2_41f01aa_1456855286233_68291_91393",
                      "_18_0_2_41f01aa_1456855286235_592419_91396"
                  ],
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:38 PST 2016",
                  "name": "1",
                  "owner": "_18_0_2_41f01aa_1456855285950_904006_91119",
                  "documentation": "",
                  "appliedMetatypes": [
                      "_11_5EAPbeta_be00301_1147424179914_458922_958",
                      "_9_0_62a020a_1105704885343_144138_7929"
                  ],
                  "read": "2016-10-13T13:11:24.770-0700",
                  "specialization": {"type": "Element"}
              },
              {
                  "nodeRefId": "workspace://SpacesStore/f1b01966-901a-4f83-b079-fcd03a52bd75",
                  "versionedRefId": "versionStore://version2Store/1ad1d9f2-3fbe-490d-95c7-5cb4d9426271",
                  "sysmlid": "_18_0_2_41f01aa_1456855286227_486522_91384",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T10:18:03.013-0800",
                  "ownedAttribute": [
                      "_18_0_2_41f01aa_1456855286233_68291_91393",
                      "_18_0_2_41f01aa_1456855286235_592419_91396"
                  ],
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:38 PST 2016",
                  "name": "1",
                  "owner": "_18_0_2_41f01aa_1456855285950_904006_91119",
                  "documentation": "",
                  "appliedMetatypes": [
                      "_11_5EAPbeta_be00301_1147424179914_458922_958",
                      "_9_0_62a020a_1105704885343_144138_7929"
                  ],
                  "read": "2016-10-13T13:11:24.776-0700",
                  "specialization": {"type": "Element"}
              },
              {
                  "nodeRefId": "workspace://SpacesStore/a331054a-9903-4662-9fb4-60d475714454",
                  "versionedRefId": "versionStore://version2Store/cea906e7-65d4-4092-aea7-fe7b2409ec7e",
                  "sysmlid": "_18_0_2_41f01aa_1456855286233_68291_91393",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:13.511-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:39 PST 2016",
                  "name": "Frequency Hz",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286227_486522_91384",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.781-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 1000000,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794048832_837903_105260"]
                  }
              },
              {
                  "nodeRefId": "workspace://SpacesStore/cad08faa-ab8f-48da-8ed4-8c775ba04855",
                  "versionedRefId": "versionStore://version2Store/b1994d1c-d481-4d08-9808-00ff47d2ef96",
                  "sysmlid": "_18_0_2_41f01aa_1456855286235_592419_91396",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:13.505-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:39 PST 2016",
                  "name": "Narrowhead Electric Field Limit dBuVm-1",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286227_486522_91384",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.787-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 90,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794048833_23328_105261"]
                  }
              },
              {
                  "nodeRefId": "workspace://SpacesStore/5d6c6353-95dd-4c0f-846c-1139605fba7f",
                  "versionedRefId": "versionStore://version2Store/6d80cc94-1c07-4fc0-88c9-773e9dfbbf2b",
                  "sysmlid": "_18_0_2_41f01aa_1456855286238_900002_91401",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T10:18:06.687-0800",
                  "ownedAttribute": [
                      "_18_0_2_41f01aa_1456855286245_668949_91410",
                      "_18_0_2_41f01aa_1456855286247_327089_91413"
                  ],
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:54 PST 2016",
                  "name": "2",
                  "owner": "_18_0_2_41f01aa_1456855285950_904006_91119",
                  "documentation": "",
                  "appliedMetatypes": [
                      "_11_5EAPbeta_be00301_1147424179914_458922_958",
                      "_9_0_62a020a_1105704885343_144138_7929"
                  ],
                  "read": "2016-10-13T13:11:24.793-0700",
                  "specialization": {"type": "Element"}
              },
              {
                  "nodeRefId": "workspace://SpacesStore/0a82b98e-f311-49e1-b7b9-adde1cf51e26",
                  "versionedRefId": "versionStore://version2Store/d3656875-4b42-4541-a815-8ab7ffa3eaeb",
                  "sysmlid": "_18_0_2_41f01aa_1456855286245_668949_91410",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:13.602-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:55 PST 2016",
                  "name": "Frequency Hz",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286238_900002_91401",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.798-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 2.2E9,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794314477_470623_105487"]
                  }
              },
              {
                  "nodeRefId": "workspace://SpacesStore/d8c89adf-7080-4c69-a4a0-3110ef52322a",
                  "versionedRefId": "versionStore://version2Store/3476cf8a-b14a-477f-bbf2-63b660b0738d",
                  "sysmlid": "_18_0_2_41f01aa_1456855286247_327089_91413",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:15.949-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:55 PST 2016",
                  "name": "Narrowhead Electric Field Limit dBuVm-1",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286238_900002_91401",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.804-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 140,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794314478_317551_105488"]
                  }
              },
              {
                  "nodeRefId": "workspace://SpacesStore/9c3f53c1-cf17-4a75-ac56-432193f37b5c",
                  "versionedRefId": "versionStore://version2Store/4c93bb97-3a5f-4858-b878-7909a869ccd8",
                  "sysmlid": "_18_0_2_41f01aa_1456855286250_627481_91418",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T10:18:05.292-0800",
                  "ownedAttribute": [
                      "_18_0_2_41f01aa_1456855286256_513711_91427",
                      "_18_0_2_41f01aa_1456855286259_847145_91430"
                  ],
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:46 PST 2016",
                  "name": "3",
                  "owner": "_18_0_2_41f01aa_1456855285950_904006_91119",
                  "documentation": "",
                  "appliedMetatypes": [
                      "_11_5EAPbeta_be00301_1147424179914_458922_958",
                      "_9_0_62a020a_1105704885343_144138_7929"
                  ],
                  "read": "2016-10-13T13:11:24.810-0700",
                  "specialization": {"type": "Element"}
              },
              {
                  "nodeRefId": "workspace://SpacesStore/2815133e-1bea-4eef-a0d9-37fa47946a24",
                  "versionedRefId": "versionStore://version2Store/f85583d8-ace2-49ca-8b3b-46c73c17a475",
                  "sysmlid": "_18_0_2_41f01aa_1456855286263_806257_91435",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T10:17:59.504-0800",
                  "ownedAttribute": [
                      "_18_0_2_41f01aa_1456855286269_295300_91444",
                      "_18_0_2_41f01aa_1456855286271_636639_91447"
                  ],
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:37 PST 2016",
                  "name": "4",
                  "owner": "_18_0_2_41f01aa_1456855285950_904006_91119",
                  "documentation": "",
                  "appliedMetatypes": [
                      "_11_5EAPbeta_be00301_1147424179914_458922_958",
                      "_9_0_62a020a_1105704885343_144138_7929"
                  ],
                  "read": "2016-10-13T13:11:24.815-0700",
                  "specialization": {"type": "Element"}
              },
              {
                  "nodeRefId": "workspace://SpacesStore/c80de5f0-aafd-4972-9259-18d6c39bd4a2",
                  "versionedRefId": "versionStore://version2Store/b88bc42f-a1e2-435f-95c0-0239b728a349",
                  "sysmlid": "_18_0_2_41f01aa_1456855286256_513711_91427",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:13.492-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:47 PST 2016",
                  "name": "Frequency Hz",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286250_627481_91418",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.821-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 2.3E9,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794316697_832136_105495"]
                  }
              },
              {
                  "nodeRefId": "workspace://SpacesStore/a0be6f4a-625b-486f-af4f-ae201086c122",
                  "versionedRefId": "versionStore://version2Store/d16a20b7-1fca-4b86-9824-da8f34db1c95",
                  "sysmlid": "_18_0_2_41f01aa_1456855286269_295300_91444",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:13.609-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:38 PST 2016",
                  "name": "Frequency Hz",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286263_806257_91435",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.828-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 5.755E9,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794318092_64829_105503"]
                  }
              },
              {
                  "nodeRefId": "workspace://SpacesStore/af0c01c4-d4e8-4996-96ed-0b387bbdfffd",
                  "versionedRefId": "versionStore://version2Store/12377295-a4bc-4406-8179-d57c53fc8ea7",
                  "sysmlid": "_18_0_2_41f01aa_1456855286259_847145_91430",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:16.359-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:47 PST 2016",
                  "name": "Narrowhead Electric Field Limit dBuVm-1",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286250_627481_91418",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.835-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 90,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794316697_694804_105496"]
                  }
              },
              {
                  "nodeRefId": "workspace://SpacesStore/d3efe2c3-d08a-4354-8653-a45066c0f926",
                  "versionedRefId": "versionStore://version2Store/091bed36-6826-4465-9b15-2caa49f7100f",
                  "sysmlid": "_18_0_2_41f01aa_1456855286271_636639_91447",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:16.280-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:38 PST 2016",
                  "name": "Narrowhead Electric Field Limit dBuVm-1",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286263_806257_91435",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.843-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 154,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794318092_164553_105504"]
                  }
              },
              {
                  "nodeRefId": "workspace://SpacesStore/952a4c25-02e5-44d6-a31b-c55a638d2ff6",
                  "versionedRefId": "versionStore://version2Store/bb43b4ae-8718-4f23-8791-5aa4d00c4edf",
                  "sysmlid": "_18_0_2_41f01aa_1456855286283_846167_91464",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:16.994-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:45 PST 2016",
                  "name": "Narrowhead Electric Field Limit dBuVm-1",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286274_864310_91452",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.849-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 90,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794319447_568470_105512"]
                  }
              },
              {
                  "nodeRefId": "workspace://SpacesStore/a66168c4-d437-49ae-915f-63e0ab663268",
                  "versionedRefId": "versionStore://version2Store/53101fbe-f4b0-44fe-b595-cd3c6f858015",
                  "sysmlid": "_18_0_2_41f01aa_1456855286274_864310_91452",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T10:18:05.045-0800",
                  "ownedAttribute": [
                      "_18_0_2_41f01aa_1456855286282_540613_91461",
                      "_18_0_2_41f01aa_1456855286283_846167_91464"
                  ],
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:44 PST 2016",
                  "name": "5",
                  "owner": "_18_0_2_41f01aa_1456855285950_904006_91119",
                  "documentation": "",
                  "appliedMetatypes": [
                      "_11_5EAPbeta_be00301_1147424179914_458922_958",
                      "_9_0_62a020a_1105704885343_144138_7929"
                  ],
                  "read": "2016-10-13T13:11:24.855-0700",
                  "specialization": {"type": "Element"}
              },
              {
                  "nodeRefId": "workspace://SpacesStore/15cd3b65-995f-4b22-bae1-75db033f343a",
                  "versionedRefId": "versionStore://version2Store/c8a1b48b-39bb-4010-9abb-1f7766f70afc",
                  "sysmlid": "_18_0_2_41f01aa_1456855286287_635831_91469",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T10:18:00.099-0800",
                  "ownedAttribute": [
                      "_18_0_2_41f01aa_1456855286293_666913_91478",
                      "_18_0_2_41f01aa_1456855286295_134491_91481"
                  ],
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:30 PST 2016",
                  "name": "6",
                  "owner": "_18_0_2_41f01aa_1456855285950_904006_91119",
                  "documentation": "",
                  "appliedMetatypes": [
                      "_11_5EAPbeta_be00301_1147424179914_458922_958",
                      "_9_0_62a020a_1105704885343_144138_7929"
                  ],
                  "read": "2016-10-13T13:11:24.860-0700",
                  "specialization": {"type": "Element"}
              },
              {
                  "nodeRefId": "workspace://SpacesStore/e5336155-9ed7-4dc5-9a00-063c74339cf2",
                  "versionedRefId": "versionStore://version2Store/6457bc39-29dc-4267-b9db-16bbcef34ff3",
                  "sysmlid": "_18_0_2_41f01aa_1456855286282_540613_91461",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:16.714-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:44 PST 2016",
                  "name": "Frequency Hz",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286274_864310_91452",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.866-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 5.775E9,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794319447_276863_105511"]
                  }
              },
              {
                  "nodeRefId": "workspace://SpacesStore/a32a2415-12a0-4dee-9d09-521b8a5b68ce",
                  "versionedRefId": "versionStore://version2Store/5ddfcfb0-630c-43d2-923d-bde9e2415e37",
                  "sysmlid": "_18_0_2_41f01aa_1456855286293_666913_91478",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:17.211-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:30 PST 2016",
                  "name": "Frequency Hz",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286287_635831_91469",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.872-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 1.8E10,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794320882_129725_105519"]
                  }
              },
              {
                  "nodeRefId": "workspace://SpacesStore/360ef8a0-4902-4ba5-9146-01096c17b6d9",
                  "versionedRefId": "versionStore://version2Store/e3779e89-a562-4287-b6ea-bf2ed5d0ba65",
                  "sysmlid": "_18_0_2_41f01aa_1456855286295_134491_91481",
                  "isMetatype": false,
                  "editable": true,
                  "creator": "engo",
                  "modified": "2016-03-03T13:14:18.272-0800",
                  "modifier": "engo",
                  "created": "Thu Mar 03 10:14:30 PST 2016",
                  "name": "Narrowhead Electric Field Limit dBuVm-1",
                  "documentation": "",
                  "owner": "_18_0_2_41f01aa_1456855286287_635831_91469",
                  "appliedMetatypes": [
                      "_12_0_be00301_1164123483951_695645_2041",
                      "_9_0_62a020a_1105704884574_96724_7644"
                  ],
                  "read": "2016-10-13T13:11:24.877-0700",
                  "specialization": {
                      "aggregation": "COMPOSITE",
                      "multiplicityMax": 1,
                      "propertyType": "string",
                      "isDerived": false,
                      "isSlot": false,
                      "value": [{
                          "double": 90,
                          "type": "LiteralReal"
                      }],
                      "multiplicityMin": 1,
                      "type": "Property",
                      "redefines": ["_18_0_5_41f01aa_1456794320883_566380_105520"]
                  }
              }
          ]}
        );
      });
    });

    it('should create a C3 graph', function () {
      $compile(element)(scope);
      scope.$digest();
      scope.$apply();
      $httpBackend.flush();
      expect(element[0].children[0].children[1].classList[0] == 'c3').toBeTruthy();
    });
    it('should use table name as figure caption',function() {
      $compile(element)(scope);
      scope.$digest();
      scope.$apply();
      $httpBackend.flush();
      expect(element[0].children[0].children[0].innerText == 'Falcon 9 Full Thrust worst-case radiated environmentFalcon 9 Full Thrust worst-case radiated environment').toBeTruthy();
    });
  });

})();
