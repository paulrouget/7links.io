navigator.id.watch({
  loggedInEmail: null,
  onlogin: function(assertion) {
    sendRequest("http://service.7links.io:8000/authenticate", function(error, req) {
      if (error) {
        console.log("ERROR: service.7links.io says \'" + error + "\'");
      } else {
        console.log("SUCCESS: service.7links.io says \'" + req.responseText + "\'");
      }
    }, assertion);
  },
  onlogout: function() {
    // Clear cookies
  }
});
