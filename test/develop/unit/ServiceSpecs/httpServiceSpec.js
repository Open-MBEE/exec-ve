'use strict';
//HttpService: test adding requests with different priority, when queue is empty and full, changing request priority
describe('HttpService', function() {
	beforeEach(module('mms'));

	var HttpService, $httpBackend, $q;
    var url = "/alfresco/services/workspaces/master/elements";
	beforeEach(inject(function($injector) {
		HttpService = $injector.get('HttpService');
		$q = $injector.get('$q');
        $httpBackend = $injector.get('$httpBackend');
        // $httpBackend.whenRoute('GET', url+'/:element')
        //   .respond(function(method, url, data, headers, params) {
        //       return [200, 'okay'];
        //   });
        $httpBackend.whenGET(url+'/hello').respond( function(method, url, data) {
            return [200, 'okay'];
        });
        HttpService.setOutboundLimit(2);         
    }));
    
    //describe("httpService.get", inject(function($httpBackend, HttpService, $q) {
        it('should process priority 2, then prority 1', inject(function() {
              for(var i = 0; i< 100; i++){
                  HttpService.get(url+'/hello', function(){}, function(){}, 1);
                  if(i > 30 && i <= 50){
                    HttpService.get(url+'/hello', function(){}, function(){}, 2);
                }
              }
            $httpBackend.flush();
        }));    
        //});
    });