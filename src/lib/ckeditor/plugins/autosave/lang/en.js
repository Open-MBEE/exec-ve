/*
Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/
CKEDITOR.plugins.setLang('autosave', 'en', {
    dateFormat: 'LLL',
    autoSaveMessage: 'Saved Locally <a href="https://wiki.jpl.nasa.gov/display/opencae/View+Editor+User+Guide%3A+4+Autosave+to+the+browser%27s+localStorage" target="_blank"><i class="fa fa-info-circle" aria-hidden="true"></i></a>',
    loadSavedContent: 'A recovered version from <b>{0}</b> has been found. <br><br>Would you like to review and optionally load or discard this version?<br><br>',
    title: 'Load Recovered Version?',
    loadedContent: 'Last Saved', 
    localStorageFull: 'Browser localStorage is full, clear your storage or Increase database size',
    autoSavedContent: 'Recovered from: \'',
  ok: 'Load Recovered Version',
  no: 'Discard Recovered Version',
  sideBySide: 'Side by side (HTML)',
  inline: 'Inline'
});
