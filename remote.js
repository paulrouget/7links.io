var remote = {
  set status(value) {
    if (this._value != value) {
      this._status = value;
      UI.updateLoginButton();
    }
  },

  get status() {
    if (!this._status) {
      this._status = "disconnected";
    }
    return this._status;
  },

  onPersonaRequest: function() {
    this.status = "connecting";
  },

  isLoggedIn: function() {
    return this.status == "connected";
  },

  onLogin: function(assertion, email, links) {
    localStorage.assertion = this.assertion = assertion;
    localStorage.email = this.email = email;
    this.status = "connected";
    if (links) {
      UI.populateLis(links);
    }
  },

  onLoginError: function(error) {
    this.status = "disconnected";
    alert(error);
  },

  checkSession: function() {
    var hasSession = localStorage.email && localStorage.assertion;
    if (hasSession) {
      this.email = localStorage.email;
      this.assertion = localStorage.assertion;
    }
    this.status = hasSession ? "connected" : "disconnected";
  },

  clearSession: function() {
    delete localStorage.email;
    delete localStorage.assertion;
    this.email = this.assertion = null;
    this.status = "disconnected";
  },

  sync: function(force) {
    if (this.isLoggedIn() && (force || local.needsToBeUploaded)) {
      this.save(local.getLinks(), function(error) {
        if (error) {
          log.user("Error while syncing", error);
        } else {
          local.needsToBeUploaded = false;
          log.dev("Successful upload");
        }
      });
    }
  },

  save: function(links, callback) {
    if (!this.isLoggedIn()) return callback("Not logged in")
    sendRequest("https://service.7links.io:8000/save", function(error, req) {
      if (error) {
        if (req.status == 401) {
          remote.clearSession();
          return callback("Disconnected", "Unknown session");
        }
        return callback(error + " (" + req.responseText + ")");
      } else {
        callback();
      }
    }, JSON.stringify({assertion: this.assertion, links: links}));
  },

  getLinks: function(callback) {
    if (!this.isLoggedIn()) return callback("Not logged in")
    sendRequest("https://service.7links.io:8000/get", function(error, req) {
      if (error) {
        if (req.status == 401) {
          remote.clearSession();
          return callback("Disconnected", "Unknown session");
        }
        return callback(error + " (" + req.responseText + ")");
      } else {
        var response;
        try {
          response = JSON.parse(req.responseText);
        } catch(e) {
          return callback("Error: retrieved data are malformated");
        }
        callback(null, response.links);
      }
    }, JSON.stringify({assertion: gAssertion}));
  }
}

navigator.id.watch({ // Persona requirement
  onlogin: function(assertion) {
    sendRequest("https://service.7links.io:8000/connect", function(error, req) {
      if (error) {
        return remote.onLoginError("Error: " + error);
      } else {
        var response;
        try {
          response = JSON.parse(req.responseText);
        } catch(e) {
          return remote.onLoginError("Error: retrieved data are malformated");
        }
        remote.onLogin(assertion, response.email, response.links);
      }
    }, JSON.stringify({assertion: assertion}));
  },
  onlogout: function() {
    // Clear cookies
    // Tell remote that it can clear the session
    // FIXME
  }
});
