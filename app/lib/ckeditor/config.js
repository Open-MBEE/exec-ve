/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config
  config.pasteFromWordRemoveFontStyles = false;
  config.disableNativeSpellChecker = false;
  config.fullPage = false;
  config.removePlugins = 'resize';
  // config.extraPlugins = 'autogrow,mathjax,base64image,pastebase64,iframe,mediaembed,embed,codesnippet,
	config.extraPlugins = 'mmscf,mmscomment,mmsvlink,mmsreset';
  config.mathJaxLib = 'https://cdn.mathjax.org/mathjax/2.2-latest/MathJax.js?config=TeX-AMS_HTML';
  config.disallowedContent = 'div,font';
  config.extraAllowedContent = 'script[language,type,src]; mms-maturity-bar[*]; tms-timely[*]; seqr-timely[*]; mms-d3-observation-profile-chart-io[*];  mms-d3-parallel-axis-chart-io[*]; mms-d3-radar-chart-io[*]; mms-d3-grouped-horizontal-bar-chart-io[*]; mms-site-docs[*]; mms-workspace-docs[*]; mms-diagram-block[*]; mms-view-link[*]; mms-transclude-doc[*]; mms-transclude-name[*]; mms-transclude-com[*]; mms-transclude-val[*]; mms-transclude-img[*]; math[*]; maction[*]; maligngroup[*]; malignmark[*]; menclose[*]; merror[*]; mfenced[*]; mfrac[*]; mglyph[*]; mi[*]; mlabeledtr[*]; mlongdiv[*]; mmultiscripts[*]; mn[*]; mo[*]; mover[*]; mpadded[*]; mphantom[*]; mroot[*]; mrow[*]; ms[*]; mscarries[*]; mscarry[*]; msgroup[*]; mstack[*]; msline[*]; mspace[*]; msqrt[*]; msrow[*]; mstyle[*]; msub[*]; msup[*]; msubsup[*]; mtable[*]; mtd[*]; mtext[*]; mtr[*]; munder[*]; munderover[*];';

	// Simplify the dialog windows.
	config.removeDialogTabs = 'image:advanced;link:advanced';
};
