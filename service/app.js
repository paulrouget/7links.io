// FIXME: unknown certificate

const port = 8000;
const valueSize = 2048;
const origin = "http://7links.io";
const privateKeyFile = "/home/paul/7links.cert/privatekey.pem";
const certificateFile = "/home/paul/7links.cert/certificate.pem";

var fs = require("fs"), https = require("https"), querystring = require("querystring");
var privateKey = fs.readFileSync(privateKeyFile).toString();
var certificate = fs.readFileSync(certificateFile).toString();

var headers = {
  'Content-Type': 'text/plain',
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST',
}

https.createServer({key: privateKey, cert: certificate},
  function(req, res) {
    if (req.method != "POST") {
      res.writeHead(405, headers);
      res.end();
      return;
    }

    console.log("> " + req.url);

// connect  -------------------------------------------------------------------

    if (req.url == "/connect") {
      var body = "";
      var assertion;

      req.on('data', function(chunk) { body += chunk }).on('end', function() {
        var vreq = https.request({
          host: "verifier.login.persona.org",
          path: "/verify",
          method: "POST"
        }, function(vres) {
          var body = "";
          vres.on('data', function(chunk) { body += chunk; } ).on('end', function() {
            try {
              var verifierResp = JSON.parse(body);
              var valid = verifierResp && verifierResp.status == "okay";

              if (valid) {
                var email = verifierResp.email;
                db.registerAssertion(assertion, email);
                res.writeHead(200, headers);
                res.end(JSON.stringify({
                  email: email,
                  links: db.getLinks(assertion),
                }));
              } else {
                res.writeHead(401, headers);
                res.end();
              }
            } catch(e) {
              res.writeHead(500, headers);
              res.end("Problem with verifier");
            }
          });
        });
        vreq.setHeader('Content-Type', 'application/x-www-form-urlencoded');

        try {
          assertion = JSON.parse(body).assertion;
        } catch(e) {
          res.writeHead(400, headers);
          res.end("body is malformated");
          return;
        }

        var data = querystring.stringify({
          assertion: assertion,
          audience: origin
        });
        vreq.setHeader('Content-Length', data.length);
        vreq.write(data);
        vreq.end();
      });

      return;
    }

// save -----------------------------------------------------------------------

    if (req.url == "/save") {
      var body = "";
      req.on('data', function(chunk) { body += chunk }).on('end', function() {
        try {
          body = JSON.parse(body);
        } catch(e) {
          res.writeHead(400, headers);
          res.end("body is malformated");
          return;
        }
        if (!db.isAssertionRegistered(body.assertion)) {
          res.writeHead(401, headers);
          res.end("Unknow user. You might want to logout and login again.");
          return;
        }
        var error = db.saveLinks(body.assertion, body.links);
        if (error) {
          res.writeHead(400, headers);
          res.end(error);
        } else {
          res.writeHead(200, headers);
          res.end();
        }
      });
      return;
    }

// get ------------------------------------------------------------------------

    if (req.url == "/get") {
      var body = "";
      req.on('data', function(chunk) { body += chunk }).on('end', function() {
        if (db.isAssertionRegistered(assertion)) {
          console.log("Known session: " + db.getEmailForAssertion(assertion));
        } else {
          console.log("Unknown session");
        }

        try {
          body = JSON.parse(body);
        } catch(e) {
          res.writeHead(400, headers);
          res.end("body is malformated");
          return;
        }
        if (!db.isAssertionRegistered(assertion)) {
          res.writeHead(401, headers);
          res.end("Unknow user. You might want to logout and login again.");
          return;
        }
        var links = db.getLinks(body.assertion);
        if (links) {
          res.writeHead(401, headers);
          res.end();
        } else {
          res.writeHead(200, headers);
          res.end(JSON.stringify(links));
        }
      });
      return;
    }

    res.writeHead(405, headers);
    res.end('Not a valid method.');
    return;
  }).listen(port);

// "database" … hmm almost --------------------------------------------------

var db = {
  _dirty:       false, // do we need to save it?
  _assertions:  {},    // assertion -> email
  _links:       {},    // email -> links
};

db.registerAssertion = function(assertion, email) {
  this._assertions[assertion] = email;
  this._dirty = true;
}

db.releaseAssertion = function(assertion) {
  if (this.isAssertionRegistered(assertion)) {
    delete this._assertions[assertion];
    this._dirty = true;
  }
}

db.getLinks = function(assertion) {
  if (this.isAssertionRegistered(assertion)) {
    var email = this.getEmailForAssertion(assertion);
    return this._links[email];
  }
}

db.isAssertionRegistered = function(assertion) {
  return (assertion in this._assertions);
}

db.getEmailForAssertion = function(assertion) {
  return this._assertions[assertion];
}

db.saveLinks = function(assertion, links) { // Return an error. Null if no error.
  var error = this.areLinksInvalid(links);
  if (error) return error;
  var email = this.getEmailForAssertion(assertion);
  db._links[email] = links;
  this._dirty = true;
  return;
}

db.areLinksInvalid = function(links) { // Returns an error. Null if valid.
  if (!Array.isArray(links)) {
    return "not an array";
  }

  if (links.length != 7) {
    return "arrays should have 7 items";
  }

  for (var i = 0; i < 7; i++) {
    var link = links[i];
    for (var prop in link) {
      if (prop != "href" && prop != "title" && prop != "icon")
        return "unexpected property";
      if ((typeof link[prop]) != "string")
        return "property value is not a string";
    }
    if ((link.href && link.href.length > valueSize)   ||
        (link.title && link.title.length > valueSize) ||
        (link.icon && link.icon.length > valueSize)) {
      return "property value is too big";
    }
  }
  return null;
}
