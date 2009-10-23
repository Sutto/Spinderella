// Released under the MIT License

if(!this.JSON){this.JSON={};}
(function(){function f(n){return n<10?'0'+n:n;}
if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+
partial.join(',\n'+gap)+'\n'+
mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==='string'){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+
mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
return str('',{'':value});};}
if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+
('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse');};}}());Array.prototype.remove=function(from,to){var rest=this.slice((to||from)+1||this.length);this.length=from<0?this.length+from:from;return this.push.apply(this,rest);};var Spinderella=function(host,port,channels,identifier,onMessage){this.host=host;this.port=port||42340;this.channels=channels||[];this.identifier=identifier;this.buffer="";this.onMessage=onMessage||function(contents,type,data){};}
Spinderella.prototype={processConnection:function(){if(this.channels&&this.channels.length>0)this.subscribe(this.channels);if(this.identifier)this.identify(this.identifier);},processDisconnection:function(){},receiveData:function(data){this.buffer+=data;if(this.buffer.indexOf("\r\n")>=0){var split_buffer=this.buffer.split("\r\n");this.buffer=split_buffer.pop()||"";for(var idx=0;idx<split_buffer.length;idx++){this.receiveMessage(split_buffer[idx]);}}},receiveMessage:function(raw_message){var parsed=JSON.parse(raw_message);if(parsed&&parsed.action){this.handleAction(parsed.action,(parsed.data||{}));}},handleAction:function(name,data){switch(name){case'ping':this.performAction("pong");break;case'receive_message':this.onMessage(data.message,data.type,data);break;}},performAction:function(name,data){if(!data)data={};var raw={"action":name,"data":data};this.socket.send(JSON.stringify(raw)+"\r\n");},subscribe:function(channels){for(var idx=0;idx<channels.length;idx++){var c=channels[idx];if(this.channels.indexOf(c)<0)this.channels.push(c);}
this.performAction("subscribe",{"channels":channels});},unsubscribe:function(channels){for(var idx=0;idx<channels.length;idx++){var c=channels[idx];var idx2=this.channels.indexOf(c);if(idx2>=0)this.channels.remove(idx2);}
this.performAction("unsubscribe",{"channels":channels});},identify:function(identifier){this.performAction("identify",{"identifier":identifier})}};Spinderella.Orbited=function(host,port,channels,identifier,onMessage){this.client=new Spinderella(host,port,channels,identifier,onMessage);this.client.socket=this;}
Spinderella.Orbited.prototype={reconnectOn:function(){return[Orbited.Errors.RemoteConnectionFailed,Orbited.Errors.UserConnectionReset,Orbited.Statuses.ServerClosedConnection];},onMessage:function(f){this.client.onMessage=f;},connect:function(f){this.socket=new TCPSocket();var client=this.client;var self=this;if(typeof(f)!="function")f=function(){};this.socket.onread=function(d){client.receiveData(d);};this.socket.onopen=function(){client.processConnection();f();};this.socket.onclose=function(c){self.onDisconnect(c);};this.socket.open(client.host,client.port);},onDisconnect:function(c){this.client.processDisconnection();if(this.reconnectOn().indexOf(c)>=0){var self=this;setTimeout(function(){self.connect();},5000);}},send:function(data){this.socket.send(data);}};
