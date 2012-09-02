const LOCAL_SYNC_INTERVAL = 10000;
const REMOTE_SYNC_INTERVAL = 60000;

const DEFAULT_lINKS = [
  {icon: "http://facebook.com/favicon.ico", title: "Facebook", href: "http://facebook.com"},
  {icon: "http://paulrouget.com/favicon.ico", title: "Paul Rouget's blog", href: "http://paulrouget.com"},
  {icon: "http://news.ycombinator.com/favicon.ico", title: "Hackernews", href: "http://news.ycombinator.com"},
  {icon: "http://duckduckgo.com/favicon.ico", title: "DuckDuckGo", href: "http://duckduckgo.com"},
  {icon: "http://twitter.com/favicon.ico", title: "Twitter", href: "http://mobile.twitter.com"},
  {icon: "http://reddit.com/favicon.ico", title: "Reddit", href: "http://reddit.com/.compact"},
  {icon: "http://www.google.com/reader/ui/favicon.ico",  title: "Google Reader", href: "http://www.google.com/reader/"}
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
