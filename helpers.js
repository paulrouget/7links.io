
// sendRequest ----------------------------------------------------------------
// http://www.quirksmode.org/js/xmlhttp.html

(function(owner) {
  function sendRequest(url,callback,postData) {
    var req = createXMLHTTPObject();
    if (!req) return;
    var method = (postData) ? "POST" : "GET";
    req.open(method,url,true);
    req.setRequestHeader('User-Agent','XMLHTTP/1.0');
    if (postData)
      req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
    req.onreadystatechange = function () {
      if (req.readyState != 4) return;
      if (req.status != 200 && req.status != 304) {
        callback("HTTP Error: " + req.status, req);
        return;
      }
      callback(null, req);
    }
    if (req.readyState == 4) return;
    req.send(postData);
  }

  var XMLHttpFactories = [
    function () {return new XMLHttpRequest()},
    function () {return new ActiveXObject("Msxml2.XMLHTTP")},
    function () {return new ActiveXObject("Msxml3.XMLHTTP")},
    function () {return new ActiveXObject("Microsoft.XMLHTTP")}
  ];

  function createXMLHTTPObject() {
    var xmlhttp = false;
    for (var i=0;i<XMLHttpFactories.length;i++) {
      try {
        xmlhttp = XMLHttpFactories[i]();
      }
      catch (e) {
        continue;
      }
      break;
    }
    return xmlhttp;
  }

  owner.sendRequest = sendRequest;
})(window);

// $ and $$ -------------------------------------------------------------------

(function(owner) {
  function $(query) { return document.querySelector(query)}
  function $$(query) { return document.querySelectorAll(query)}
  NodeList.prototype.forEach = function(fun) {
    if (typeof fun !== "function") throw new TypeError();
    for (var i = 0; i < this.length; i++) {
      fun.call(this, this[i]);
    }
  }

  owner.$ = $;
  owner.$$ = $$;
})(window);

// parseURL -------------------------------------------------------------------
// From http://james.padolsey.com/javascript/parsing-urls-with-the-dom/

(function(owner) {
  function parseURL(url) {
      var a =  document.createElement('a');
      a.href = url;
      return {
          source: url,
          protocol: a.protocol.replace(':',''),
          host: a.hostname,
          port: a.port,
          query: a.search,
          params: (function(){
              var ret = {},
                  seg = a.search.replace(/^\?/,'').split('&'),
                  len = seg.length, i = 0, s;
              for (;i<len;i++) {
                  if (!seg[i]) { continue; }
                  s = seg[i].split('=');
                  ret[s[0]] = s[1];
              }
              return ret;
          })(),
          file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
          hash: a.hash.replace('#',''),
          path: a.pathname.replace(/^([^\/])/,'/$1'),
          relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
          segments: a.pathname.replace(/^\//,'').split('/')
      };
  }
  owner.parseURL = parseURL;
})(window);

// touchSupported -------------------------------------------------------------

(function(owner) {
  function touchSupported() {
    return !(window.ontouchstart === undefined);
  }

  owner.touchSupported = touchSupported;
})(window);
