'use strict';
/* HttpService: test adding requests with different priority, 
 *  when queue is empty and full, changing request priority
 */
describe('HttpService', function() {
	beforeEach(module('mms'));
	
	var HttpService, $httpBackend, $q, httpMock, queue;
    var url = "/alfresco/services/workspaces/master/elements";
	// beforeEach(function () {
	// 	module(function($provide) {
	//         $provide.value('queue', 'TEST_VER');
	//       });
	// });
	beforeEach(inject(function($injector) {
		HttpService = $injector.get('HttpService');
		$q = $injector.get('$q');
        $httpBackend = $injector.get('$httpBackend');
		queue = HttpService.getQueue();
        $httpBackend.whenGET(url+'/hello').respond( function(method, url, data) {
            return [200, 'okay'];
        });
		$httpBackend.whenGET(url+'/world').respond( function(method, url, data) {
			return [200, 'okay'];
		});
		$httpBackend.whenGET(url+'/foo').respond( function(method, url, data) {
			return [200, 'okay'];
		});
		$httpBackend.whenGET(url+'/bar').respond( function(method, url, data) {
			return [200, 'okay'];
		});
        HttpService.setOutboundLimit(2);
		// var checkQueue = function(queue, priority){
		// 	for(var i = 0; i < queue[priority].length; i++){
		// 		console.log("queue " + priority + " : " + queue[priority][i].weight);
		// 	}
		// };         
    }));
	
	afterEach(function() {
		$httpBackend.verifyNoOutstandingRequest();
	});
	
    it('should process priority 2, then prority 1', inject(function() {
		for(var i = 0; i< 100; i++){
			HttpService.get(url+'/hello', function(){}, function(){}, 1);
			if(i > 30 && i <= 50){
				HttpService.get(url+'/hello', function(){}, function(){}, 2);
			}
		}
		$httpBackend.flush();
	}));    
	// it('test that queue is empty/full', inject(function() {
	// 
	// 	//$httpBackend.flush();
	// }));
	it('change the request priority via get()', inject(function() {
		HttpService.get(url+'/world', function(){}, function(){}, 1);
		HttpService.get(url+'/foo', function(){}, function(){}, 2);
		HttpService.get(url+'/hello', function(){}, function(){}, 0);
		HttpService.get(url+'/hello', function(){}, function(){}, 1);
		//expect(queue[0][0].weight).toBe(0); doesn't remove it from the queue
		// toBeEmptyObject();
		expect(queue[1][0].weight).toBe(1);
		// checkQueue(queue, 1);
		// checkQueue(queue, 2);
		//var queue = HttpService.getQueue();
		// console.log(queue[1].length);
		// for(var i = 0; i < queue[0].length; i++){
		// 	console.log("queue Zero:" + queue[1][i].weight);
		// }
		// for(var i = 0; i < queue[1].length; i++){
		// 	console.log("queue One:" + queue[1][i].weight);
		// }
		$httpBackend.flush();
	}));
	it('change the request priority via ping()', inject(function() {
		HttpService.get(url+'/world', function(){}, function(){}, 1);
		HttpService.get(url+'/foo', function(){}, function(){}, 2);
		HttpService.get(url+'/hello', function(){}, function(){}, 0);
		HttpService.ping(url+'/hello', 1);
		expect(queue[0].length).toBe(0);
		expect(queue[1][0].weight).toBe(1);
		$httpBackend.flush();
	}));
	it('get() should assign 1 to the weight to one without the weight parameter', inject(function() {
		HttpService.get(url+'/world', function(){}, function(){}, 1);
		HttpService.get(url+'/foo', function(){}, function(){}, 2);
		HttpService.get(url+'/hello', function(){}, function(){});
		expect(queue[1][0].weight).toBe(1);
		$httpBackend.flush();
	}));
	it('should change all requests in the Queue 1 to Queue 0', inject(function() {
		HttpService.get(url+'/world', function(){}, function(){}, 1);
		HttpService.get(url+'/foo', function(){}, function(){}, 2);
		HttpService.get(url+'/hello', function(){}, function(){}, 1);
		HttpService.transformQueue();
		expect(queue[0][0].weight).toBe(0);
		$httpBackend.flush();
	}));

});