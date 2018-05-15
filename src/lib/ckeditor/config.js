/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	config.disableNativeSpellChecker = false;
	config.fullPage = false;
	config.dialog_noConfirmCancel = true;
	//config.enableContextMenu = false;
	//config.tabSpaces = 4;
	//config.height = 350;
	// config.extraPlugins = 'autosave,iframe,mediaembed,embed,
	config.extraPlugins = 'liststyle,autosave,autogrow,mmscf,mmscomment,mmsvlink,mmsreset,mmssignature,mmsdropdown';
    config.autoGrow_minHeight = 200;
    config.autoGrow_maxHeight = 600;
    config.autoGrow_bottomSpace = 50;
    config.autoGrow_onStartup = true;
	config.mathJaxLib = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML';
	//config.extraAllowedContent = 'div(*)[*]{*}; p[class]{*}; a[class,href,alt]{*}; i[class,aria-hidden]{*}; span[class]{*}; audio[*]; video[*]; source[*]; mms-group-docs[*]; mms-cf[*]; mms-view-link[*]; mms-value-link[*]; mms-line-graph[*]; mms-diff-attr[*]; mms-maturity-bar[*]; math[*]; maction[*]; maligngroup[*]; malignmark[*]; menclose[*]; merror[*]; mfenced[*]; mfrac[*]; mglyph[*]; mi[*]; mlabeledtr[*]; mlongdiv[*]; mmultiscripts[*]; mn[*]; mo[*]; mover[*]; mpadded[*]; mphantom[*]; mroot[*]; mrow[*]; ms[*]; mscarries[*]; mscarry[*]; msgroup[*]; mstack[*]; msline[*]; mspace[*]; msqrt[*]; msrow[*]; mstyle[*]; msub[*]; msup[*]; msubsup[*]; mtable[*]; mtd[*]; mtext[*]; mtr[*]; munder[*]; munderover[*];';
	config.allowedContent = true;
	config.disallowedContent = 'script';
	config.specialChars = ['&euro;', '&lsquo;', '&rsquo;', '&ldquo;', '&rdquo;', '&ndash;', '&mdash;', '&iexcl;', '&cent;', '&pound;', '&curren;', '&yen;', '&brvbar;', '&sect;', '&uml;', '&copy;', '&ordf;', '&laquo;', '&not;', '&reg;', '&macr;', '&deg;', '&sup2;', '&sup3;', '&acute;', '&micro;', '&para;', '&middot;', '&cedil;', '&sup1;', '&ordm;', '&raquo;', '&frac14;', '&frac12;', '&frac34;', '&iquest;', '&Agrave;', '&Aacute;', '&Acirc;', '&Atilde;', '&Auml;', '&Aring;', '&AElig;', '&Ccedil;', '&Egrave;', '&Eacute;', '&Ecirc;', '&Euml;', '&Igrave;', '&Iacute;', '&Icirc;', '&Iuml;', '&ETH;', '&Ntilde;', '&Ograve;', '&Oacute;', '&Ocirc;', '&Otilde;', '&Ouml;', '&times;', '&Oslash;', '&Ugrave;', '&Uacute;', '&Ucirc;', '&Uuml;', '&Yacute;', '&THORN;', '&szlig;', '&agrave;', '&aacute;', '&acirc;', '&atilde;', '&auml;', '&aring;', '&aelig;', '&ccedil;', '&egrave;', '&eacute;', '&ecirc;', '&euml;', '&igrave;', '&iacute;', '&icirc;', '&iuml;', '&eth;', '&ntilde;', '&ograve;', '&oacute;', '&ocirc;', '&otilde;', '&ouml;', '&divide;', '&oslash;', '&ugrave;', '&uacute;', '&ucirc;', '&uuml;', '&yacute;', '&thorn;', '&yuml;', '&OElig;', '&oelig;', '&#372;', '&#374', '&#373', '&#375;', '&sbquo;', '&#8219;', '&bdquo;', '&hellip;', '&trade;', '&#9658;', '&bull;', '&rarr;', '&rArr;', '&hArr;', '&diams;', '&asymp;','&alpha;','&beta;','&gamma;','&delta;','&epsilon;','&zeta;','&eta;','&theta;','&iota;','&kappa;','&lambda;','&mu;','&nu;','&xi;','&omicron;','&pi;','&rho;','&sigma;','&tau;','&upsilon;','&phi;','&chi;','&psi;','&omega;','&Alpha;','&Beta;','&Gamma;','&Delta;','&Epsilon;','&Zeta;','&Eta;','&Theta;','&Iota;','&Kappa;','&Lambda;','&Mu;','&Nu;','&Xi;','&Omicron;','&Pi;','&Rho;','&Sigma;','&Tau;','&Upsilon;','&Phi;','&Chi;','&Psi;','&Omega;'];
	//config.protectedSource.push( /<i[^>]*><\/i>/g );
	config.filebrowserUploadUrl = "/alfresco.php";
	//config.filebrowserBrowseUrl = "/alfresco.php";
	config.uploadUrl = "/alfresco.php";
	// Remove some buttons provided by the standard plugins, which are
	// not needed in the Standard(s) toolbar.
	config.removeButtons = 'Subscript,Superscript,Blockquote';

	// Set the most common block elements.
	config.format_tags = 'p;h1;h2;h3;pre';

	// Simplify the dialog windows.
	config.removeDialogTabs = 'image:advanced;link:advanced';
};
