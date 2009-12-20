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

// Orbited Implementation

Spinderella.Orbited = function(host, port, channels, identifier, onMessage) {
  this.client = new Spinderella(host, port, channels, identifier, onMessage);
  this.client.socket = this;
}

Spinderella.Orbited.isUseable = function() {
  return true;
};

Spinderella.Orbited.prototype = {
  
  reconnectOn: function() {
    return [Orbited.Errors.RemoteConnectionFailed, Orbited.Errors.UserConnectionReset, Orbited.Statuses.ServerClosedConnection];
  },
  
  onMessage: function(f) { this.client.onMessage = f; },
  
  connect: function(f) {
    this.socket = new TCPSocket();
    var client = this.client;
    var self   = this;
    if(typeof(f) != "function") f = function() {};
    this.socket.onread  = function(d) { client.receiveData(d);  };
    this.socket.onopen  = function()  { client.processConnection(); f(); };
    this.socket.onclose = function(c) { self.onDisconnect(c); };
    this.socket.open(client.host, client.port);
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

Spinderella.jsSocket.isUsable = function() {
};

Spinderella.jsSocket.prototype = {
  
  connect: function(f) {
  },
  
  send: function(data) { 
  },
  
  onMessage: function(f) {
  }
  
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

Spinderella.WebSocket.prototype = {
  
  onMessage: function(f) { this.client.onMessage = f; },
  
  connect: function(f) {
    this.socket = new WebSocket();
    var client = this.client;
    var self   = this;
    if(typeof(f) != "function") f = function() {};
    this.socket.onread  = function(d) { client.receiveData(d);  };
    this.socket.onopen  = function()  { client.processConnection(); f(); };
    this.socket.onclose = function(c) { self.onDisconnect(c); };
  },
  
  onDisconnect: function(c) {
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

Spinderella.Implementations = [Spinderella.WebSocket, Spinderella.jsSocket, Spinderella.Orbited];

Spinderella.getPreferredImplementation() {
  var implementation;
  for(var i in Spinderella.Implementations) {
    implementation = Spinderella.Implementations[i];
    if(implementation.isUseable()) return implementation;
  }
  return;
};

Spinderella.connect(host, port, channels, identifier, onMessage) {
  var impl = Spinderella.getPreferredImplementation();
  if(impl) return new impl(host, port, channels, instance, onMessage);
}