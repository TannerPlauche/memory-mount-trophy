const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
const htmlToPdfmake = require('html-to-pdfmake');
// if you need to run it in a terminal console using "node", then you need the below two lines:
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
