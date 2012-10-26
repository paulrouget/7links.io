const LOCAL_SYNC_INTERVAL = 10000;
const REMOTE_SYNC_INTERVAL = 60000;

const DEFAULT_lINKS = [
  {icons: ["http://facebook.com/apple-touch-icon.png.ico", "http://facebook.com/favicon.ico",], title: "Facebook", href: "http://facebook.com"},
  {icons: ["http://paulrouget.com/favicon.ico", "http://paulrouget.com/apple-touch-icon.png.ico"], title: "Paul Rouget's blog", href: "http://paulrouget.com"},
  {icons: ["http://news.ycombinator.com/favicon.ico", "http://news.ycombinator.com/apple-touch-icon.png.ico"], title: "Hackernews", href: "http://news.ycombinator.com"},
  {icons: ["http://duckduckgo.com/favicon.ico", "http://duckduckgo.com/apple-touch-icon.png.ico"], title: "DuckDuckGo", href: "http://duckduckgo.com"},
  {icons: ["http://twitter.com/favicon.ico", "http://twitter.com/apple-touch-icon.png.ico"], title: "Twitter", href: "http://mobile.twitter.com"},
  {icons: ["http://reddit.com/favicon.ico", "http://reddit.com/apple-touch-icon.png.ico"], title: "Reddit", href: "http://reddit.com/.compact"},
  {icons: ["http://www.google.com/reader/ui/favicon.ico",  "http://www.google.com/reader/ui/apple-touch-icon.png.ico",], title: "Google Reader", href: "http://www.google.com/reader/"}
];

var local = {};

local.markDirty = function() {
  this._localdirty = true;
  this.needsToBeUploaded = true;
}

local.getLinks = function() {
  if (!this._links) {
    try {
      this._links = JSON.parse(localStorage.links);
    } catch(e){}
    if (!this._links) {
      this._links = DEFAULT_lINKS;
    }
  }
  return this._links;
}

local.saveLocaly = function() {
  if (this._localdirty) {
    localStorage.links = JSON.stringify(this._links);
    this._localdirty = false;
  }
}

local.emptyLink = function(idx) {
  return this.setLink({icon: "imgs/add.svg", title: ""}, idx);
}

local.setLink = function(link, idx) {
  this._links[idx] = link;
  this.markDirty();
  return link;
}

local.moveLink = function(from, to) {
  if (from == to) return;
  var link = this._links.splice(from, 1)[0];
  if (from < to) to--;
  this._links.splice(to, 0, link);
  this.markDirty();
}

window.setInterval(function() {
  local.saveLocaly();
}, LOCAL_SYNC_INTERVAL);

window.setInterval(function() {
  remote.sync();
}, REMOTE_SYNC_INTERVAL);
