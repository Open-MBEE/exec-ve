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
	config.tabSpaces = 4;
	// config.extraPlugins = 'iframe,mediaembed,embed,
	config.extraPlugins = 'font,image2,imagedrop,mmscf,mmscomment,mmsvlink,mmsreset,tableresize';
  config.mathJaxLib = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML';
	config.extraAllowedContent = 'mms-value-link[*]; mms-line-graph[*]; span[*]; audio[*]; video[*]; source[*]; mms-diff-attr[*]; script[language,type,src]; jira-issue-collector[*]; mms-maturity-bar[*]; tms-timely[*]; seqr-timely[*]; mms-d3-observation-profile-chart-io[*]; mms-d3-parallel-axis-chart-io[*]; mms-d3-radar-chart-io[*]; mms-d3-grouped-horizontal-bar-chart-io[*]; mms-site-docs[*]; mms-workspace-docs[*]; mms-diagram-block[*]; mms-view-link[*]; mms-transclude-doc[*]; mms-transclude-name[*]; mms-transclude-com[*]; mms-transclude-val[*]; mms-transclude-img[*]; math[*]; maction[*]; maligngroup[*]; malignmark[*]; menclose[*]; merror[*]; mfenced[*]; mfrac[*]; mglyph[*]; mi[*]; mlabeledtr[*]; mlongdiv[*]; mmultiscripts[*]; mn[*]; mo[*]; mover[*]; mpadded[*]; mphantom[*]; mroot[*]; mrow[*]; ms[*]; mscarries[*]; mscarry[*]; msgroup[*]; mstack[*]; msline[*]; mspace[*]; msqrt[*]; msrow[*]; mstyle[*]; msub[*]; msup[*]; msubsup[*]; mtable[*]; mtd[*]; mtext[*]; mtr[*]; munder[*]; munderover[*];';
	config.specialChars = ['&euro;', '&lsquo;', '&rsquo;', '&ldquo;', '&rdquo;', '&ndash;', '&mdash;', '&iexcl;', '&cent;', '&pound;', '&curren;', '&yen;', '&brvbar;', '&sect;', '&uml;', '&copy;', '&ordf;', '&laquo;', '&not;', '&reg;', '&macr;', '&deg;', '&sup2;', '&sup3;', '&acute;', '&micro;', '&para;', '&middot;', '&cedil;', '&sup1;', '&ordm;', '&raquo;', '&frac14;', '&frac12;', '&frac34;', '&iquest;', '&Agrave;', '&Aacute;', '&Acirc;', '&Atilde;', '&Auml;', '&Aring;', '&AElig;', '&Ccedil;', '&Egrave;', '&Eacute;', '&Ecirc;', '&Euml;', '&Igrave;', '&Iacute;', '&Icirc;', '&Iuml;', '&ETH;', '&Ntilde;', '&Ograve;', '&Oacute;', '&Ocirc;', '&Otilde;', '&Ouml;', '&times;', '&Oslash;', '&Ugrave;', '&Uacute;', '&Ucirc;', '&Uuml;', '&Yacute;', '&THORN;', '&szlig;', '&agrave;', '&aacute;', '&acirc;', '&atilde;', '&auml;', '&aring;', '&aelig;', '&ccedil;', '&egrave;', '&eacute;', '&ecirc;', '&euml;', '&igrave;', '&iacute;', '&icirc;', '&iuml;', '&eth;', '&ntilde;', '&ograve;', '&oacute;', '&ocirc;', '&otilde;', '&ouml;', '&divide;', '&oslash;', '&ugrave;', '&uacute;', '&ucirc;', '&uuml;', '&yacute;', '&thorn;', '&yuml;', '&OElig;', '&oelig;', '&#372;', '&#374', '&#373', '&#375;', '&sbquo;', '&#8219;', '&bdquo;', '&hellip;', '&trade;', '&#9658;', '&bull;', '&rarr;', '&rArr;', '&hArr;', '&diams;', '&asymp;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&Alpha;','&Beta;','&Gamma;','&Delta;','&Epsilon;','&Zeta;','&Eta;','&Theta;','&Iota;','&Kappa;','&Lambda;','&Mu;','&Nu;','&Xi;','&Omicron;','&Pi;','&Rho;','&Sigma;','&Tau;','&Upsilon;','&Phi;','&Chi;','&Psi;','&Omega;'];

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
