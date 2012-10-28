var UI = {

  // PUBLIC -------------------------------------------------------------------

  init: function() {
    this._moveLink = this._moveLink.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._stopSorting = this._stopSorting.bind(this);
    this._makeLinksSortable();
    this.populateLis(local.getLinks());
    local.markDirty();
    remote.checkSession();
  },

  populateLis: function(links) {
    var i = links.length;
    while(i--) {
      this._buildOneLink(links[i], i);
    }
  },

  deleteLink: function(position) {
    var link = local.emptyLink(position);
    this._buildOneLink(link, position);
  },

  newLink: function(position) {
    var urlStr = prompt("address:");
    if (!urlStr) return;

    if (urlStr.indexOf("http") != 0) {
      urlStr = "http://" + urlStr;
    }

    var title = prompt("title:");
    if (!title) return alert("Need a title");

    var link = local.setLink({title: title, href: urlStr}, position);
    this._buildOneLink(link, position);
  },

  toggleEditing: function() {
    if (this._editMode) {
      this.stopEditMode();
    } else {
      this.startEditMode();
    }
  },

  startEditMode: function() {
    this._editMode = true;
    document.body.classList.add("editmode");
  },

  stopEditMode: function() {
    this._editMode = false;
    document.body.classList.remove("editmode");
  },

  toggleLogin: function() {
    if (remote.status == "connecting") {
      return;
    }
    if (remote.isLoggedIn()) {
      navigator.id.logout();
    } else {
      navigator.id.request();
    }
    remote.onPersonaRequest();
  },

  // INTERNAL ------------------------------------------------------------------

  updateLoginButton: function() {
    return; // FIXME
    var b = $("#personnaButton");
    b.dataset.status = remote.status;
    switch(remote.status) {
      case "disconnected":
        b.textContent = "login";
        break;
      case "connected":
        b.textContent = remote.email + " (logout)";
        break;
      case "connecting":
        b.textContent = "connecting…";
        break;
    }
  },

  _buildOneLink: function(link, position) {
    function getIconURLs(url) {
      if (!url) {
        return {big: "", small: ""}
      } else {
        var url = parseURL(url);
        var root = [url.protocol, "//" + url.host, url.port].join(":");
        var icons;
        if (url.host in BUILTIN_ICONS) {
          icons = {big: BUILTIN_ICONS[url.host]};
        } else {
          icons = {big: root + "/apple-touch-icon.png",
                   small: root + "/favicon.ico"};
        }
        return icons;
      }
    }

    var li = $$("#links > li")[position];
    var simpleURL = "";
    var html = "";
    if (link.href) {
      html = '<a target="_blank" href="' + link.href + '">';
      var parsedURL = parseURL(link.href);
      simpleURL = (parsedURL.host + parsedURL.path).replace(/\/$/, "");
    } else {
      html = '<a onclick="UI.newLink(this.parentNode.dataset.position)" class="empty">';
    }
    html += '<div class="icons"><div class="smallicon"></div><div class="bigicon"></div></div><div class="text"><span class="title">' + link.title + '</span><span class="href">' + simpleURL + '</span></div></a>';
    html += '<div class="deletebutton" onclick="UI.deleteLink(this.parentNode.dataset.position)"></div>';
    li.innerHTML = html;
    this._makeOneLinkOrderAble(li);
    li.dataset.position = position;

    var icons = getIconURLs(link.href);
    li.querySelector(".bigicon").setAttribute("style", "background-image:url(" + icons.big + ")");
    li.querySelector(".smallicon").setAttribute("style", "background-image:url(" + icons.small + ")");
  },


  _makeLinksSortable: function() {
    if (touchSupported()) {
      window.addEventListener("touchend", this._stopSorting, true);
      window.addEventListener("touchcancel", this._stopSorting, true);
    } else {
      window.addEventListener("mouseup", this._stopSorting, true);
    }
  },

  _makeOneLinkOrderAble: function(l) {
    var a = l.querySelector("a");
    if (touchSupported()) {
      a.addEventListener("touchstart", this._onTouchStart, true);
    } else {
      a.addEventListener("mousedown", this._onTouchStart, true);
    }
  },

  _onTouchStart: function(e) {
    if (!this._editMode) return;
    e.preventDefault();

    this._linkHeight = $("#links > li").getBoundingClientRect().height;

    if (touchSupported()) {
      window.addEventListener("touchmove", this._moveLink, true);
    } else {
      window.addEventListener("mousemove", this._moveLink, true);
    }

    if (e.touches) {
      this._orgY = e.touches[0].clientY;
    } else {
      this._orgY = e.clientY;
    }
    this._movingLink = e.target.parentNode;
    this._movingLink.classList.add("floating");

    this._moveLink(e);
  },

  _stopSorting: function() {
    if (this._movingLink) {
      this._movingLink.classList.remove("floating");
      this._setTransform(this._movingLink, "");

      if (this._lastShift != 0) {
        if (this._lastShift > 0) this._lastShift++;
        var ul = this._movingLink.parentNode;
        ul.insertBefore(this._movingLink, $$("#links > li")[+this._movingLink.dataset.position + this._lastShift]);
        local.moveLink(this._movingLink.dataset.position, +this._movingLink.dataset.position + this._lastShift);

        var lis = $$("#links > li");
        for (var i = 0; i < lis.length; i++) {
          lis[i].dataset.position = i;
        }
      }

      this._movingLink = null;

      window.removeEventListener("mousemove", this._moveLink, true);
      window.removeEventListener("touchmove", this._moveLink, true);

      $$("#links > li").forEach(function(li) {
        li.classList.remove("goup");
        li.classList.remove("godown");
      });
    }
  },

  _moveLink: function(e) {
    var newY;
    var orgPos = ~~this._movingLink.dataset.position;

    if (e.touches) {
      newY = e.touches[0].clientY;
    } else {
      newY = e.clientY;
    }
    var delta = ~~(newY - this._orgY);

    if (this._lastDelta && (delta == this._lastDelta))
      return

    this._lastDelta = delta;
    this._setTransform(this._movingLink, "translateY(" + delta + "px)");

    var toShift = Math.round(delta / this._linkHeight);

    toShift = Math.min(6 - orgPos, toShift);
    toShift = Math.max(-orgPos, toShift);

    if (toShift == this._lastShift)
      return;

    this._lastShift = toShift;

    var lis = $$("#links > li");
    for (var i = 0; i < 7; i++) {
      if (i != orgPos)
        lis[i].className = "";
    }
    if (toShift > 0) {
      for (var i = 1; i <= toShift; i++) {
        lis[orgPos + i].classList.add("goup");
      }
    }
    if (toShift < 0) {
      for (var i = -1; i >= toShift; i--) {
        lis[orgPos + i].classList.add("godown");
      }
    }
  },

  _setTransform: function(elt, value) {
    elt.style.transform = elt.style.webkitTransform = elt.style.oTransform = elt.style.mozTransform = value;
  },
};


window.onload = function() {UI.init()}
