Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

// Spinderella.js - A Web Client for Spinderella, built on WebSocket, JSSocket, and Orbited
// Making it super easy for realtime pubsub clients in the browser.

var Spinderella = function(host, port, channels, identifier, onMessage) {
  this.host = host;
  this.port = port || 42340;
  this.channels = channels || [];
  this.identifier = identifier;
  this.buffer = "";
  this.onMessage = onMessage || function() {};
}

Spinderella.log = function() {};

Spinderella.Util = {
  
  loadJS: function(url, func) {
    Spinderella.log("loading javascript from", url);
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
    Spinderella.log("-> processConnection");
    if(this.channels && this.channels.length > 0) this.subscribe(this.channels);
    if(this.identifier) this.identify(this.identifier);
  },
  
  processDisconnection: function() {
    Spinderella.log("-> processDisconnection");
  },
  
  receiveData: function(data) {
    Spinderella.log("<<", data);
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
    Spinderella.log("Got raw message:", raw_message);
    var parsed = JSON.parse(raw_message);
    if(parsed && parsed.action) {
      Spinderella.log("Handling action:", parsed.action)
      this.handleAction(parsed.action, (parsed.data || {}));
    }
  },
  
  handleAction: function(name, data) {
    switch(name) {
    case 'ping':
      Spinderella.log("Oh noes! ping time");
      this.performAction("pong");
      break;
    case 'receive_message':
      this.onMessage(data.message, data.type, data);
      break;
    }
  },
  
  performAction: function(name, data) {
    Spinderella.log("Performing action with name =", name, "and data =", data);
    if(!data) data = {};
    var raw = JSON.stringify({
      "action":  name,
      "payload": data
    });
    Spinderella.log(">>", raw);
    this.socket.send(raw + "\r\n");
  },
  
  subscribe: function(channels) {
    for(var idx = 0; idx < channels.length; idx++) {
      var c = channels[idx];
      if(this.channels.indexOf(c) < 0) this.channels.push(c);
    }
    Spinderella.log("Subscribing to channels: ", channels);
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
    Spinderella.log("Unsubscribing from", channels);
    this.performAction("unsubscribe", {
      "channels": channels
    });
  },
  
  identify: function(identifier) {
    Spinderella.log("Identifying as", identifier);
    this.performAction("identify", {
      "identifier": identifier
    })
  }
  
};

// A Noop based implementation / does nothing.

Spinderella.Mock = function() {
  this.client = new Spinderella();
  this.client.socket = this;
};

Spinderella.Mock.isUseable = function() {
  return true;
};

Spinderella.Mock.implementationName = "Mock";

Spinderella.Mock.prototype = {
  onMessage:    function() { Spinderella.log("Adding onMessage callback"); },
  connect:      function() { Spinderella.log("Mock connected."); },
  onDisconnect: function() { Spinderella.log("Mock disconnected."); },
  send:         function(d) { Spinderella.log("Mock is sending data:", d); }
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
  
  // Use a function otherwise it causes issues when orbited isn't loaded.
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

// JSSocket Implementation

Spinderella.JSSocket = function(host, port, channels, identifier, onMessage) {
  this.client = new Spinderella(host, port, channels, identifier, onMessage);
  this.client.socket = this;
};

Spinderella.JSSocket.flashURL           = null;
Spinderella.JSSocket.javascriptURL      = null;
Spinderella.JSSocket.implementationName = "JSSocket";

Spinderella.JSSocket.isUseable = function() {
  if(Spinderella.JSSocket.flashURL == null || Spinderella.JSSocket.javascriptURL == null) return false;
  // VERY rudimentary check for Flash.
  Spinderella.log("Checking for Flash");
  var n = navigator;
  if(n.mimeTypes) {
    return n.mimeTypes["application/x-shockwave-flash"] !== undefined;
  } else if(n.plugins) {
    return n.plugins["Shockwave Flash"] !== undefined;
  } else {
    return false;
  }
};

Spinderella.JSSocket.prototype = {
  
  connect: function(f) {
    Spinderella.log("Connecting via flash");
    var self = this;
    var client = this.client;
    var callback = function() {
      JSSocket.swf    = Spinderella.JSSocket.flashURL;
      Spinderella.log("Set JSSocket swf to", JSSocket.swf);
      JSSocket.logger = function() { Spinderella.log.apply(Spinderella, arguments); };
      Spinderella.log("Created socket and setting callbacks");
      if(typeof(f) != "function") f = function() {};
      
      self.socket = JSSocket.connect(client.host, client.port, function(jss) {
        // Add events
        jss.onData(function(d) { client.receiveData(d); });
        jss.onOpen(function()  { client.processConnection(); f(); });
        jss.onClose(function() { client.processDisconnection(); });
      });
      
    };
    // Load the JS if not already loaded, otherwise call it immediatly.
    if(typeof(JSSocket) == "undefined") {
      Spinderella.log("Lazy loading JSSocket");
      Spinderella.Util.loadJS(Spinderella.JSSocket.javascriptURL, callback);
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
  this.resourceURL += ("/spinderella");
  Spinderella.log("WebSocket uses", this.resourceURL);
  this.client.socket = this;
}

Spinderella.WebSocket.isUseable = function() {
  return (typeof(WebSocket) != "undefined");
};

Spinderella.WebSocket.implementationName = "WebSocket";

Spinderella.WebSocket.prototype = {
  
  onMessage: function(f) { this.client.onMessage = f; },
  
  connect: function(f) {
    Spinderella.log("Creating websocket");
    this.socket = new WebSocket(this.resourceURL);
    var client = this.client;
    var self   = this;
    Spinderella.log("Setting callbacks");
    if(typeof(f) != "function") f = function() {};
    this.socket.onmessage  = function(e) { 
      // Append "\r\n" since we don't use it with the websocket protocol
      client.receiveData(e.data + "\r\n"); 
    };
    this.socket.onopen  = function()  { client.processConnection(); f(); };
    this.socket.onclose = function()  { self.onDisconnect(); };
  },
  
  onDisconnect: function() {
    Spinderella.log("Handling websocket disconnection");
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

Spinderella.Implementations = [Spinderella.WebSocket, Spinderella.JSSocket, Spinderella.Orbited, Spinderella.Mock];

Spinderella.getPreferredImplementation = function() {
  var implementation;
  for(var i = 0; i < Spinderella.Implementations.length; i++) {
    implementation = Spinderella.Implementations[i];
    Spinderella.log("Checking if", implementation.implementationName, "is useable");
    if(implementation.isUseable && implementation.isUseable()) {
      Spinderella.log("Using", implementation.implementationName);
      return implementation;
    }
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
  Spinderella.log("Connection to", host, port);
  return new impl(host, port, channels, identifier, onMessage);
}