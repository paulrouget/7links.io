var lis;

/* ------- Init ------- */
function processLinks(links) {
  var i = links.length;
  while(i--) {
    buildLink(links[i], i);
  }
}

function buildLink(link, position) {
  var li = $$("#links > li")[position];
  var html = "";
  if (link.href) {
    html = '<a target="_blank" href="' + link.href + '">';
  } else {
    html = '<a onclick="newLink(this.parentNode.dataset.position)" class="empty">';
  }
  html += '<div class="favicon"><img width="64" height="64"></img></div>' + link.title + '</a>';
  html += '<div class="deletebutton" onclick="deleteLink(this.parentNode.dataset.position)">';
  html += '</div><div class="reorderbutton"></div>';
  li.innerHTML = html;
  makeOneLinkOrderAble(li);
  var iconurl = link.icon;
  li.dataset.position = position;
  var img = li.querySelector(".favicon > img");
  img.src = iconurl;
}

window.onload = function() {
  lis = $$("#links > li");
  processLinks(data.getLinks());
  makeLinksOrderable();
}

function deleteLink(position) {
  var link = data.emptyLink(position);
  buildLink(link, position);
}

function newLink(position) {
  var url = prompt("address:");
  if (!url) return;

  url = parseURL(url);

  var title = prompt("title:");
  if (!title) return;

  var icon = [url.protocol, "//" + url.host, url.port].join(":");
  icon += "/favicon.ico"; // lame

  var link = data.setLink({icon: icon, title: title, href: url.source}, position);
  buildLink(link, position);
}

/* ------- Edit Mode ------- */

var editMode = false;

function startEditMode() {
  editMode = true;
  document.body.classList.add("editmode");
}

function doneEditMode() {
  editMode = false;
  document.body.classList.remove("editmode");
}

/* ------- Drag'n Drop ------- */

var longPressTimeout;
var movingLink;
var originalY;
var linkHeight;
var linkPosition;

function makeLinksOrderable() {
  if (touchSupported()) {
    window.addEventListener("touchend", stopEditingOrder, true);
    window.addEventListener("touchcancel", stopEditingOrder, true);
  } else {
    window.addEventListener("mouseup", stopEditingOrder, true);
  }

  linkHeight = $("#links > li").getBoundingClientRect().height;
}

function makeOneLinkOrderAble(l) {
  var b = l.querySelector(".reorderbutton");

  function touchStart(e) {
    if (!editMode) return;
    e.preventDefault();

    if (touchSupported()) {
      window.addEventListener("touchmove", moveLink, true);
    } else {
      window.addEventListener("mousemove", moveLink, true);
    }

    if (e.touches) {
      originalY = e.touches[0].clientY;
    } else {
      originalY = e.clientY;
    }
    movingLink = l;
    movingLink.classList.add("floating");
  }
  if (touchSupported()) {
    b.addEventListener("touchstart", touchStart, true);
  } else {
    b.addEventListener("mousedown", touchStart, true);
  }
}

function stopEditingOrder() {
  if (movingLink) {
    movingLink.classList.remove("floating");
    movingLink.style.transform = movingLink.style.webkitTransform = movingLink.style.oTransform = movingLink.style.mozTransform = "";

    if (lastShift != 0) {
      if (lastShift > 0) lastShift++;
      var ul = movingLink.parentNode;
      ul.insertBefore(movingLink, lis[+movingLink.dataset.position + lastShift]);
      lis = $$("#links > li");

      data.moveLink(movingLink.dataset.position, +movingLink.dataset.position + lastShift);

      for (var i = 0; i < lis.length; i++) {
        lis[i].dataset.position = i;
      }
    }

    movingLink = null;

    window.removeEventListener("mousemove", moveLink, true);
    window.removeEventListener("touchmove", moveLink, true);
  }

  for (var i = 0; i < 7; i++) {
    lis[i].classList.remove("goup");
    lis[i].classList.remove("godown");
  }
}

var lastShift;
var lastDelta;
function moveLink(e) {
  var newY;
  var orgPos = ~~movingLink.dataset.position;

  if (e.touches) {
    newY = e.touches[0].clientY;
  } else {
    newY = e.clientY;
  }
  var delta = ~~(newY - originalY);

  if (delta == lastDelta)
    return

  lastDelta = delta;
  movingLink.style.transform = movingLink.style.webkitTransform = movingLink.style.oTransform = movingLink.style.mozTransform = "translateY(" + delta + "px)";

  var toShift = Math.round(delta / linkHeight);

  toShift = Math.min(6 - orgPos, toShift);
  toShift = Math.max(-orgPos, toShift);

  if (toShift == lastShift)
    return;

  lastShift = toShift;

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
}

/* ------- links ------- */

var data = {};

data.getLinks = function() {
  if (!this._links) {
    try {
      this._links = JSON.parse(localStorage.getItem("links"));
    } catch(e) {}
    if (!this._links) {
      this._links = [
        {icon: "http://facebook.com/favicon.ico", title: "Facebook", href: "http://facebook.com"},
        {icon: "http://paulrouget.com/favicon.ico", title: "Paul Rouget's blog", href: "http://paulrouget.com"},
        {icon: "http://news.ycombinator.com/favicon.ico", title: "Hackernews", href: "http://news.ycombinator.com"},
        {icon: "http://duckduckgo.com/favicon.ico", title: "DuckDuckGo", href: "http://duckduckgo.com"},
        {icon: "http://twitter.com/favicon.ico", title: "Twitter", href: "http://mobile.twitter.com"},
        {icon: "http://reddit.com/favicon.ico", title: "Reddit", href: "http://reddit.com/.compact"},
        {icon: "http://www.google.com/reader/ui/favicon.ico",  title: "Google Reader", href: "http://www.google.com/reader/"}
      ];
    }
  }
  return this._links;
}

data.save = function() {
  localStorage.setItem("links", JSON.stringify(this._links));
}

data.emptyLink = function(idx) {
  return this.setLink({icon: "imgs/add.svg", title: ""}, idx);
}

data.setLink = function(link, idx) {
  this._links[idx] = link;
  this.save();
  return link;
}

data.moveLink = function(from, to) {
  if (from == to) return;
  var link = this._links.splice(from, 1)[0];
  if (from < to) to--;
  this._links.splice(to, 0, link);
  this.save();
}
