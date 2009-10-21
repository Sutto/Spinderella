Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};


// Spinderella.js - A Web Client for Spinderella, built on jssocket

var Spinderella = function(host, port, channels, identifier, onMessage) {
  this.host = host;
  this.port = port || 42340;
  this.channels = channels || [];
  this.identifier = identifier;
  this.buffer = "";
  this.onMessage = onMessage || function(contents, type, data) {};
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
    console.log("Raw Message: " + raw_message);
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

Spinderella.Orbited.prototype = {
  
  reconnectOn: function() {
    return [Orbited.Errors.RemoteConnectionFailed, Orbited.Errors.UserConnectionReset, Orbited.Statuses.ServerClosedConnection];
  },
  
  onMessage: function(f) { this.client.onMessage = f; },
  
  connect: function() {
    this.socket = new TCPSocket();
    var client = this.client;
    var self   = this;
    this.socket.onread  = function(d) { client.receiveData(d)  };
    this.socket.onopen  = function()  { client.processConnection() };
    this.socket.onclose = function(c) { self.onDisconnect(c) };
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