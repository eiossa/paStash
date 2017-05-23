var base_filter = require('../lib/base_filter'),
  dirty = require('dirty'),
  gun = require ('gun'),
  util = require('util');


function FilterAppJanus() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'AppJanus',
    start_hook: this.start,
  });
}

util.inherits(FilterAppJanus, base_filter.BaseFilter);

FilterAppJanus.prototype.start = function(callback) {
 
//	this.db = gun();

	this.db = gun({file: '/home/enrico/Scrivania/prova.json'});			//salvataggio su file del DB

 callback();
};


FilterAppJanus.prototype.process = function(data) {

var obj = JSON.parse(data.message);	//se gli eventi sono raggruppati in janus (grouping= yes in janus.event.config allora message è 1 array

// Process MEETECHO JANUS Events
  if (obj.type == 1) {
// session create/destroy
        // store session_id for transport lookups
        if(obj.session_id && obj.event.transport && obj.event.transport.id ) {
		this.db.get(obj.session_id).put({ transport_id: obj.event.transport.id }, function() {}); // perchè qui fa session_id -> transport id e su created al contrario???
	 }
	/*if (obj.event.name == "created" && obj.session_id) {			//funziona, va sistemato il try-catch
		console.log("\n event created");
		//console.log(data);
		this.db.get(obj.session_id).put({ transport_id: obj.event.transport.id }, function() {});	//riga modificata
		//this.db.get(obj.event.transport.id).put({ session_id: obj.session_id }, function() {}); riga originale (perchè prima transport?) 
        } else if (obj.event.name == "destroyed") {
          // cleanup db
        //  try {
		console.log(data);
                if (this.db.get(obj.session_id).get(obj.event.transport_id)) {	// non c'è il transport nel messaggio destroyed!!!
                      /*  setTimeout(function() {
                          /*try { db.rm(db.get(db.get(data.session_id).transport_id)); } catch(err) { if (debug) console.log(err); }
                        }, 2000);
			console.log("\n event destroyed");
                  }*/
                 /* setTimeout(function() {
                     try {
                        db.rm(data.session_id);
                        db.rm(data.transport_id);
                        db.rm("sess_"+data.transport_id);
                     } catch(err) { if (debug) console.log(err); }
                  }, 2000);
         } catch(err) { if (debug) console.log(err); }
        }*/
  } else if (obj.type == 128) {

//console.log("\n tipo:" + "\t" + "128");
//console.log(data);

    // transports, no session_id native
        // store IP for Session for transport lookups
        if(obj.event.id && obj.event.data.ip && obj.event.data.port) {        
		this.db.get(obj.event.id).put({ip: obj.event.data.ip,port: obj.event.data.port}, function() {}); //manca replace per ffff
        }
       /* if (!obj.session_id && obj.event.id) {			//TODO 
                        var getsession = db.get("sess_"+data.event.id);
                        if (getsession && getsession.session_id != undefined) {
                                data.session_id = getsession.session_id;
                        };
        }*/

  } else if (obj.type == 32) {
	
      if (!obj.session_id) return;
        // lookup of media transport IP - ignoring handle_id or grabbing them all
      /*  if (this.db) {
          if (obj.session_id && this.db.get(obj.session_id)) {		//i messaggi di tipo MEDIA non hanno il transportID
            obj.ip = { 
                ip: this.db.get(data.session_id).get(transport_id).ip, 
                port: this.db.get(data.session_id).get(transport_id).port 
            };
          } 
        }*/
  }


 /* if(data.session_id) data.session_id = data.session_id.toString();
	if(data.handle_id) data.handle_id = data.handle_id.toString();
	if(data.sender) data.sender = data.sender.toString();
  if(data.type) data.type = data.type.toString();
  if(data.event && data.even.transport) { if (typeof data.event.transport === "string") { data.event.transport = { transport: data.event.transport } } }
	if(data.plugindata && data.plugindata.data && data.plugindata.data.result) { 
		if (typeof data.plugindata.data.result === "string") { data.plugindata.data.result = { result: data.plugindata.data.result } }
	}*/

  

  return data;
};

exports.create = function() {
  return new FilterAppJanus();
};
