/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/fast-shallow-equal@1.0.0";
exports.ids = ["vendor-chunks/fast-shallow-equal@1.0.0"];
exports.modules = {

/***/ "(pages-dir-node)/./node_modules/.pnpm/fast-shallow-equal@1.0.0/node_modules/fast-shallow-equal/index.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/.pnpm/fast-shallow-equal@1.0.0/node_modules/fast-shallow-equal/index.js ***!
  \**********************************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("var keyList = Object.keys;\n\nexports.equal = function equal (a, b) {\n  if (a === b) return true;\n  if (!(a instanceof Object) || !(b instanceof Object)) return false;\n\n  var keys = keyList(a);\n  var length = keys.length;\n\n  for (var i = 0; i < length; i++)\n    if (!(keys[i] in b)) return false;\n\n  for (var i = 0; i < length; i++)\n    if (a[keys[i]] !== b[keys[i]]) return false;\n\n  return length === keyList(b).length;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL25vZGVfbW9kdWxlcy8ucG5wbS9mYXN0LXNoYWxsb3ctZXF1YWxAMS4wLjAvbm9kZV9tb2R1bGVzL2Zhc3Qtc2hhbGxvdy1lcXVhbC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBQTs7QUFFQSxhQUFhO0FBQ2I7QUFDQTs7QUFFQTtBQUNBOztBQUVBLGtCQUFrQixZQUFZO0FBQzlCOztBQUVBLGtCQUFrQixZQUFZO0FBQzlCOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIi9Vc2Vycy9kb25ldnNraS9Qcm8vcHJvamVjdHMvem5haW5pay9ub2RlX21vZHVsZXMvLnBucG0vZmFzdC1zaGFsbG93LWVxdWFsQDEuMC4wL25vZGVfbW9kdWxlcy9mYXN0LXNoYWxsb3ctZXF1YWwvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsidmFyIGtleUxpc3QgPSBPYmplY3Qua2V5cztcblxuZXhwb3J0cy5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsIChhLCBiKSB7XG4gIGlmIChhID09PSBiKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKCEoYSBpbnN0YW5jZW9mIE9iamVjdCkgfHwgIShiIGluc3RhbmNlb2YgT2JqZWN0KSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBrZXlzID0ga2V5TGlzdChhKTtcbiAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspXG4gICAgaWYgKCEoa2V5c1tpXSBpbiBiKSkgcmV0dXJuIGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspXG4gICAgaWYgKGFba2V5c1tpXV0gIT09IGJba2V5c1tpXV0pIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gbGVuZ3RoID09PSBrZXlMaXN0KGIpLmxlbmd0aDtcbn07XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(pages-dir-node)/./node_modules/.pnpm/fast-shallow-equal@1.0.0/node_modules/fast-shallow-equal/index.js\n");

/***/ })

};
;