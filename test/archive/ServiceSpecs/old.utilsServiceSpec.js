'use strict';

// !-- NOTE: ask Doris how to test the hasCircularReference function --!
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

		// !hasProperty('specialization')
		var nonDirtyElement = {author:'muschek', sysmlid:12348, name:'nonDirtyElement', owner:'otherElement'};
		UtilsService.cleanElement(nonDirtyElement);
		expect(nonDirtyElement.author).toEqual('muschek');
		expect(nonDirtyElement.sysmlid).toEqual(12348);
		expect(nonDirtyElement.name).toEqual('nonDirtyElement');
		expect(nonDirtyElement.owner).toEqual('otherElement');

		// !-- NOTE: this path does nothing --!
		// hasProperty('specialization'), !(elem.specialization.type === 'Property'), !(elem.specialization.type === 'View')
		var nonDirtyElement2 = {author:'muschek', sysmlid:12349, name:'nonDirtyElement2', owner:'otherElement',
		specialization: { type:'Comment' } };
		UtilsService.cleanElement(nonDirtyElement2);
		expect(nonDirtyElement2).toEqual(
			{author:'muschek', sysmlid:12349, name:'nonDirtyElement2', owner:'otherElement', specialization: { type:'Comment' } });

		// !-- NOTE: this path does nothing --!
		// hasProperty('specialization'), !(elem.specialization.type === 'Property'), (elem.specialization.type === 'View')
		var dirtyElement3 = {author:'muschek', sysmlid:12347, name:'dirtyElement3', owner:'otherElement',
		specialization: {type:'View', contains:[{type:'Paragraph', sourceType:'text', text:'insert paragraph'}],
		displayedElements:['displayedElementID', 'displayedElementID2'], 
		allowedElements:['allowedElementID', 'allowedElementID2'], childrenViews:[]}};
		UtilsService.cleanElement(dirtyElement3);
		expect(dirtyElement3.specialization.displayedElements).toBeDefined();
		expect(dirtyElement3.specialization.allowedElements).toBeDefined();


		// !-- NOTE: under new API will not get a value that contains a specialization --!
		// hasProperty('specialization'), (elem.specialization.type === 'Property'), !(!_.isArray(spec.value))
		var dirtyElement2 = {author:'muschek', sysmlid:12346, name:'dirtyElement2', owner:'otherElement', 
			specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID',
			value:[{type:'ValueWithSpec', specialization:{type:'Unknown'}}, 
			{type:'ValueWithSpec', specialization:{type:'Unknown'}}]}};
		UtilsService.cleanElement(dirtyElement2);
		expect(dirtyElement2.specialization.value[0].specialization).not.toBeDefined();
		expect(dirtyElement2.specialization.value[1].specialization).not.toBeDefined();

		// hasProperty('specialization'), (elem.specialization.type === 'Property'), (!_.isArray(spec.value))
		var dirtyElement = {author:'muschek', sysmlid:12345, name:'dirtyElement', owner:'otherElement', 
			specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID', 
			value: 'not an array'}};
		UtilsService.cleanElement(dirtyElement);
		expect(dirtyElement.specialization.value).toEqual([]);
	}));
});