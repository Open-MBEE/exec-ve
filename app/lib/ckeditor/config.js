/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	config.disableNativeSpellChecker = false;
	config.fullPage = false;
  config.removePlugins = 'resize';
	// config.extraPlugins = 'iframe,mediaembed,embed,
	config.extraPlugins = 'imagedrop,mmscf,mmscomment,mmsvlink,mmsreset';
  config.mathJaxLib = 'https://cdn.mathjax.org/mathjax/2.2-latest/MathJax.js?config=TeX-AMS_HTML';
	config.extraAllowedContent = 'script[language,type,src]; mms-maturity-bar[*]; tms-timely[*]; seqr-timely[*]; mms-d3-observation-profile-chart-io[*];  mms-d3-parallel-axis-chart-io[*]; mms-d3-radar-chart-io[*]; mms-d3-grouped-horizontal-bar-chart-io[*]; mms-site-docs[*]; mms-workspace-docs[*]; mms-diagram-block[*]; mms-view-link[*]; mms-transclude-doc[*]; mms-transclude-name[*]; mms-transclude-com[*]; mms-transclude-val[*]; mms-transclude-img[*]; math[*]; maction[*]; maligngroup[*]; malignmark[*]; menclose[*]; merror[*]; mfenced[*]; mfrac[*]; mglyph[*]; mi[*]; mlabeledtr[*]; mlongdiv[*]; mmultiscripts[*]; mn[*]; mo[*]; mover[*]; mpadded[*]; mphantom[*]; mroot[*]; mrow[*]; ms[*]; mscarries[*]; mscarry[*]; msgroup[*]; mstack[*]; msline[*]; mspace[*]; msqrt[*]; msrow[*]; mstyle[*]; msub[*]; msup[*]; msubsup[*]; mtable[*]; mtd[*]; mtext[*]; mtr[*]; munder[*]; munderover[*];';


	// EXAMPLES from CKEDITOR
  // config.disallowedContent = 'div,font';
	// // Remove some buttons provided by the standard plugins, which are
	// // not needed in the Standard(s) toolbar.
	// config.removeButtons = 'Underline,Subscript,Superscript';

	// // Set the most common block elements.
	// config.format_tags = 'p;h1;h2;h3;pre';

	// // Simplify the dialog windows.
	// config.removeDialogTabs = 'image:advanced;link:advanced';
};
