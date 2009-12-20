// Released under the MIT License
if(!this.JSON)this.JSON={};
(function(){function a(d){return d<10?"0"+d:d}function b(d){j.lastIndex=0;return j.test(d)?'"'+d.replace(j,function(g){var h=q[g];return typeof h==="string"?h:"\\u"+("0000"+g.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+d+'"'}function c(d,g){var h,k,n=l,i,e=g[d];if(e&&typeof e==="object"&&typeof e.toJSON==="function")e=e.toJSON(d);if(typeof o==="function")e=o.call(g,d,e);switch(typeof e){case "string":return b(e);case "number":return isFinite(e)?String(e):"null";case "boolean":case "null":return String(e);case "object":if(!e)return"null";
l+=p;i=[];if(Object.prototype.toString.apply(e)==="[object Array]"){k=e.length;for(d=0;d<k;d+=1)i[d]=c(d,e)||"null";g=i.length===0?"[]":l?"[\n"+l+i.join(",\n"+l)+"\n"+n+"]":"["+i.join(",")+"]";l=n;return g}if(o&&typeof o==="object"){k=o.length;for(d=0;d<k;d+=1){h=o[d];if(typeof h==="string")if(g=c(h,e))i.push(b(h)+(l?": ":":")+g)}}else for(h in e)if(Object.hasOwnProperty.call(e,h))if(g=c(h,e))i.push(b(h)+(l?": ":":")+g);g=i.length===0?"{}":l?"{\n"+l+i.join(",\n"+l)+"\n"+n+"}":"{"+i.join(",")+"}";
l=n;return g}}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+a(this.getUTCMonth()+1)+"-"+a(this.getUTCDate())+"T"+a(this.getUTCHours())+":"+a(this.getUTCMinutes())+":"+a(this.getUTCSeconds())+"Z":null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()}}var f=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
j=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,l,p,q={"\u0008":"\\b","\t":"\\t","\n":"\\n","\u000c":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},o;if(typeof JSON.stringify!=="function")JSON.stringify=function(d,g,h){var k;p=l="";if(typeof h==="number")for(k=0;k<h;k+=1)p+=" ";else if(typeof h==="string")p=h;if((o=g)&&typeof g!=="function"&&(typeof g!=="object"||typeof g.length!=="number"))throw new Error("JSON.stringify");return c("",
{"":d})};if(typeof JSON.parse!=="function")JSON.parse=function(d,g){function h(k,n){var i,e,m=k[n];if(m&&typeof m==="object")for(i in m)if(Object.hasOwnProperty.call(m,i)){e=h(m,i);if(e!==undefined)m[i]=e;else delete m[i]}return g.call(k,n,m)}f.lastIndex=0;if(f.test(d))d=d.replace(f,function(k){return"\\u"+("0000"+k.charCodeAt(0).toString(16)).slice(-4)});if(/^[\],:{}\s]*$/.test(d.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){d=eval("("+d+")");return typeof g==="function"?h({"":d},""):d}throw new SyntaxError("JSON.parse");}})();Array.prototype.remove=function(a,b){b=this.slice((b||a)+1||this.length);this.length=a<0?this.length+a:a;return this.push.apply(this,b)};var Spinderella=function(a,b,c,f,j){this.host=a;this.port=b||42340;this.channels=c||[];this.identifier=f;this.buffer="";this.onMessage=j||function(){}};
Spinderella.Util={loadJS:function(a,b){var c=document.createElement("script");c.type="text/javascript";c.src=a;c.onload=b;document.getElementsByTagName("head")[0].appendChild(c)}};
Spinderella.prototype={processConnection:function(){this.channels&&this.channels.length>0&&this.subscribe(this.channels);this.identifier&&this.identify(this.identifier)},processDisconnection:function(){},receiveData:function(a){this.buffer+=a;if(this.buffer.indexOf("\r\n")>=0){a=this.buffer.split("\r\n");this.buffer=a.pop()||"";for(var b=0;b<a.length;b++)this.receiveMessage(a[b])}},receiveMessage:function(a){if((a=JSON.parse(a))&&a.action)this.handleAction(a.action,a.data||{})},handleAction:function(a,
b){switch(a){case "ping":this.performAction("pong");break;case "receive_message":this.onMessage(b.message,b.type,b);break}},performAction:function(a,b){b||(b={});this.socket.send(JSON.stringify({action:a,data:b})+"\r\n")},subscribe:function(a){for(var b=0;b<a.length;b++){var c=a[b];this.channels.indexOf(c)<0&&this.channels.push(c)}this.performAction("subscribe",{channels:a})},unsubscribe:function(a){for(var b=0;b<a.length;b++){var c=this.channels.indexOf(a[b]);c>=0&&this.channels.remove(c)}this.performAction("unsubscribe",
{channels:a})},identify:function(a){this.performAction("identify",{identifier:a})}};Spinderella.Orbited=function(a,b,c,f,j){this.client=new Spinderella(a,b,c,f,j);this.client.socket=this};Spinderella.Orbited.isUseable=function(){return true};
Spinderella.Orbited.prototype={reconnectOn:function(){return[Orbited.Errors.RemoteConnectionFailed,Orbited.Errors.UserConnectionReset,Orbited.Statuses.ServerClosedConnection]},onMessage:function(a){this.client.onMessage=a},connect:function(a){this.socket=new TCPSocket;var b=this.client,c=this;if(typeof a!="function")a=function(){};this.socket.onread=function(f){b.receiveData(f)};this.socket.onopen=function(){b.processConnection();a()};this.socket.onclose=function(f){c.onDisconnect(f)};this.socket.open(b.host,
b.port)},onDisconnect:function(a){this.client.processDisconnection();if(this.reconnectOn().indexOf(a)>=0){var b=this;setTimeout(function(){b.connect()},5E3)}},send:function(a){this.socket.send(a)}};Spinderella.jsSocket=function(a,b,c,f,j){this.client=new Spinderella(a,b,c,f,j);this.client.socket=this};Spinderella.jsSocket.flashURL="";Spinderella.jsSocket.javascriptURL="";Spinderella.jsSocket.isUsable=function(){};
Spinderella.jsSocket.prototype={connect:function(a){var b=this,c=this.client,f=function(){jsSocket.swf=Spinderella.jsSocket.flashURL;b.socket=new jsSocket({keepalive:false,autoreconnect:true});if(typeof a!="function")a=function(){};b.socket.onData=function(j){c.receiveData(j)};b.socket.onOpen=function(){c.processConnection();a()};b.socket.onClose=function(){c.processDisconnection()};b.socket.onLoaded=function(){b.socket.connect(c.host,c.port)}};typeof jsSocket!="undefined"?Spinderella.Util.loadJS(Spinderella.jsSocket.javascriptURL,
f):f()},send:function(a){this.socket.send(a)},onMessage:function(a){this.client.onMessage=a}};Spinderella.WebSocket=function(a,b,c,f,j){this.client=new Spinderella(a,b,c,f,j);this.resourceURL="ws://"+a;if(b!=80)this.resourceURL+=":"+b;this.resourceURL+="/spinderella";this.client.socket=this};Spinderella.WebSocket.isUseable=function(){return typeof WebSocket!="undefined"};
Spinderella.WebSocket.prototype={onMessage:function(a){this.client.onMessage=a},connect:function(a){this.socket=new WebSocket(this.resourceURL);var b=this.client,c=this;if(typeof a!="function")a=function(){};this.socket.onread=function(f){b.receiveData(f.data)};this.socket.onopen=function(){b.processConnection();a()};this.socket.onclose=function(){c.onDisconnect()}},onDisconnect:function(){this.client.processDisconnection()},send:function(a){this.socket.send(a)}};
Spinderella.Implementations=[Spinderella.WebSocket,Spinderella.jsSocket,Spinderella.Orbited];Spinderella.getPreferredImplementation=function(){var a;for(var b in Spinderella.Implementations){a=Spinderella.Implementations[b];if(a.isUseable())return a}};Spinderella.connect=function(a,b,c,f,j){if(f=Spinderella.getPreferredImplementation())return new f(a,b,c,instance,j)};
