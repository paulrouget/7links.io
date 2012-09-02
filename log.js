var log = {
  dev: function(title, content) {
    if (content) {
      console.log(title + ": " + content);
    } else {
      console.log(title);
    }
  },
  user: function(title, content) {
    this.dev(title, content);
    this.clear();
    if (content) {
      $("#logs").innerHTML = "<h1>" + title + "</h1><p>" + content + "</p>";
    } else {
      $("#logs").innerHTML = "<h1>" + title + "</h1>";
    }
    console.log(title + ": " + content);

    clearTimeout(this._timeout);
    this._timeout = setTimeout(this.clear, 5000);
  },

  clear: function() {
    $("#logs").innerHTML = "";
  },

  _timeout: null,
}
