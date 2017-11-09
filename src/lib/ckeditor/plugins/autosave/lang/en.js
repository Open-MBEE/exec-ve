/*
Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/
CKEDITOR.plugins.setLang('autosave', 'en', {
    dateFormat: 'LLL',
    autoSaveMessage: 'Saved Locally <a href="https://opencae.jpl.nasa.gov/alfresco/mmsapp/mms.html#/projects/PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85/master/documents/_18_0_2_8630260_1446850132083_177552_51111/views/MMS_1506985433518_b5775631-5dce-484b-abea-2f4860a23b36" target="_blank"><i class="fa fa-info-circle" aria-hidden="true"></i></a>',
    loadSavedContent: 'A recovered version from <b>{0}</b> has been found. <br><br>Would you like to review and optionally load or discard this version?<br><br>',
    title: 'Load Recovered Version?',
    loadedContent: 'Last Saved', 
    localStorageFull: 'Browser localStorage is full, clear your storage or Increase database size',
    autoSavedContent: 'Recovered from: \'',
  ok: 'Load',
  no: 'Discard',
  sideBySide: 'Side by side view',
  inline: 'Inline view'
});
