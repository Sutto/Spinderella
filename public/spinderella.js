Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

// Spinderella.js - A Web Client for Spinderella, built on WebSocket, jsSocket, and Orbited
// Making it super easy for realtime pubsub clients in the browser.

var Spinderella = function(host, port, channels, identifier, onMessage) {
  this.host = host;
  this.port = port || 42340;
  this.channels = channels || [];
  this.identifier = identifier;
  this.buffer = "";
  this.onMessage = onMessage || function() {};
}

Spinderella.Util = {
  
  loadJS: function(url, func) {
    var script    = document.createElement("script");
    script.type   = "text/javascript";
    script.src    = url;
    script.onload = func;
    var head      = document.getElementsByTagName("head")[0];
    head.appendChild(script);
  }
  
};

Spinderella.prototype = {
  
  processConnection: function() {
    if(this.channels && this.channels.length > 0) this.subscribe(this.channels);
    if(this.identifier) this.identify(this.identifier);
  },
  
  processDisconnection: function() {},
  
  receiveData: function(data) {
    this.buffer += data;
    if(this.buffer.indexOf("\r\n") >= 0) {
      var split_buffer = this.buffer.split("\r\n");
      this.buffer = split_buffer.pop() || "";
      for(var idx = 0; idx < split_buffer.length; idx++) {
        this.receiveMessage(split_buffer[idx]);
      }
    }
  },
  
  receiveMessage: function(raw_message) {
    var parsed = JSON.parse(raw_message);
    if(parsed && parsed.action) {
      this.handleAction(parsed.action, (parsed.data || {}));
    }
  },
  
  handleAction: function(name, data) {
    switch(name) {
    case 'ping':
      this.performAction("pong");
      break;
    case 'receive_message':
      this.onMessage(data.message, data.type, data);
      break;
    }
  },
  
  performAction: function(name, data) {
    if(!data) data = {};
    var raw = {
      "action": name,
      "data":   data
    };
    this.socket.send(JSON.stringify(raw) + "\r\n");
  },
  
  subscribe: function(channels) {
    for(var idx = 0; idx < channels.length; idx++) {
      var c = channels[idx];
      if(this.channels.indexOf(c) < 0) this.channels.push(c);
    }
    this.performAction("subscribe", {
      "channels": channels
    });
  },
  
  unsubscribe: function(channels) {
    for(var idx = 0; idx < channels.length; idx++) {
      var c = channels[idx];
      var idx2 = this.channels.indexOf(c);
      if(idx2 >= 0) this.channels.remove(idx2);
    }
    this.performAction("unsubscribe", {
      "channels": channels
    });
  },
  
  identify: function(identifier) {
    this.performAction("identify", {
      "identifier": identifier
    })
  }
  
};

// A Noop based implementation / does nothing.

Spinderella.Silenced = function() {
  this.client = new Spinderella();
  this.client.socket = this;
};

Spinderella.Silenced.isUseable = function() {
  return true;
};

Spinderella.Silenced.implementationName = "Silenced";

Spinderella.Silenced.prototype = {
  onMessage:    function() {},
  connect:      function() {},
  onDisconnect: function() {},
  send:         function() {}
};

// Orbited Implementation

Spinderella.Orbited = function(host, port, channels, identifier, onMessage) {
  this.client = new Spinderella(host, port, channels, identifier, onMessage);
  this.client.socket = this;
}

Spinderella.Orbited.isUseable = function() {
  return Spinderella.Orbited.javascriptURL !== null;
};

Spinderella.Orbited.javascriptURL      = null;
Spinderella.Orbited.orbitedHost        = null;
Spinderella.Orbited.orbitedPort        = null;
Spinderella.Orbited.implementationName = "Orbited";

Spinderella.Orbited.prototype = {
  
  reconnectOn: function() {
    return [Orbited.Errors.RemoteConnectionFailed, Orbited.Errors.UserConnectionReset, Orbited.Statuses.ServerClosedConnection];
  },
  
  onMessage: function(f) { this.client.onMessage = f; },
  
  connect: function(f) {
    var self = this;
    var client = this.client;
    var callback = function() {
      if(Spinderella.Orbited.orbitedHost) Orbited.settings.hostname = Spinderella.Orbited.orbitedHost;
      if(Spinderella.Orbited.orbitedPort) Orbited.settings.port = Spinderella.Orbited.orbitedPort;
      self.socket = new Orbited.TCPSocket();
      if(typeof(f) != "function") f = function() {};
      self.socket.onread  = function(d) { client.receiveData(d);  };
      self.socket.onopen  = function()  { client.processConnection(); f(); };
      self.socket.onclose = function(c) { self.onDisconnect(c); };
      self.socket.open(client.host, client.port);
    }
    if(typeof(Orbited) != "undefined") {
      callback();
    } else {
      Spinderella.Util.loadJS(Spinderella.Orbited.javascriptURL, callback)
    };
  },
  
  onDisconnect: function(c) {
    this.client.processDisconnection();
    if(this.reconnectOn().indexOf(c) >= 0) {
      var self = this;
      setTimeout(function() { self.connect(); }, 5000);
    }
  },
  
  send: function(data) {
    this.socket.send(data);
  }
  
};

// jsSocket Implementation

Spinderella.jsSocket = function(host, port, channels, identifier, onMessage) {
  this.client = new Spinderella(host, port, channels, identifier, onMessage);
  this.client.socket = this;
};

Spinderella.jsSocket.flashURL           = null;
Spinderella.jsSocket.javascriptURL      = null;
Spinderella.jsSocket.implementationName = "jsSocket";

Spinderella.jsSocket.isUseable = function() {
  if(Spinderella.jsSocket.flashURL == null || Spinderella.jsSocket.javascriptURL == null) return false;
  // VERY rudimentary check for Flash.
  var n = navigator;
  if(n.mimeTypes) {
    return n.mimeTypes["application/x-shockwave-flash"] !== undefined;
  } else if(n.plugins) {
    return n.plugins["Shockwave Flash"] !== undefined;
  } else {
    return false;
  }
};

Spinderella.jsSocket.prototype = {
  
  connect: function(f) {
    var self = this;
    var client = this.client;
    var callback = function() {
      jsSocket.swf = Spinderella.jsSocket.flashURL;
      self.socket = new jsSocket({keepalive: false, autoreconnect: true});
      if(typeof(f) != "function") f = function() {};
      self.socket.onData   = function(d) { client.receiveData(d);  };
      self.socket.onOpen   = function()  { client.processConnection(); f(); };
      self.socket.onClose  = function()  { client.processDisconnection(); };
      self.socket.onLoaded = function()  { self.socket.connect(client.host, client.port); };
    };
    // Load the JS if not already loaded, otherwise call it immediatly.
    if(typeof(jsSocket) != "undefined") {
      Spinderella.Util.loadJS(Spinderella.jsSocket.javascriptURL, callback);
    } else {
      callback();
    }
  },
  
  send: function(data) {
    this.socket.send(data);
  },
  
  onMessage: function(f) { this.client.onMessage = f; }
  
};

// WebSocket Implementation

Spinderella.WebSocket = function(host, port, channels, identifier, onMessage) {
  this.client = new Spinderella(host, port, channels, identifier, onMessage);
  this.resourceURL = "ws://" + host;
  if(port != 80) this.resourceURL += (":" + port);
  this.resourceURL += ("/" + "spinderella");
  this.client.socket = this;
}

Spinderella.WebSocket.isUseable = function() {
  return (typeof(WebSocket) != "undefined");
};

Spinderella.WebSocket.implementationName = "WebSocket";

Spinderella.WebSocket.prototype = {
  
  onMessage: function(f) { this.client.onMessage = f; },
  
  connect: function(f) {
    this.socket = new WebSocket(this.resourceURL);
    var client = this.client;
    var self   = this;
    if(typeof(f) != "function") f = function() {};
    this.socket.onmessage  = function(e) { 
      // Append "\r\n" since we don't use it with the websocket protocol
      client.receiveData(e.data + "\r\n"); 
    };
    this.socket.onopen  = function()  { client.processConnection(); f(); };
    this.socket.onclose = function()  { self.onDisconnect(); };
  },
  
  onDisconnect: function() {
    this.client.processDisconnection();
    // Check for a disconnection by mistake
    if(false) {
      var self = this;
      setTimeout(function() { self.connect(); }, 5000);
    }
  },
  
  send: function(data) {
    this.socket.send(data);
  }
  
};

// Abstract away the process of finding the best implementation for users so they
// can just automatically use the best fit for this scenario.

Spinderella.Implementations = [Spinderella.WebSocket, Spinderella.jsSocket, Spinderella.Orbited, Spinderella.Silenced];

Spinderella.getPreferredImplementation = function() {
  var implementation;
  for(var i = 0; i < Spinderella.Implementations.length; i++) {
    implementation = Spinderella.Implementations[i];
    if(implementation.isUseable && implementation.isUseable()) return implementation;
  }
  return;
};

Spinderella.create = function(host, ports, channels, identifier, onMessage) {
  var impl = Spinderella.getPreferredImplementation();
  var port;
  if(typeof(ports) == "number") {
    port = ports;
  } else {
    switch(impl) {
    case Spinderella.WebSocket:
      port = ports.websocket;
      break;
    default:
      port = ports.base;
      break;
    }
  }
  return new impl(host, port, channels, identifier, onMessage);
}