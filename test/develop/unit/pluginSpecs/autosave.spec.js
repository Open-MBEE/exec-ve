describe("Autosave plugin", function() {

  function isEmptyObject(object) {
    return Object.keys(object).length === 0;
  }

  function LocalStorage() {}
  LocalStorage.prototype.getItem = function(key) { return this[key]; };
  LocalStorage.prototype.setItem = function(key, value) { this[key] =  value; };
  LocalStorage.prototype.removeItem = function(key) { delete this[key]; };
  LocalStorage.prototype.length = function() { return Object.keys(this).length; };

  beforeAll(function() {
    this.mmsAutosavePlugin = window.CKEDITOR.MmsAutosavePlugin;
    this.mockedLZStringLib = { decompressFromUTF16: function(data) {return data;} };
    this.mockedMomentLib = {};
    this.minutesTillExpired = 10080; // 7 days in minutes
    this.autosaveValue = {
      data: 'data',
      saveTime: new Date('1/2/3456'),
      isAutosaveContent: true
    };
  });

  beforeEach(function() {
    this.mockedLocalStorage = new LocalStorage();
  });

  it('should return a valid autosave object given a valid json string. Return an empty object otherwise', function() {

    // Setup
    var boolAsContent = {key: '', value: 'true' };
    var nullAsContent = {key: '', value: 'null' };
    var undefinedAsContent = {key: '', value: 'undefined' };
    var stringAsAsContent =  {key: '', value: 'testing123' };
    var validAutosaveObject = {
      key: 'autosaveKey',
      value: JSON.stringify(this.autosaveValue)
    };


    // Act & Assert
    expect(isEmptyObject(this.mmsAutosavePlugin._jsonParse(boolAsContent))).toBeTruthy();
    expect(isEmptyObject(this.mmsAutosavePlugin._jsonParse(nullAsContent))).toBeTruthy();
    expect(isEmptyObject(this.mmsAutosavePlugin._jsonParse(undefinedAsContent))).toBeTruthy();
    expect(isEmptyObject(this.mmsAutosavePlugin._jsonParse(stringAsAsContent))).toBeTruthy();

    var actualAutosaveObject = this.mmsAutosavePlugin._jsonParse(validAutosaveObject);
    expect(actualAutosaveObject.value.isAutosaveContent).toEqual(this.autosaveValue.isAutosaveContent);
    expect(actualAutosaveObject.value.data).toEqual(this.autosaveValue.data);
    expect(actualAutosaveObject.value.saveTime).toEqual(this.autosaveValue.saveTime.toISOString());
  });

  it('should know how to get all autosave content', function() {

    // Setup
    this.mockedLocalStorage['autosave1'] = JSON.stringify(this.autosaveValue);
    this.mockedLocalStorage['non-autosave'] = 'view editor is cool';


    // Act & Assert
    var actualNumberOfAutosave = this.mmsAutosavePlugin._getAllAutosave(this.mockedLocalStorage, this.mockedLZStringLib);
    expect( actualNumberOfAutosave.length).toEqual(1);
  });

  it('should know how to remove all expired autosave content', function() {

    // Setup
    this.mockedLocalStorage['autosave1'] = 'content1';
    this.mockedLocalStorage['autosave2'] = 'content2';
    this.mockedLocalStorage['autosave3'] = 'content3';
    var listOfExpiredAutosave = [
      {key: 'autosave1'},
      {key: 'autosave2'}
    ];


    // Act & Assert
    expect(this.mockedLocalStorage.length()).toEqual(3);
    this.mmsAutosavePlugin._removeExpiredAutosave(this.mockedLocalStorage, listOfExpiredAutosave);
    expect(this.mockedLocalStorage.length()).toEqual(1)
  });

  describe('should know how to save autosave content to localStorage', function() {
    it('when the localStorage is not full', function() {

      // Setup
      var autosaveKey = 'autosave key';
      var autosaveContent = 'autosave content';


      // Act & Assert
      expect(this.mockedLocalStorage.length()).toEqual(0);

      this.mmsAutosavePlugin._trySavingContentToLocalStorage(this.mockedLocalStorage, this.mockedMomentLib,
          this.mockedLZStringLib, this.minutesTillExpired, autosaveKey, autosaveContent);
      expect(this.mockedLocalStorage.length()).toEqual(1)
    });

    it('when the localStorage is full by deleting expired autosave', function() {

      // Setup
      var self = this;
      this.mockedLocalStorage['autosave1'] = 'content1';
      var autosaveKey = 'autosave2';
      var autosaveContent = 'content2';

      // emulate window.localStorage throw behavior when reaches capacity's quota on first call
      // and succeed on the second call.
      var alreadyCalled = false;
      spyOn(LocalStorage.prototype, 'setItem').and.callFake(function() {
        if (!alreadyCalled) {
          alreadyCalled = true;
          throw {code:22};
        }
        this[autosaveKey] = autosaveContent;
      });

      spyOn(this.mmsAutosavePlugin, '_clearExpiredLocalStorageContents').and.callFake(function() {
        self.mockedLocalStorage.removeItem('autosave1');
      });


      // Act & Assert
      expect(this.mockedLocalStorage['autosave1']).toBeDefined();
      expect(this.mockedLocalStorage['autosave2']).not.toBeDefined();

      this.mmsAutosavePlugin._trySavingContentToLocalStorage(this.mockedLocalStorage, this.mockedMomentLib,
          this.mockedLZStringLib, this.minutesTillExpired, autosaveKey, autosaveContent);
      expect(this.mockedLocalStorage['autosave1']).not.toBeDefined();
      expect(this.mockedLocalStorage['autosave2']).toBeDefined();
    });
  });
});