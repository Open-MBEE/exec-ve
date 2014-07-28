/*
'use strict';

//jasmine specs for services go here 

describe('service', function() {
    var URLService, SiteService, $httpBackend;

    beforeEach(module('mms'));

    beforeEach(inject(function($injector) {
        URLService = $injector.get('URLService');
        SiteService = $injector.get('SiteService');
        $httpBackend = $injector.get('$httpBackend');

    }));

    it('isTimestamp', function() {
        expect(URLService.isTimestamp('123')).toBe(false);
    });

    it('getSiteEuropa', function() {
        $httpBackend.whenGET('/alfresco/service/rest/sites').respond([
            {name: 'europa', title: 'Europa'}
        ]);
        SiteService.getSite('europa').then(function(site) {
            expect(site).toEqual({name: 'europa', title: 'Europa'});
        });
        $httpBackend.flush();
    });
});
*/

'use strict';

/* jasmine specs for services go here */

describe('service', function() {
  beforeEach(module('myApp.services'));


  describe('version', function() {
    it('should return current version', inject(function(version) {
      expect(version).toEqual('0.1');
    }));
  });
});

// CommentService - (done), [4 empty]
describe('CommentService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the CommentService', inject(function() {
		expect(CommentService).toBeDefined();

		expect(CommentService.addComment).not.toBe(null);
		expect(CommentService.getComments).not.toBe(null);
		expect(CommentService.updateComment).not.toBe(null);
		expect(CommentService.deleteComment).not.toBe(null);
	}));

	it('addComment', inject(function() {}));

	it('getComments', inject(function() {}));

	it('updateComment', inject(function() {}));

	it('deleteComment', inject(function() {}));
});

// ConfigService - incomplete, 10 methods, [4 $http tested, 1 unknown, 5 $http untested]
describe('ConfigService', function() {
	beforeEach(module('mms'));

	var workspace = 'master';

	var ConfigService, $httpBackend;

	var products = {"products": [
	  {
	    "author": "kerzhner",
	    "lastModified": "2014-07-15T09:42:55.896-0700",
	    "name": "MDK Manual",
	    "qualifiedName": "/////Architectural Patterns & Examples/_17_0_2_3_8660276_1391623405097_989020_66206/MDK Manual",
	    "documentation": "<p><mms-transclude-com data-mms-eid=\"MMS_1405434431200_84583f43-955b-417f-890a-907b80b87161\">comment:cldelp<\/mms-transclude-com> <\/p>",
	    "sysmlid": "_17_0_2_3_e9f034d_1384298224245_406810_82668",
	    "owner": "_17_0_2_3_8660276_1391623405097_989020_66206",
	    "read": "2014-07-18T15:48:28.160-0700",
	    "specialization": {
	      "displayedElements": ["_17_0_2_3_e9f034d_1384298224245_406810_82668"],
	      "view2view": [
	        {
	          "id": "_17_0_2_3_8660276_1391118051281_643259_64209",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1386121079087_662054_85232",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389829239079_574229_68313",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1397083442144_35084_63686",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1391542427605_168205_65764",
	          "childrenViews": ["MMS_1405373440109_7e6315b8-09ac-475e-b2eb-e295d79c5cfb"]
	        },
	        {
	          "id": "_17_0_2_3_faa036e_1397518837356_424982_57979",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396909133552_170892_57876",
	          "childrenViews": [
	            "_17_0_2_3_c0902ff_1396909371550_332620_58325",
	            "_17_0_2_3_8660276_1401232594990_180350_60135"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1386284293741_532771_64146",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396900178350_335263_58448",
	          "childrenViews": [
	            "_17_0_2_3_c0902ff_1396908807725_881294_57507",
	            "_17_0_2_3_c0902ff_1396908848585_583057_57546",
	            "_17_0_2_3_c0902ff_1396909133552_170892_57876"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1394733125360_268161_68542",
	          "childrenViews": [
	            "_17_0_2_3_e9f034d_1384298170561_728720_82613",
	            "_17_0_2_3_e9f034d_1384302306631_591764_84397",
	            "_17_0_2_3_8660276_1394734844442_201184_71850",
	            "_17_0_2_3_8660276_1394734895675_183382_71922",
	            "_17_0_2_3_8660276_1394734917275_153065_71966"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1386283174564_988137_63084",
	          "childrenViews": [
	            "_17_0_2_3_e9f034d_1386284293741_532771_64146",
	            "_17_0_2_3_e9f034d_1386284367319_284780_64218"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1397083523057_750266_63842",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389821071980_888986_64595",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1384365541894_746617_63766",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389831148387_61148_69116",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1384915209668_776948_79604",
	            "_17_0_2_3_8660276_1386121079087_662054_85232",
	            "_17_0_2_3_e9f034d_1385422966050_9801_80021"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1385422966050_9801_80021",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1384370369889_336346_64694",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_faa036e_1397518746363_164717_57916",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396909215790_810314_58019",
	          "childrenViews": [
	            "_17_0_2_3_faa036e_1397519263610_359618_58243",
	            "_17_0_2_3_faa036e_1397519351902_689880_58306",
	            "_17_0_2_3_faa036e_1397519411683_200499_58369"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1386284367319_284780_64218",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_f280366_1395329363629_245331_66680",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_faa036e_1397519263610_359618_58243",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396909371550_332620_58325",
	          "childrenViews": [
	            "_17_0_2_3_c0902ff_1396909184269_457130_57939",
	            "_17_0_2_3_c0902ff_1396909210462_121086_57980",
	            "_17_0_2_3_c0902ff_1396909215790_810314_58019"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1397083507050_780595_63803",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389820676338_288876_64122",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389894058553_546843_66812",
	          "childrenViews": ["_17_0_2_3_8660276_1389892206218_894432_65193"]
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1384298097479_684723_82574",
	          "childrenViews": [
	            "_17_0_2_3_e9f034d_1384303058899_500990_84485",
	            "_17_0_2_3_e9f034d_1384365541894_746617_63766",
	            "_17_0_2_3_8660276_1395106664281_814376_67950",
	            "_17_0_2_3_e9f034d_1384384755210_265104_68051"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_faa036e_1397519411683_200499_58369",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1394734917275_153065_71966",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1391046957889_602576_66253",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387326005150_388071_96446",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1389820676338_288876_64122",
	            "_17_0_2_3_8660276_1389820875487_689706_64383",
	            "_17_0_2_3_8660276_1389821041600_119881_64519",
	            "_17_0_2_3_8660276_1389821120889_700164_64633",
	            "_17_0_2_3_8660276_1389829239079_574229_68313",
	            "_17_0_2_3_8660276_1389821057250_613836_64557",
	            "_17_0_2_3_8660276_1389821071980_888986_64595",
	            "_17_0_2_3_f280366_1395329248105_85252_66620",
	            "_17_0_2_3_f280366_1395329363629_245331_66680",
	            "_17_0_2_3_f280366_1395329404651_682967_66740",
	            "_17_0_2_3_f280366_1395936575237_980286_66517"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1384303058899_500990_84485",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1397070965413_88861_57833",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396908960589_4216_57750",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396909292721_743711_58130",
	          "childrenViews": [
	            "_17_0_2_3_c0902ff_1396909806501_616704_58605",
	            "_17_0_2_3_c0902ff_1396909812164_61274_58644"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1384382641868_579610_67487",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1385079571724_174413_97891",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1384384755210_265104_68051",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387325047321_762283_95516",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396908968249_349568_57789",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389892206218_894432_65193",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1384381686222_52312_66992",
	          "childrenViews": ["_17_0_2_3_e9f034d_1384382641868_579610_67487"]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387325091432_452979_95607",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387326187768_702750_96498",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389821120889_700164_64633",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387325163545_568184_95650",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396909184269_457130_57939",
	          "childrenViews": [
	            "_17_0_2_3_c0902ff_1397070965413_88861_57833",
	            "_17_0_2_3_c0902ff_1397081331828_749528_63257",
	            "_17_0_2_3_c0902ff_1397083368650_521111_63569",
	            "_17_0_2_3_c0902ff_1397083406754_932254_63608",
	            "_17_0_2_3_c0902ff_1397083422019_434144_63647",
	            "_17_0_2_3_c0902ff_1397083442144_35084_63686",
	            "_17_0_2_3_c0902ff_1397083468712_950160_63725",
	            "_17_0_2_3_c0902ff_1397083484890_415817_63764",
	            "_17_0_2_3_c0902ff_1397083507050_780595_63803",
	            "_17_0_2_3_c0902ff_1397083523057_750266_63842"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1386094298058_27440_63534",
	          "childrenViews": [
	            "_17_0_2_3_e9f034d_1386094655236_948477_63624",
	            "_17_0_2_3_e9f034d_1386283174564_988137_63084"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1395106664281_814376_67950",
	          "childrenViews": [
	            "_17_0_2_3_e9f034d_1384370369889_336346_64694",
	            "_17_0_2_3_e9f034d_1384381686222_52312_66992"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1397083422019_434144_63647",
	          "childrenViews": ["_17_0_2_3_c0902ff_1399415671230_715545_62517"]
	        },
	        {
	          "id": "_17_0_2_3_faa036e_1397518872385_474111_58113",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387325395161_284452_95855",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389735753455_365540_64517",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1386094655236_948477_63624",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1399415671230_715545_62517",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1384915209668_776948_79604",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1394732557276_183971_68132",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387325256943_181843_95710",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1387325272266_489126_95754",
	            "_17_0_2_3_8660276_1387325091432_452979_95607",
	            "_17_0_2_3_8660276_1387326005150_388071_96446",
	            "_17_0_2_3_8660276_1389823625085_150755_68430"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396909806501_616704_58605",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396908807725_881294_57507",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_faa036e_1397518354420_74213_57792",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396909356075_335727_58286",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1397083484890_415817_63764",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1397083368650_521111_63569",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1386114552716_627341_82958",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1387325256943_181843_95710",
	            "_17_0_2_3_8660276_1387325066198_377435_95560",
	            "_17_0_2_3_8660276_1387325429092_205128_95944",
	            "_17_0_2_3_8660276_1387325047321_762283_95516",
	            "_17_0_2_3_8660276_1387325163545_568184_95650",
	            "_17_0_2_3_8660276_1387326187768_702750_96498",
	            "_17_0_2_3_8660276_1395268972605_59163_105372"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1397081331828_749528_63257",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389821041600_119881_64519",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1384298170561_728720_82613",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1384302306631_591764_84397",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396909210462_121086_57980",
	          "childrenViews": [
	            "_17_0_2_3_faa036e_1397518354420_74213_57792",
	            "_17_0_2_3_faa036e_1397518746363_164717_57916",
	            "_17_0_2_3_faa036e_1397518837356_424982_57979",
	            "_17_0_2_3_faa036e_1397518872385_474111_58113",
	            "_17_0_2_3_faa036e_1397518899208_736795_58176"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396909316870_352537_58169",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396909812164_61274_58644",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_f280366_1395936575237_980286_66517",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389820875487_689706_64383",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396908848585_583057_57546",
	          "childrenViews": [
	            "_17_0_2_3_c0902ff_1396908960589_4216_57750",
	            "_17_0_2_3_c0902ff_1396908968249_349568_57789"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_faa036e_1397519351902_689880_58306",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389821057250_613836_64557",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1396909349070_876460_58247",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1401232594990_180350_60135",
	          "childrenViews": [
	            "_17_0_2_3_c0902ff_1396909292721_743711_58130",
	            "_17_0_2_3_c0902ff_1396909316870_352537_58169",
	            "_17_0_2_3_c0902ff_1396909356075_335727_58286",
	            "_17_0_2_3_c0902ff_1396909349070_876460_58247"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_f280366_1395329404651_682967_66740",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_e9f034d_1384298224245_406810_82668",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1391542427605_168205_65764",
	            "_17_0_2_3_e9f034d_1384298097479_684723_82574",
	            "_17_0_2_3_c0902ff_1396900178350_335263_58448",
	            "_17_0_2_3_8660276_1394732535509_307093_68087",
	            "_17_0_2_3_8660276_1394733125360_268161_68542",
	            "_17_0_2_3_8660276_1386114552716_627341_82958",
	            "_17_0_2_3_e9f034d_1386094298058_27440_63534"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1394734844442_201184_71850",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389823625085_150755_68430",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_f280366_1395329248105_85252_66620",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1397083406754_932254_63608",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387325299874_731132_95804",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1397083468712_950160_63725",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387325272266_489126_95754",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_faa036e_1397518899208_736795_58176",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1394732535509_307093_68087",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1389735753455_365540_64517",
	            "_17_0_2_3_8660276_1394732557276_183971_68132",
	            "_17_0_2_3_8660276_1391046957889_602576_66253",
	            "_17_0_2_3_8660276_1391118051281_643259_64209"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1395268972605_59163_105372",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387325066198_377435_95560",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1387325406242_779669_95897",
	            "_17_0_2_3_8660276_1387325395161_284452_95855",
	            "_17_0_2_3_8660276_1387325299874_731132_95804"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387325406242_779669_95897",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1387325429092_205128_95944",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1389831148387_61148_69116",
	            "_17_0_2_3_e9f034d_1385079571724_174413_97891",
	            "_17_0_2_3_8660276_1389894058553_546843_66812"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1394734895675_183382_71922",
	          "childrenViews": []
	        },
	        {
	          "id": "MMS_1405373440109_7e6315b8-09ac-475e-b2eb-e295d79c5cfb",
	          "childrenViews": []
	        }
	      ],
	      "allowedElements": ["_17_0_2_3_e9f034d_1384298224245_406810_82668"],
	      "contains": [{
	        "sourceType": "reference",
	        "source": "_17_0_2_3_e9f034d_1384298224245_406810_82668",
	        "sourceProperty": "documentation",
	        "type": "Paragraph"
	      }],
	      "noSections": ["_17_0_2_3_e9f034d_1384382641868_579610_67487"],
	      "type": "View"
	    },
	    "editable": false
	  },
	  {
	    "author": "dcoren",
	    "lastModified": "2014-07-14T14:34:11.442-0700",
	    "name": "EMS Application Manuals",
	    "qualifiedName": "/////Architectural Patterns & Examples/_17_0_2_3_8660276_1391623405097_989020_66206/EMS Application Manuals",
	    "documentation": "",
	    "sysmlid": "_17_0_2_3_8660276_1391133273620_303350_69133",
	    "owner": "_17_0_2_3_8660276_1391623405097_989020_66206",
	    "read": "2014-07-18T15:48:28.178-0700",
	    "specialization": {
	      "displayedElements": ["_17_0_2_3_8660276_1391133273620_303350_69133"],
	      "view2view": [
	        {
	          "id": "_17_0_2_3_8660276_1393381021676_15399_114871",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1395521704058_862881_66337",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1390958281625_747273_64386",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1391197105192_393486_68984",
	            "_17_0_2_3_8660276_1391135738826_741360_71086",
	            "_17_0_2_3_8660276_1391135755238_179812_71128",
	            "_17_0_5_1_8bf0285_1403557665925_362603_47762",
	            "_17_0_5_1_f280366_1403566633442_623483_56051",
	            "_17_0_5_1_f280366_1403566647035_101692_56074"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1390958281620_64773_64383",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1391133551962_594351_69801",
	            "_17_0_2_3_8660276_1389735559339_83520_64303"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1396973181409_413744_74394",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1393377591335_186016_112660",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1391133551962_594351_69801",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1389735559339_83520_64303",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1391135755238_179812_71128",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1393377591335_186016_112660",
	            "_17_0_2_3_8660276_1393381021676_15399_114871"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1391135738826_741360_71086",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_5_1_8bf0285_1403557665925_362603_47762",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1391197105192_393486_68984",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1395529388798_376521_67194",
	          "childrenViews": [
	            "_17_0_2_3_c0902ff_1395521448356_249882_66319",
	            "_17_0_2_3_c0902ff_1395521618178_247686_66322",
	            "_17_0_2_3_c0902ff_1395521704058_862881_66337",
	            "_17_0_2_3_c0902ff_1395521790720_193330_66340"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1390958281625_208230_64385",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1391133633326_499253_69923",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1391133718975_592409_69977",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1391133273620_303350_69133",
	          "childrenViews": [
	            "_17_0_2_3_c0902ff_1395529388798_376521_67194",
	            "_17_0_2_3_f280366_1396455740501_953157_59326"
	          ]
	        },
	        {
	          "id": "_17_0_5_1_f280366_1403566647035_101692_56074",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1390958281624_353028_64384",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1395521618178_247686_66322",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_8660276_1393558434279_197906_105062",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1390958281624_353028_64384",
	            "_17_0_2_3_8660276_1391133633326_499253_69923"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_8660276_1391133301013_528454_69192",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1390958281625_208230_64385",
	            "_17_0_2_3_8660276_1390958281625_747273_64386"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_f280366_1396455740501_953157_59326",
	          "childrenViews": [
	            "_17_0_2_3_8660276_1391133301013_528454_69192",
	            "_17_0_2_3_8660276_1393558434279_197906_105062",
	            "_17_0_2_3_8660276_1391133718975_592409_69977",
	            "_17_0_2_3_8660276_1396973181409_413744_74394",
	            "_17_0_2_3_8660276_1390958281620_64773_64383"
	          ]
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1395521790720_193330_66340",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_5_1_f280366_1403566633442_623483_56051",
	          "childrenViews": []
	        },
	        {
	          "id": "_17_0_2_3_c0902ff_1395521448356_249882_66319",
	          "childrenViews": []
	        }
	      ],
	      "allowedElements": ["_17_0_2_3_8660276_1391133273620_303350_69133"],
	      "contains": [{
	        "sourceType": "reference",
	        "source": "_17_0_2_3_8660276_1391133273620_303350_69133",
	        "sourceProperty": "documentation",
	        "type": "Paragraph"
	      }],
	      "noSections": [],
	      "type": "View"
	    },
	    "editable": false
	  }
	]};

	var configurations = {configurations: [{
					id: "af927dcb753f",
					timestamp: "2014-07-14T16:43:07.747-0700",
					description: "Some description",
					name: "Some name",
					modified: "2014-07-14T16:43:07.752-0700"
	}]};

	beforeEach(inject(function($injector) {
        ConfigService = $injector.get('ConfigService');
        $httpBackend = $injector.get('$httpBackend');

        $httpBackend.whenGET('/alfresco/service/workspaces/master/sites/ems-support/configurations').respond(configurations);

    // posting error?
        $httpBackend.whenPOST('/alfresco/service/workspaces/master/sites/ems-support/configurations').respond({
					id: "af927dcb753f",
					timestamp: "2014-07-14T16:43:07.747-0700",
					description: "New description",
					name: "New name",
					modified: "2014-07-21T14:25:07.752-0700"
		});

		$httpBackend.whenGET('/alfresco/service/workspaces/master/sites/ems-support/configurations/af927dcb753f').respond({
			configurations: [
				{
					id: "af927dcb753f",
					timestamp: "2014-07-14T16:43:07.747-0700",
					description: "Some description",
					name: "Some name",
					modified: "2014-07-14T16:43:07.752-0700"
				}
			]
		});

		$httpBackend.whenGET('/alfresco/service/workspaces/master/sites/ems-support/configurations/af927dcb753f/products').respond(products);

		$httpBackend.whenGET('/alfresco/service/workspaces/master/sites/ems-support/configurations/af927dcb753f/snapshots').respond("");

		$httpBackend.whenGET('/alfresco/service/workspaces/master/sites/ems-support/products/_69133/snapshots').respond({"snapshots": [{
		  "id": "_17_0_2_3_8660276_1391133273620_303350_69133_1405373651222",
		  "created": "2014-07-14T14:34:11.223-0700",
		  "sysmlid": "_17_0_2_3_8660276_1391133273620_303350_69133",
		  "sysmlname": "EMS Application Manuals",
		  "configurations": [],
		  "creator": "dcoren"
		}]});


    }));

	it('can get an instance of the ConfigService', inject(function() {
		expect(ConfigService).toBeDefined();

		expect(ConfigService.getSiteConfigs).not.toBe(null);
		expect(ConfigService.getConfig).not.toBe(null);
		expect(ConfigService.getConfigProducts).not.toBe(null);
		expect(ConfigService.getConfigProducts).not.toBe(null);
		expect(ConfigService.getConfigSnapshots).not.toBe(null);
		expect(ConfigService.updateConfig).not.toBe(null);
		expect(ConfigService.createConfig).not.toBe(null);
		expect(ConfigService.updateConfigSnapshots).not.toBe(null);
		expect(ConfigService.updateConfigProducts).not.toBe(null);
		expect(ConfigService.createSnapshots).not.toBe(null);
	}));

	// accesses $http - √
	it('getSiteConfigs', inject(function() {

		ConfigService.getSiteConfigs('ems-support', 'master').then(function(data) {
			expect(data[0]).toEqual({
				id: "af927dcb753f",
				timestamp: "2014-07-14T16:43:07.747-0700",
				description: "Some description",
				name: "Some name",
				modified: "2014-07-14T16:43:07.752-0700"
			});
		});

		$httpBackend.flush();
	}));

	// accesses $http - √
	it('getConfig', inject(function() {

		ConfigService.getConfig('ems-support', 'master', 'af927dcb753f').then(function(data) {
			expect(data[0]).toEqual({
				id: "af927dcb753f",
				timestamp: "2014-07-14T16:43:07.747-0700",
				description: "Some description",
				name: "Some name",
				modified: "2014-07-14T16:43:07.752-0700"
			});

			$httpBackend.flush();
		});

	}));

	// accesses $http - √
	it('getConfigProducts', inject(function() {

		ConfigService.getConfigProducts('af927dcb753f', 'ems-support', 'master').then(function(data) {
			expect(data).toEqual(products);

			$httpBackend.flush();
		});

	}));

	// accesses $http - untested
	it('getConfigSnapshots', inject(function() {

		
	}));

	// accesses $http - √
	it('getProductSnapshots', inject(function() {

		ConfigService.getConfigSnapshots('_69133', 'ems-support', 'master').then(function(data) {
			expect(data).toEqual({"snapshots": [{
			  "id": "_17_0_2_3_8660276_1391133273620_303350_69133_1405373651222",
			  "created": "2014-07-14T14:34:11.223-0700",
			  "sysmlid": "_17_0_2_3_8660276_1391133273620_303350_69133",
			  "sysmlname": "EMS Application Manuals",
			  "configurations": [],
			  "creator": "dcoren"
			}]});

			$httpBackend.flush();
		});
	}));

	// accesses $http - ? testing problem with whenPOST?
	it('updateConfig', inject(function() {

		var newConfig = {
					id: "af927dcb753f",
					timestamp: "2014-07-14T16:43:07.747-0700",
					description: "New description",
					name: "New name",
					modified: "2014-07-21T14:25:07.752-0700"
		};

		ConfigService.updateConfig(newConfig, 'ems-support', 'master').then(function(response) {
			//console.log(response);
			expect(response.name).toEqual("New name");
		}, function(mesage) {
			console.log('config: ' + message);
		});

	}));

	// accesses $http - untested
	it('createConfig', inject(function() {

	}));

	// accesses $http - untested
	it('updateConfigSnapshots', inject(function() {

	}));

	// accesses $http - untested
	it('updateConfigProducts', inject(function() {

	}));

	// accesses $http - untested
	it('createSnapshots', inject(function() {

	}));
});

// ElementService - incomplete, 12 methods, [9 done, 1 empty, 2 untested] 
// !-- NOTE: still missing testing with inProgress --!
describe('ElementService', function() {
	beforeEach(module('mms'));

	var myElementService, $httpBackend;


	var element_17783 = {
		    "author": "jsalcedo",
		    "lastModified": "2014-07-21T15:04:46.336-0700",
		    "name": "Test2_JS",
		    "qualifiedName": "/////NewTest//Test1_JS",
		    "documentation": "old documentation",
		    "sysmlid": "_17783",
		    "owner": "_17448",
		    "read": "2014-07-22T09:17:06.353-0700",
		    "specialization": {
		        "displayedElements": ["_17783"],
		        "view2view": [
		            {"childrenViews": [], "id": "_17742"},
		            {"childrenViews": [], "id": "_17771"},
		            {"childrenViews": [], "id": "_17538"},
		            {"childrenViews": [], "id": "_17958"},
		            {"childrenViews": 
		            	["_17742", "_17958", "_17550", "_17771", "_17538", "_17913", "_16192"],
		                "id": "_17783"
		            },
		            {"childrenViews": [], "id": "_17913"},
		            { "childrenViews": [], "id": "_16192"},
		            { "childrenViews": [], "id": "_17550"}
		        ],
		        "allowedElements": ["_17783"],
		        "contains": [{
		            "sourceType": "reference",
		            "source": "_17783",
		            "sourceProperty": "documentation",
		            "type": "Paragraph"
		        }],
		        "noSections": [],
		        "type": "Product"
		    },
		    "editable": true
	};
	var updated_17783 = {
		    "author": "jsalcedo",
		    "lastModified": "2014-07-22T15:04:46.336-0700",
		    "name": "Test2_JS",
		    "qualifiedName": "/////NewTest//Test1_JS",
		    "documentation": "new documentation",
		    "sysmlid": "_17783",
		    "owner": "_17448",
		    "read": "2014-07-22T09:17:06.353-0700",
		    "specialization": {
		        "displayedElements": ["_17783"],
		        "view2view": [
		            {"childrenViews": [], "id": "_17742"},
		            {"childrenViews": [], "id": "_17771"},
		            {"childrenViews": [], "id": "_17538"},
		            {"childrenViews": [], "id": "_17958"},
		            {"childrenViews": 
		            	["_17742", "_17958", "_17550", "_17771", "_17538", "_17913", "_16192"],
		                "id": "_17783"
		            },
		            {"childrenViews": [], "id": "_17913"},
		            { "childrenViews": [], "id": "_16192"},
		            { "childrenViews": [], "id": "_17550"}
		        ],
		        "allowedElements": ["_17783"],
		        "contains": [{
		            "sourceType": "reference",
		            "source": "_17783",
		            "sourceProperty": "documentation",
		            "type": "Paragraph"
		        }],
		        "noSections": [],
		        "type": "Product"
		    },
		    "editable": true
	};

	var element_17448 = {
	    "author": "dlam",
	    "lastModified": "2014-07-10T10:46:26.499-0700",
	    "name": "test",
	    "qualifiedName": "/////NewTest/test",
	    "documentation": "",
	    "sysmlid": "_17448",
	    "owner": "PROJECT-78b1ddf7-0d4f-4507-bf41-6ea9b48249d4",
	    "read": "2014-07-22T09:37:03.357-0700",
	    "specialization": {"type": "Package"},
	    "editable": true};
	var updated_17448 = {
	    "author": "dlam",
	    "lastModified": "2014-07-22T10:46:26.499-0700",
	    "name": "test",
	    "qualifiedName": "/////NewTest/test",
	    "documentation": "not empty",
	    "sysmlid": "_17448",
	    "owner": "PROJECT-78b1ddf7-0d4f-4507-bf41-6ea9b48249d4",
	    "read": "2014-07-22T09:37:03.357-0700",
	    "specialization": {"type": "Package"},
	    "editable": true
	};

	var newElement = {
	    "author": "muschek",
	    "lastModified": "2014-07-22T10:46:26.499-0700",
	    "name": "new element",
	    "qualifiedName": "/////dummy/new element",
	    "documentation": "insert documentation here",
	    "owner": "ownerId",
	    "read": "2014-07-22T09:37:03.357-0700",
	    "specialization": {"type": "Package"},
	    "editable": true
	};

	var emptyElements = {elements: []};

	beforeEach(inject(function($injector) {
		ElementService = $injector.get('ElementService');
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/_17783').respond({elements: [element_17783]});
		$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/_17784').respond(function(method, url, data) {
			var response = "[ERROR]: Element with id, _17784 not found\n[WARNING]: No elements found";
			return [404, response];
		});
		$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/_17448').respond({elements: [element_17448]});

		// maybe look at string to JSON converter
		$httpBackend.when('POST', '/alfresco/service/workspaces/master/elements').respond(function(method, url, data) {
			var json = JSON.parse(data);

			if (!json.elements[0].sysmlid) {
				json.elements[0].sysmlid = json.elements[0].name;
			}
			return [200, json];
		});
	}))

	it('can get an instance of the ElementService and methods are valid', inject(function() {
		expect(ElementService).toBeDefined();

		expect(ElementService.getElement).not.toBe(null);
		expect(ElementService.getElements).not.toBe(null);
		expect(ElementService.getElementsForEdit).not.toBe(null);
		expect(ElementService.getOwnedElements).not.toBe(null);
		expect(ElementService.updateElement).not.toBe(null);
		expect(ElementService.updateElements).not.toBe(null);
		expect(ElementService.createElement).not.toBe(null);
		expect(ElementService.createElements).not.toBe(null);
		expect(ElementService.getGenericElements).not.toBe(null);
		expect(ElementService.isDirty).not.toBe(null);
		expect(ElementService.search).not.toBe(null);
	}));

	// done - minus version
	it('getElement', inject(function() {

		// Default: elements of length >= 1
		ElementService.getElement('_17783').then(function(element) {
			expect(element.author).toEqual('jsalcedo');
		});

		$httpBackend.flush();

		// Elements not found: elements of length == 0
		ElementService.getElement('_17784').then(function(element) {
			console.log('should not display');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.message).toEqual('Not Found');
			expect(failMes.data).toEqual('[ERROR]: Element with id, _17784 not found\n[WARNING]: No elements found');
		});

		$httpBackend.flush();

		// Different version from latest

		// Error
	}));

	// done - unless redundant testing is required
	it('getElements', inject(function() {

		var ids = ['_17783', '_17448'];
		
		ElementService.getElements(ids).then(function(elements) {
			expect(elements[0]).toEqual(element_17783);
			expect(elements[1]).toEqual(element_17448);

		}, function(failMes) {
			console.log('$q.all fail');
		});

		$httpBackend.flush();

		// Empty list of ids
		ids = [];
		ElementService.getElements(ids).then(function(elements) {
			expect(elements).toEqual([]);
		}, function(failMes) {
			console.log('This should not fail.');
		});


		// Along with valid ids, one invalid id - 404
		ids.push('_17784');

		ElementService.getElements(ids).then(function(elements) {
			console.log('This message should not be displayed.');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.message).toEqual('Not Found');
			expect(failMes.data).toEqual('[ERROR]: Element with id, _17784 not found\n[WARNING]: No elements found');
		});

		$httpBackend.flush();
		
	}));

	// done - minus workspaces != master
	it('getElementForEdit', inject(function() {

		// Default - no optional params
		ElementService.getElementForEdit('_17783').then(function(element) {
			expect(element.author).toEqual('jsalcedo');
		});

		// Default - updateFromServer = false
		ElementService.getElementForEdit('_17783', false).then(function(element) {
			expect(element.author).toEqual('jsalcedo');
		});

		// Default - [updateFromServer = false, workspaces = 'master']
		ElementService.getElementForEdit('_17783', false, 'master').then(function(element) {
			expect(element.author).toEqual('jsalcedo');
		});

		// workspaces != 'master'


		// exists in edits and update = false
		ElementService.getElementForEdit('_17783', false).then(function(element) {
			var element4Edit = element;
			element4Edit.author = 'muschek';

			ElementService.getElementForEdit('_17783', false).then(function(element2) {
				expect(element2.author).toEqual('muschek');
			});
		});

		// exists in edits and update = true
		ElementService.getElementForEdit('_17783', false).then(function(element) {
			var element4Edit = element;
			element4Edit.author = 'muschek';

			ElementService.getElementForEdit('_17783', true).then(function(element2) {
				expect(element2.author).toEqual('jsalcedo');
			});
		});

		// does not exist in edits and update = false
		// See - (Default - updateFromServer = false)

		// does not exist in edits and update = true
		ElementService.getElementForEdit('_17783', true).then(function(element) {
			expect(element.author).toEqual('jsalcedo');
		});

		// Bad sysmlid - 404
		ElementService.getElementForEdit('_17784', true).then(function(response) {
			console.log('This should not be displayed.');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.message).toEqual('Not Found');
			expect(failMes.data).toEqual('[ERROR]: Element with id, _17784 not found\n[WARNING]: No elements found');
		});

		// Error

		$httpBackend.flush();
	}));

	// done - unless redundant testing is required
	it('getElementsForEdit', inject(function() {


		// Default
		var ids = ['_17783', '_17448'];
		ElementService.getElementsForEdit(ids).then(function(elements) {
			expect(elements[0]).toEqual(element_17783);
			expect(elements[1]).toEqual(element_17448);

			var mod_17783 = elements[0];
			mod_17783.author = 'muschek';
			mod_17783.documentation = 'the documentation has been modified';

			var mod_17448 = elements[1];
			mod_17448.author = 'muschek';
			mod_17448.documentation = 'the documentation has been modified';


			// shows that the modifications exist in the edits cache
			ElementService.getElementsForEdit(ids).then(function(elements2) {
				expect(elements2[0]).toEqual(mod_17783);
				expect(elements2[1]).toEqual(mod_17448);
			});

			// shows that the modifications do not exist in the elements cache
			ElementService.getElements(ids).then(function(elements3) {
				expect(elements3[0]).toEqual(element_17783);
				expect(elements3[1]).toEqual(element_17448);
			})
		});
		$httpBackend.flush();


		// Empty list of ids
		ids = [];
		ElementService.getElementsForEdit(ids).then(function(elements) {
			expect(elements).toEqual([]);
		}, function(failMes) {
			console.log('This should not fail.');
		});

		// Bad sysmlid
		ids.push('_17784');
		ElementService.getElementsForEdit(ids).then(function(elements) {
			console.log('This should not be displayed.');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.message).toEqual('Not Found');
			expect(failMes.data).toEqual('[ERROR]: Element with id, _17784 not found\n[WARNING]: No elements found');
		});
		$httpBackend.flush();

	}));

	// is an empty function
	it('getOwnedElements', inject(function() {}));

	// done - minus error and specialization portion
	it('updateElement', inject(function() {

		// Default - also does not exist in elements or edits
		ElementService.updateElement(updated_17783).then(function(updatedElement) {

			// because updated_17783's owner property was deleted
			expect(updatedElement).toEqual(updated_17783);
			expect(updatedElement.owner).not.toBeDefined();
			expect(updated_17783.owner).not.toBeDefined();
		}); $httpBackend.flush();

		ElementService.updateElement(element_17783); // reset the elements array to original value
		$httpBackend.flush();

		// reset the owner values
		updated_17783.owner = '_17448';
		element_17783.owner = '_17448'; 


		// Default - master = 'master' - also exists in elements
		ElementService.updateElement(updated_17783, 'master').then(function(updatedElement) {
		
			expect(updatedElement).toEqual(updated_17783);
			expect(updatedElement.owner).not.toBeDefined();
		}); $httpBackend.flush();

		ElementService.updateElement(element_17783); // reset the elements array to original value
		$httpBackend.flush();

		// reset the owner values
		updated_17783.owner = '_17448';
		element_17783.owner = '_17448'; 
		

		// sysmlid missing
		var noIdElement = {author:'muschek', name: 'noIdElement', specialization: {type: 'Package'}, 
							editable: true};

		ElementService.updateElement(noIdElement, 'master').then(function(response) {
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes).toEqual('Element id not found, create element first!');
		});

		// exists in edits
		// create element, get it back for editing, edit then update, re-edit and update,
		// check the copy gotten for edit and check for it to have updated
		var noSpec = {author: 'muschek', name:'noSpec'};
		ElementService.createElement(noSpec);
		$httpBackend.flush();

		ElementService.getElementForEdit('noSpec').then(function(response) {
			var noSpec4Edit = response;
			noSpec4Edit.name = 'updated noSpec';
			ElementService.updateElement(noSpec4Edit).then(function(response2) {
				var noSpec4Edit2 = response2;
				noSpec4Edit2.name = 'reUpdated noSpec';

				ElementService.updateElement(noSpec4Edit2).then(function(response3) {
					expect(response3.name).toEqual('reUpdated noSpec');
					expect(noSpec4Edit.name).toEqual('reUpdated noSpec');
				})
			});
		});
		$httpBackend.flush();


		// However, the owner value is retained in the response as long as the
		// element already existed in the elements cache.
		ElementService.getElement('_17448');
		$httpBackend.flush();

		ElementService.updateElement(updated_17448).then(function(updatedElement) {
			expect(updatedElement).not.toEqual(updated_17448);
			expect(updatedElement.owner).toBeDefined();
		});
		$httpBackend.flush();

		updated_17448.owner = 'PROJECT-78b1ddf7-0d4f-4507-bf41-6ea9b48249d4';
		// does not test the specialization portion
		
	}));
	// done - unless redundant testing is required
	it('updateElements', inject(function() {

		// First, need to ensure the sysmlids are in the elements cache
		ElementService.getElements(['_17448', '_17783']).then(function(elements) {
			expect(elements[0]).toEqual(element_17448);
			expect(elements[1]).toEqual(element_17783);

		});
		$httpBackend.flush();

		// Then, you can try to update
		ElementService.updateElements([updated_17448, updated_17783]).then(function(elements) {

			// updateElements has now deleted the owner property of both updated_17448 & updated_17783
			expect(updated_17448.owner).not.toBeDefined();
			expect(updated_17783.owner).not.toBeDefined();

			// however, the returned elements have owner properties due to their existence in the cache
			expect(elements[0].owner).toBeDefined();
			expect(elements[1].owner).toBeDefined();

			var ids = [updated_17448.sysmlid, updated_17783.sysmlid];

			ElementService.getElements(ids).then(function(elements2) {

				expect(elements2[0]).not.toEqual(element_17448);
				expect(elements2[1]).not.toEqual(element_17783);
			});
		}); $httpBackend.flush();

		updated_17448.owner = 'PROJECT-78b1ddf7-0d4f-4507-bf41-6ea9b48249d4';
		updated_17783.owner = '_17448';

		// empty list of elements to update
		ElementService.updateElements([]).then(function(response) {
			expect(response).toEqual([]);
		}); 

		// Update with an element without a sysmlid
		ElementService.updateElements([{author:'muschek', name:'invalid'}]).then(function(response) {
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes).toEqual('Element id not found, create element first!');
		});

		//$httpBackend.flush();

	}));

	// done
	it('createElement', inject(function() {
		// Default
		ElementService.createElement(newElement).then(function(response) {
			expect(response.author).toEqual('muschek');
		});


		// Owner not specified
		var modNewElement = newElement;
		delete modNewElement.owner;
		ElementService.createElement(modNewElement).then(function(response) {
			expect(response.owner).toEqual('PROJECT-21bbdceb-a188-45d9-a585-b30bba346175');
		});


		// Sysmlid given
		var modNewElement2 = newElement;
		modNewElement2.sysmlid = '019f';
		ElementService.createElement(modNewElement2).then(function(response) {
			console.log('should not be calling here');

		}, function(failMes) {
			expect(failMes.status).toEqual(200);
			expect(failMes.message).toEqual('Element create cannot have id');
		});

		// Error

		$httpBackend.flush();
	}));

	// done - unless redundant testing is required
	it('createElements', inject(function() {

		var newElement = {author:'muschek', name:'newElement', owner:'newElement2'};
		var newElement2 = {author:'muschek', name:'newElement2', owner: 'anotherElement'};

		// Default
		ElementService.createElements([newElement, newElement2]).then(function(elements) {

			expect(elements[0].sysmlid).toBeDefined();
			expect(elements[1].sysmlid).toBeDefined();

			newElement.sysmlid = elements[0].sysmlid;
			newElement2.sysmlid = elements[1].sysmlid;

			expect(elements[0]).toEqual(newElement);
			expect(elements[1]).toEqual(newElement2);
		}); $httpBackend.flush();

		// Empty array for new elements
		ElementService.createElements([]).then(function(elements) {
			expect(elements).toEqual([]);
		});

		// Preset sysmlid
		var newElement3 = {author: 'muschek', name:'preset sysmlid', sysmlid:12345, owner:'anotherElement'};
		ElementService.createElements([newElement3]).then(function(elements) {
			console.log('Should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
			expect(failMes.message).toEqual('Element create cannot have id');
		});

		// No owner set
		var newElement4 = {author: 'muschek', name:'no owner element'};
		ElementService.createElements([newElement4]).then(function(elements) {
			
			expect(elements[0].owner).toEqual('PROJECT-21bbdceb-a188-45d9-a585-b30bba346175');
			newElement4.sysmlid = elements[0].sysmlid;
			expect(elements[0]).toEqual(newElement4);
		}); $httpBackend.flush();
	}));

	// uncertain how to test
	it('getGenericElements', inject(function() {

	}));

	// done
	it('isDirty', inject(function() {

		// Basic get and check if it has changed
		ElementService.getElement('_17448').then(function(element) {
			expect(ElementService.isDirty('_17448')).toEqual(false);
		});

		// Change and check
		ElementService.getElementForEdit('_17448').then(function(element) {
			var element4Edit = element;

			// Before change, still clean
			expect(ElementService.isDirty('_17448')).toEqual(false);

			// After change, now dirty
			element4Edit.author = 'muschek';
			expect(ElementService.isDirty('_17448')).toEqual(true);
		})

		$httpBackend.flush();

	}));

	// accesses $http - untested
	it('search', inject(function() {

	}));
});

// NotificationService - (done), 3 methods, [3 empty]
describe('NotificationService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the NotificationService and methods are valid', inject(function() {
		expect(NotificationService).toBeDefined();

		expect(NotificationService.getFollowing).not.toBe(null);
		expect(NotificationService.follow).not.toBe(null);
		expect(NotificationService.unfollow).not.toBe(null);
	}));

	it('getFollowing', inject(function() {

	}));

	it('follow', inject(function() {

	}));

	it('unfollow', inject(function() {

	}));
});

// ProjectService - (done), [empty]
describe('ProjectService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the ProjectService', inject(function() {
		expect(ProjectService).toBeDefined();
		expect(ProjectService()).toEqual({});
	}))
});

// SearchService - (done), [1 expected failure]
describe('SearchService', function() {
	beforeEach(module('mms'));

	var SearchService, $httpBackend;

	beforeEach(inject(function($injector) {

		SearchService = $injector.get('SearchService');
		$httpBackend = $injector.get('$httpBackend');
	}));

	it('can get an instance of the SearchService and methods are valid', inject(function() {
		expect(SearchService).toBeDefined();

		expect(SearchService.searchElements).not.toBe(null);
	}));

	// depreciated function, results in a TypeError being thrown
	it('searchElements', inject(function() {

		expect(function() {SearchService.searchElements('muschek')}).toThrow(new TypeError('URLService.getRoot is not a function'));
	}));
});

// SiteService - (done), [2 $http, 4 normal, 1 empty]
describe('SiteService', function() {
	beforeEach(module('mms'));

	var SiteService, $httpBackend;

	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
		SiteService = $injector.get('SiteService');

		$httpBackend.whenGET('/alfresco/service/rest/sites').respond([
            {name: 'europa', title: 'Europa'}
        ]);		

	}));

	it('can get an instance of the SiteService and methods are valid', inject(function() {
		expect(SiteService).toBeDefined();

		expect(SiteService.getCurrentSite).not.toBe(null);
		expect(SiteService.setCurrentSite).not.toBe(null);
		expect(SiteService.getCurrentWorkspace).not.toBe(null);
		expect(SiteService.setCurrentWorkspace).not.toBe(null);
		expect(SiteService.getSites).not.toBe(null);
		expect(SiteService.getSite).not.toBe(null);
		expect(SiteService.getSiteProjects).not.toBe(null);
	}));

	// done
	it('getCurrentSite', inject(function() {
		expect(SiteService.getCurrentSite()).toBe('europa');
	}));

	// done
	it('setCurrentSite', inject(function() {
		SiteService.setCurrentSite('notEuropa');
		expect(SiteService.getCurrentSite()).toBe('notEuropa');
	}));

	// done
	it('getCurrentWorkspace', inject(function() {
		expect(SiteService.getCurrentWorkspace()).toBe('master');
	}));

	// done
	it('setCurrentWorkspace', inject(function() {
		SiteService.setCurrentWorkspace('notMaster');
		expect(SiteService.getCurrentWorkspace()).toBe('notMaster');
	}))

	// done
	it('getSites', inject(function() {

		SiteService.getSites().then(function(data) {
        	expect(data).toEqual([{name: 'europa', title: 'Europa'}]);
        });

        $httpBackend.flush();
	}));

	// done
	it('getSite', inject(function() {
			
        SiteService.getSite('europa').then(function(site) {
            expect(site).toEqual({name: 'europa', title: 'Europa'});
        });

        $httpBackend.flush();
	}));

	// empty function
	it('getSiteProjects', inject(function() {

	}))
});

// URLService - (done), 16 methods, [16 normal]
describe('URLService', function() {
	beforeEach(module('mms'));

	var root = '/alfresco/service';
	var id = 'id';
	var site = 'siteName';
	var workspace = 'workspaceName';

	var Service;

	it('can get an instance of URLService', inject(function() {
		//URLService function exists
		expect(URLService).toBeDefined();
		//URLService returns object that has all these attributes
		Service = URLService();
		expect(Service.getSiteDashboardURL).toBeDefined();
		expect(Service.getElementURL).toBeDefined();
		expect(Service.getElementVersionsURL).toBeDefined();
		expect(Service.getPostElementsURL).toBeDefined();
		expect(Service.handleHttpStatus).toBeDefined();
		expect(Service.getSitesURL).toBeDefined();
		expect(Service.getElementSearchURL).toBeDefined();
		expect(Service.getImageURL).toBeDefined();
		expect(Service.getProductSnapshotsURL).toBeDefined();
		expect(Service.getConfigSnapshotsURL).toBeDefined();
		expect(Service.getSiteProductsURL).toBeDefined();
		expect(Service.getConfigURL).toBeDefined();
		expect(Service.getSiteConfigsURL).toBeDefined();
		expect(Service.getConfigProductsURL).toBeDefined();
		expect(Service.getDocumentViewsURL).toBeDefined();
		expect(Service.getViewElementsURL).toBeDefined();
	}));

	it('getConfigSnapshotsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/configurations/' + id + '/snapshots';
		expect(Service.getConfigSnapshotsURL(id, site, workspace)).toBe(expectedReturn);
	}));

	it('getProductSnapshotsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/products/' + id + '/snapshots';
		expect(Service.getProductSnapshotsURL(id, site, workspace)).toBe(expectedReturn)
	}));

	it('getSiteConfigsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/configurations';
		expect(Service.getSiteConfigsURL(site, workspace)).toBe(expectedReturn);
	}));

	it('getConfigProductsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/configurations/' + id + '/products';
		expect(Service.getConfigProductsURL(id, site, workspace)).toBe(expectedReturn);
	}));

	it('getConfigURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/configurations/' + id;
		expect(Service.getConfigURL(id, site, workspace)).toBe(expectedReturn);
	}));

	it('getSiteProductsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/products';
		expect(Service.getSiteProductsURL(site, workspace)).toBe(expectedReturn);
	}));

	it('getImageURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/artifacts/' + id;
		// First just get it to work with the latest
		expect(Service.getImageURL(id, workspace, 'latest')).toBe(expectedReturn);
		// Then with a version
	}));

	it('getSiteDashboardURL', inject(function() {
		var expectedReturn = '/share/page/site/' + site + '/dashboard';
		expect(Service.getSiteDashboardURL(site)).toBe(expectedReturn);
	}));

	it('getElementURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/elements/' + id;
		// Another version dependent function
		// But actually independent?
		expect(Service.getElementURL(id, workspace, 'latest')).toBe(expectedReturn);
	}));

	it('getDocumentViewsURL', inject(function() {
		var expectedReturn = root + '/javawebscripts/products/' + id + '/views';
		expect(Service.getDocumentViewsURL(id, workspace, 'latest')).toBe(expectedReturn);
	}));

	it('getViewElementsURL', inject(function() {
		var expectedReturn = root + '/javawebscripts/views/' + id + '/elements';
		expect(Service.getViewElementsURL(id, workspace, 'latest')).toBe(expectedReturn);
	}));

	it('getElementVersionsURL', inject(function() {
		var expectedReturn = root + '/javawebscripts/elements/' + id + '/versions';
		expect(Service.getElementVersionsURL(id, workspace)).toBe(expectedReturn);
	}));

	it('getPostElementsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/elements';
		expect(Service.getPostElementsURL(workspace)).toBe(expectedReturn);
	}));

	it('getSitesURL', inject(function() {
		var expectedReturn = root + '/rest/sites';
		expect(Service.getSitesURL()).toBe(expectedReturn);
	}));

	it('getElementSearchURL', inject(function() {
		var query = 'queryKeyword';
		var expectedReturn = root + '/javawebscripts/element/search?keyword=' + query;
		expect(Service.getElementSearchURL(query, workspace)).toBe(expectedReturn);
	}));

	/*
	Private methods: isTimestamp, addVersion, handleHttpStatus
	Not tested
	*/
});

// UtilsService - incomplete, 2 methods, [1 normal, 1 other]
describe('UtilsService', function() {
	beforeEach(module('mms'));

	var UtilsService;

	beforeEach(inject(function($injector) {
		UtilsService = $injector.get('UtilsService');
	}));

	it('can get an instance of the UtilsService and methods are valid', inject(function() {
		expect(UtilsService).toBeDefined();

		expect(UtilsService.hasCircularReference).not.toBe(null);
		expect(UtilsService.cleanElement).not.toBe(null);
	}));

	// will need to come up with way to test this
	it('hasCircularReference', inject(function() {

	}));

	// done
	it('cleanElement', inject(function() {

		// hasProperty('specialization'), specialization.type == 'Property', spec.value !== array
		var dirtyElement = {author:'muschek', sysmlid:12345, name:'dirtyElement', owner:'otherElement', 
			specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID', 
			value: 'not an array'}};
		UtilsService.cleanElement(dirtyElement);
		expect(dirtyElement.specialization.value).toEqual([]);

		// !-- NOTE: under new API will not get a value that contains a specialization --!
		// hasProperty('specialization'), specialization.type == 'Property', spec.value == array, 
		// elements in value have property specialization
		var dirtyElement2 = {author:'muschek', sysmlid:12346, name:'dirtyElement2', owner:'otherElement', 
			specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID',
			value:[{type:'ValueWithSpec', specialization:{type:'Unknown'}}, 
			{type:'ValueWithSpec', specialization:{type:'Unknown'}}]}};
		UtilsService.cleanElement(dirtyElement2);
		expect(dirtyElement2.specialization.value[0].specialization).not.toBeDefined();
		expect(dirtyElement2.specialization.value[1].specialization).not.toBeDefined();

		// !-- NOTE: this path does nothing --!
		// hasProperty('specialization'), specialization.type == 'View'
		var dirtyElement3 = {author:'muschek', sysmlid:12347, name:'dirtyElement3', owner:'otherElement',
		specialization: {type:'View', contains:[{type:'Paragraph', sourceType:'text', text:'insert paragraph'}],
		displayedElements:['displayedElementID', 'displayedElementID2'], 
		allowedElements:['allowedElementID', 'allowedElementID2'], childrenViews:[]}};
		UtilsService.cleanElement(dirtyElement3);
		expect(dirtyElement3.specialization.displayedElements).toBeDefined();
		expect(dirtyElement3.specialization.allowedElements).toBeDefined();

		// !hasProperty('specialization')
		var nonDirtyElement = {author:'muschek', sysmlid:12348, name:'nonDirtyElement', owner:'otherElement'};
		UtilsService.cleanElement(nonDirtyElement);
		expect(nonDirtyElement.author).toEqual('muschek');
		expect(nonDirtyElement.sysmlid).toEqual(12348);
		expect(nonDirtyElement.name).toEqual('nonDirtyElement');
		expect(nonDirtyElement.owner).toEqual('otherElement');
	}));
});

// VersionService - incomplete, 4 methods, [4 $http]
describe('VersionService', function() {
	beforeEach(module('mms'));

	var basicFormat = '2014-07-21T15:04:46.336-0700';

	var VersionService, $httpBackend, $rootScope;

	beforeEach(inject(function($injector) {
		VersionService = $injector.get('VersionService');
		$httpBackend = $injector.get('$httpBackend');
		$rootScope = $injector.get('$rootScope');

		$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/badId\?timestamp+/)
		.respond(function(method, url) {
			var errorMessage = '[ERROR]: Element with id, badId not found\n[WARNING]: No elements found';
			return [404, errorMessage];
		});

		$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/emptyId+/)
		.respond({elements:[]});
	/*
			$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/12345\?timestamp=01-01-2014+/).respond(
			{elements: [{author:'muschek', name:'basicElement', sysmlid:12345, lastModified:'01-01-2014'}]});
			$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/12345\?timestamp=02-01-2014+/).respond(
			{elements: [{author:'muschek', name:'basicElement', sysmlid:12345, lastModified:'02-01-2014'}]});
			$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/12346\?timestamp=01-01-2014+/).respond(
			{elements: [{author:'muschek', name:'anotherBasicElement', sysmlid:12346, lastModified:'01-01-2014'}]});
	*/

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12345?timestamp=01-01-2014').respond(
			{elements: [{author:'muschek', name:'basicElement', sysmlid:12345, lastModified:'01-01-2014'}]});

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12345?timestamp=02-01-2014').respond(
			{elements: [{author:'muschek', name:'basicElement', sysmlid:12345, lastModified:'02-01-2014'}]});

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12346?timestamp=01-01-2014').respond(
			{elements: [{author:'muschek', name:'anoterBasicElement', sysmlid:12346, lastModified: '01-01-2014'}]});

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12345/versions').respond(
			{versions: [{sysmlid:12345, timestamp:'01-01-2014', versionLabel:'14.1'}, 
			{sysmlid:12345, timestamp:'02-01-2014', versionLabel:'14.2'}]});
			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12346/versions').respond(
			{versions: [{sysmlid:12346, timestamp:'01-01-2014', versionLabel:'14.1'}]});

			// Version testing will be kept to timestamps for the time being
	}));


	it('can get an instance of VersionService', inject(function() {
		expect(VersionService).toBeDefined();

		expect(VersionService.getElement).toBeDefined();
		expect(VersionService.getElements).toBeDefined();
		expect(VersionService.getElementVersions).toBeDefined();
		expect(VersionService.getGenericElements).toBeDefined();
	}));

	// done
	it('getElement', inject(function() {
		
		// !inProgress.hasProperty(key), !elements.hasProperty(id), error
		VersionService.getElement('badId', '01-01-2014', 'master').then(function(response){
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.data).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
			expect(failMes.message).toEqual('Not Found');
		}); $httpBackend.flush();
		// badId now exist in elements

		// ..., elements.hasProperty(id), !elements[id].hasProperty(version), error
		VersionService.getElement('badId', '01-01-2014', 'master').then(function(response){
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.data).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
			expect(failMes.message).toEqual('Not Found');
		}); $httpBackend.flush();

		// !inProgress.hasProperty(key), !elements.hasProperty(id), success, elements.length <= 0
		VersionService.getElement('emptyId', '01-01-2014', 'master').then(function(response){
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
			expect(failMes.data).toEqual({elements:[]});
			expect(failMes.message).toEqual('Not Found');
		}); $httpBackend.flush();
		// emptyId now exists in elements

		// ..., elements.hasProperty(id), success, elements.length <= 0
		VersionService.getElement('emptyId', '01-01-2014', 'master').then(function(response){
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
			expect(failMes.data).toEqual({elements:[]});
			expect(failMes.message).toEqual('Not Found');
		}); $httpBackend.flush();

		// !inProgress.hasProperty(key), !elements.hasProperty(id), success, elements.length > 0
		VersionService.getElement('12345', '01-01-2014', 'master').then(function(response) {
			expect(response.author).toEqual('muschek');
			expect(response.name).toEqual('basicElement');
			expect(response.sysmlid).toEqual(12345);
			expect(response.lastModified).toEqual('01-01-2014');
		}); $httpBackend.flush();
		// 12345 now exists in elements, and 01-01-2014 version exists in cache

		// ..., elements.hasProperty(id), !elements[id].hasProperty(version), success, elements.length > 0
		VersionService.getElement('12345', '02-01-2014', 'master').then(function(response) {
			expect(response.author).toEqual('muschek');
			expect(response.name).toEqual('basicElement');
			expect(response.sysmlid).toEqual(12345);
			expect(response.lastModified).toEqual('02-01-2014');
		}); $httpBackend.flush();
		// 02-01-2014 version now exists in cache

		// ..., ..., elements[id].hasProperty(version)
		VersionService.getElement('12345', '01-01-2014', 'master').then(function(response) {
			expect(response.author).toEqual('muschek');
			expect(response.name).toEqual('basicElement');
			expect(response.sysmlid).toEqual(12345);
			expect(response.lastModified).toEqual('01-01-2014');
		}); $rootScope.$apply();

		// inProgress.hasProperty(key)
		var firstPromise = VersionService.getElement('12346', '01-01-2014');
		var secondPromise = VersionService.getElement('12346', '01-01-2014');
		var thirdPromise = VersionService.getElement('12346', '02-01-2014');
		var fourthPromise = VersionService.getElement('12346', '01-01-2014', 'otherWorkspace'); 
		expect(secondPromise).toEqual(firstPromise);
		expect(thirdPromise).not.toEqual(firstPromise);
		expect(fourthPromise).not.toEqual(firstPromise);
	}));

	// 1 of 4 done
	it('getElements', inject(function() {
		var ids = ['12345', '12346'];

		// Default
		VersionService.getElements(ids, '01-01-2014', 'master').then(function(response) {
			var element1 = response[0];
			var element2 = response[1];

			expect(element1.name).toEqual('basicElement');
			expect(element2.name).toEqual('anotherBasicElement');
		}); $httpBackend.flush();


		// Some or none of the elements have the given timestamp
		
		// Some or all of the ids are invalid

		// Redundant testing similar to getElement
	}));

	// !-- NOTE: is using old API --!
	// done, however, all will fail
	it('getElementVersions', inject(function() {

		// (!versions.hasProperty(id) && !update), error
		VersionService.getElementVersions('badId', false, 'master').then(function(response) {
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.message).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
		}); $httpBackend.flush();

		// (!versions.hasProperty(id) && !update), success
		VersionService.getElementVersions('12345', false, 'master').then(function(response) {
			expect(response.length).toEqual(2);
			var version1 = response[0];
			var version2 = response[1];
			expect(version1.versionLabel).toEqual('14.1');
			expect(version2.versionLabel).toEqual('14.2');
		}); $httpBackend.flush();
		// versions now contains 12345's versions

		// (!versions.hasProperty(id) && update), success
		VersionService.getElementVersions('12346', true, 'master').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0].versionLabel).toEqual('14.1');
		}); $httpBackend.flush();
		// versions now contains 12346's versions

		// (versions.hasProperty(id) && !update)
		VersionService.getElementVersions('12346', false, 'master').then(function(response) {
			// modify the version's data as to check if it modifies
			response[0].versionLabel = '14.7';
		}); $rootScope.$apply();

		VersionService.getElementVersions('12346', false, 'master').then(function(response) {
			expect(response[0].sysmlid).toEqual('12346');
			expect(response[0].versionLabel).toEqual('14.7');
		}); $rootScope.$apply();

		// (versions.hasProperty(id) && update), success
		VersionService.getElementVersions('12346', true, 'master').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0].sysmlid).toEqual('12346');
			expect(response[0].versionLabel).toEqual('14.1');
		}); $httpBackend.flush();
	}));

	// 0 of 4
	it('getGenericElements', inject(function() {

		// !inProgress.hasProperty(progress), error

		// !inProgress.hasProperty(progress), success, !elements.hasProperty(element.sysmlid)

		// ..., success, elements.hasProperty(element.sysmlid), !elements[element.sysmlid].hasProperty(version)

		// ..., ..., elements.hasProperty(element.sysmlid), elements[element.sysmlid].hasProperty(version)
	}));
});

// ViewService - incomplete, 18 methods, [4 empty,  4 tested, 10 use $http]
describe('ViewService', function() {
	beforeEach(module('mms'));

	var ViewService, $httpBackend, $rootScope;

	beforeEach(inject(function($injector) {
		ViewService = $injector.get('ViewService');
		$httpBackend = $injector.get('$httpBackend');
		$rootScope = $injector.get('$rootScope');
	}));

	it('can get an instance of the ViewService and methods are valid', inject(function() {
		expect(ViewService).toBeDefined();

		expect(ViewService.getView).not.toBe(null);
		expect(ViewService.getViews).not.toBe(null);
		expect(ViewService.getDocument).not.toBe(null);
		expect(ViewService.updateView).not.toBe(null);
		expect(ViewService.updateDocument).not.toBe(null);
		expect(ViewService.getViewElements).not.toBe(null);
		expect(ViewService.getViewComments).not.toBe(null);
		expect(ViewService.addViewComment).not.toBe(null);
		expect(ViewService.deleteViewComment).not.toBe(null);
		expect(ViewService.updateViewElements).not.toBe(null);
		expect(ViewService.createView).not.toBe(null);
		expect(ViewService.addViewToDocument).not.toBe(null);
		expect(ViewService.getDocumentViews).not.toBe(null);
		expect(ViewService.getSiteDocuments).not.toBe(null);
		expect(ViewService.setCurrentViewId).not.toBe(null);
		expect(ViewService.setCurrentDocumentId).not.toBe(null);
		expect(ViewService.getCurrentViewId).not.toBe(null);
		expect(ViewService.getCurrentDocumentId).not.toBe(null);
	}));

	// just calls ElementService
	it('getView', inject(function() {

	}));

	// just calls ElementService
	it('getViews', inject(function() {

	}));

	// just calls ElementService
	it('getDocument', inject(function() {

	}));

	// just calls ElementService
	it('updateView', inject(function() {

	}));

	// just calls ElementService
	it('updateDocument', inject(function() {

	}));

	// testable
	it('getViewElements', inject(function() {

	}));

	// testable
	it('getDocumentViews', inject(function() {

	}));

	// done, empty
	it('getViewComments', inject(function() {}));

	// done, empty
	it('addViewComment', inject(function() {}));

	// done, empty
	it('deleteViewComment', inject(function() {}));

	// done, empty
	it('updateViewElements', inject(function() {}));

	// testable
	it('addViewToDocument', inject(function() {

	}));

	// testable
	it('createView', inject(function() {

	}));

	// testable
	it('getSiteDocuments', inject(function() {

	}));

	it('getCurrentViewId', inject(function() {
		expect(ViewService.getCurrentViewId()).toBe('');
	}));

	it('setCurrentViewId', inject(function() {
		ViewService.setCurrentViewId('newViewId');
		expect(ViewService.getCurrentViewId()).toBe('newViewId');
	}));

	it('getCurrentDocumentId', inject(function() {
		expect(ViewService.getCurrentDocumentId()).toBe('');
	}));

	it('setCurrentDocumentId', inject(function() {
		ViewService.setCurrentDocumentId('newDocumentId');
		expect(ViewService.getCurrentDocumentId()).toBe('newDocumentId');
	}));
});

// VizService - incomplete, 1 method, [1 uses $http]
describe('VizService', function() {
	beforeEach(module('mms'));

	var Service;

	it('can get an instance of the VizService and methods are valid', inject(function() {
		expect(VizService).toBeDefined();

		Service = VizService();
		expect(Service.getImageURL).not.toBe(null);
	}));

	// uses $http
	it('getImageURL', inject(function() {

	}));
});
