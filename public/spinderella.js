// Spinderella.js - A Web Client for Spinderella, built on jssocket

var Spinderella = function(host, port, channels, identifier, onMessage) {
  this.host = host;
  this.port = port || 42340;
  this.channels = channels || [];
  this.identifier = identifier;
  this.buffer = "";
  this.onMessage = onMessage || function(contents, type, data) {};
  this.connect(); 
}

Spinderella.prototype = {
  
  reconnect_on: [Orbited.Errors.RemoteConnectionFailed, Orbited.Errors.UserConnectionReset, Orbited.Statuses.ServerClosedConnection],
  
  connect: function() {
    this.socket = new TCPSocket();
    var spin = this;
    this.socket.onread  = function(d) { spin.receiveData(d)  };
    this.socket.onopen  = function()  { spin.processConnection() };
    this.socket.onclose = function(c) { spin.processDisconnection(c) };
    this.socket.open(this.host, this.port);
  },
  
  processConnection: function() {
    if(this.channels && this.channels.length > 0) this.subscribe(this.channels);
    if(this.identifier) this.identify(this.identifier);
  },
  
  processDisconnection: function(c) {
    if(this.reconnect_on.indexOf(c) >= 0) {
      var spin = this;
      setTimeout(function() {
        spin.connect();
      }, 5000);
    }
  },
  
  receiveData: function(data) {
    this.buffer += data;
    if(this.buffer.indexOf("\r\n") >= 0) {
      var split_buffer = this.buffer.split("\r\n");
      this.buffer = split_buffer.pop() || "";
      for(var idx in split_buffer) {
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
    this.performAction("subscribe", {
      "channels": channels
    });
  },
  
  unsubscribe: function(channels) {
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