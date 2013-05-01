/*	This work is licensed under Creative Commons GNU LGPL License.

	License: http://creativecommons.org/licenses/LGPL/2.1/
   Version: 0.9
	Author:  Stefan Goessner/2006
	Web:     http://goessner.net/ 
*/

goog.provide('jsonxml.json2xml');

//function json2xml(o, tab) {
jsonxml.json2xml = function (o, tab) {
   var toXml = function(v, name, ind) {
      var xml = "";
      if (v instanceof Array) {
         for (var i=0, n=v.length; i<n; i++)
            //xml += ind + toXml(v[i], name, ind+"\t") + "\n";
            xml += toXml(v[i], name, ind);
      }
      else if (typeof(v) == "object") {
         var hasChild = false;
         xml += ind + "<" + name;
         for (var m in v) {
            if (m.charAt(0) == "@")
               xml += " " + m.substr(1) + "=\"" + String(v[m]) + "\"";
            else
               hasChild = true;
         }
         //xml += hasChild ? ">" : "/>";
         xml += (hasChild ? ">" : "/>") + "\n";
         if (hasChild) {
            for (var m in v) {
               if (m == "#text")
                  xml += v[m];
               else if (m == "#cdata")
                  xml += "<![CDATA[" + v[m] + "]]>";
               else if (m.charAt(0) != "@")
                  xml += toXml(v[m], m, ind+"\t");
            }
            //xml += (xml.charAt(xml.length-1)=="\n"?ind:"") + "</" + name + ">";
            xml += ind + "</" + name + ">" + "\n";
         }
      }
      else {
         xml += ind + "<" + name + ">" + String(v) +  "</" + name + ">";
      }
      return xml;
   }, xml="";
   for (var m in o)
      xml += toXml(o[m], m, "");
   return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
}
