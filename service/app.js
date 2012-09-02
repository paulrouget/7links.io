var port = 8000;
var httpAllow = "localhost 7links.io";
var personaAudience = "http://localhost";

var express = require("express"),
    fs = require("fs"),
    https = require("https"),
    querystring = require("querystring");

var privateKey = fs.readFileSync('/home/paul/7links.cert/privatekey.pem').toString();
var certificate = fs.readFileSync('/home/paul/7links.cert/certificate.pem').toString();
var app = express({key: privateKey, cert: certificate});

app.listen(port);

app.post("/authenticate", function(req, res) {
  console.log("/authenticate reached");
  var assertion = "";
  req.on('data', function(chunk) { assertion += chunk }).on('end', function() {
    var vreq = https.request({
      host: "verifier.login.persona.org",
      path: "/verify",
      method: "POST"
    }, function(vres) {
      var body = "";
      vres.on('data', function(chunk) { body+=chunk; } )
      .on('end', function() {
        res.header("Access-Control-Allow-Origin", httpAllow);
        try {
          var verifierResp = JSON.parse(body);
          var valid = verifierResp && verifierResp.status == "okay";
          var email = valid ? verifierResp.email : null;
          if (valid) {
            console.log("assertion verified successfully for email:", email);
          } else {
            console.log("failed to verify assertion:", verifierResp.reason);
          }
          res.json({email:email});
        } catch(e) {
          console.log("non-JSON response from verifier");
          // bogus response from verifier! return null
          res.json(null);
        }
      });
    });
    vreq.setHeader('Content-Type', 'application/x-www-form-urlencoded');

    var data = querystring.stringify({
      assertion: assertion,
      audience: personaAudience 
    });
    vreq.setHeader('Content-Length', data.length);
    vreq.write(data);
    vreq.end();
    console.log("verifying assertion!");
  });
});

