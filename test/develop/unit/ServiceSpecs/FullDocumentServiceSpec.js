describe('Service: FullDocumentService', function() {
    var service;
    var $timeout;
    var $httpBackend;
    var mockedViews;


    beforeEach(module('mmsApp'));
    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $timeout = $injector.get('$timeout');

        mockedViews = [{id: 1}, {id: 2}, {id: 3}];
        service = new ($injector.get('FullDocumentService'))(mockedViews);

        $httpBackend.whenGET(function(url) {
            return url.indexOf('/alfresco/service/mms/login/ticket/') !== -1;
        } ).respond(200, {username: 'fakeUser'});
        $httpBackend.whenGET(function(url) {
            return url.indexOf('/alfresco/service/orgs?alf_ticket') !== -1;
        } ).respond(200, {orgs: ['org1']});
    }));

    afterEach(function() {
        // $timeout.verifyNoPendingTasks();
    });

    it('should add as many views as it can until the scrollbar shows up', function() {
        this.isScrollbarVisible = function(){};

        // Initially there should be no view
        expect(service.viewsBuffer.length).toEqual(0);

        // Mock loading some views till scrollbar shows up
        spyOn(this, 'isScrollbarVisible').and.returnValues(false, true);
        service.addInitialViews(this.isScrollbarVisible);
        $timeout.flush();

        // There should be two views added because scrollbar was invisible the first time, but visible the second time
        expect(service.viewsBuffer.length).toEqual(2);
    });

    it('should add more views as users scroll through the page', function() {
        service.handleDocumentScrolling();
        expect(service.viewsBuffer.length).toEqual(1);
        service.handleDocumentScrolling();
        expect(service.viewsBuffer.length).toEqual(2);
        service.handleDocumentScrolling();
        expect(service.viewsBuffer.length).toEqual(3);
        // when there is no more view, scrolling doesn't do anything
        service.handleDocumentScrolling();
        expect(service.viewsBuffer.length).toEqual(mockedViews.length);
    });

    it('should add all the remaining views when users want to do content export or other actions that require all the views to be loaded', function() {
        this.success = function() {}; // method to be called after all the views are loaded successfully
        spyOn(this, 'success');
        service.loadRemainingViews(this.success);
        $timeout.flush();

        expect(service.viewsBuffer.length).toEqual(mockedViews.length);
        expect(this.success).toHaveBeenCalled();

    });

    it ('should load more views up until the view the user clicks on if that view is not yet loaded', function() {
        var branch = {type: 'view', data: {id: 2}};
        this.success = function() {};
        spyOn(this, 'success');
        service.handleClickOnBranch(branch, this.success);
        $timeout.flush();

        // expect to load view with id = 1 and id = 2 because the user click on view with id = 2
        expect(service.viewsBuffer.length).toEqual(2);
        expect(this.success).toHaveBeenCalled();

    });

    it ('should load more views up until the view of the element the user clicks on if the view of that element is not yet loaded', function() {
        var branch = {type: 'figure', viewId: 3};
        this.success = function() {};
        spyOn(this, 'success');
        service.handleClickOnBranch(branch, this.success);
        $timeout.flush();

        // expect to load view with id = 1, id = 2 and id = 3 because the user click on an element in a view with id = 3
        expect(service.viewsBuffer.length).toEqual(3);
        expect(this.success).toHaveBeenCalled();

    });

    it('should not load more views when users click on a view that is already loaded', function() {
        var branch = {type: 'view', data: {id: 3}};
        this.success = function() {};
        spyOn(this, 'success');

        // load all the views before users click on a view in the tree
        service.loadRemainingViews(function(){});
        var noNeedToLoadMoreViews = service.handleClickOnBranch(branch, this.success);
        expect(noNeedToLoadMoreViews).toBeTruthy();
        expect(this.success).toHaveBeenCalled();
    });

    it('should load more views when users click on an element under a view that is already loaded', function() {
        var branch = {type: 'figure', viewId: 2};
        this.success = function() {};
        spyOn(this, 'success');

        // load all the views before users click on a an element under a view in the tree
        service.loadRemainingViews(function(){});
        var noNeedToLoadMoreViews = service.handleClickOnBranch(branch, this.success);
        expect(noNeedToLoadMoreViews).toBeTruthy();
        expect(this.success).toHaveBeenCalled();
    });

    it('should load more views up until the previous sibling view if it is not already loaded when users add a new view', function() {
        // load only the first view
        service.addInitialViews(function() {return true;});
        expect(service.viewsBuffer.length).toEqual(1);
        // add a view after the second view which is not yet loaded
        var viewToAdd = {id: 4};
        var prevSiblingViewId = 2;
        service.handleViewAdd(viewToAdd, prevSiblingViewId);
        expect(service.viewsBuffer.length).toEqual(3);
    });

    it('should not load anymore view if the previous sibling view is already loaded when users add a new view', function() {
        // load only the first view
        service.addInitialViews(function() {return true;});
        expect(service.viewsBuffer.length).toEqual(1);
        // add a view after the first view which is already loaded
        var viewToAdd = {id: 4};
        var prevSiblingViewId = 1;
        service.handleViewAdd(viewToAdd, prevSiblingViewId);
        expect(service.viewsBuffer.length).toEqual(2);
    });
});