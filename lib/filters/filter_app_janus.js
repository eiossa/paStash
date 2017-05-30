var base_filter = require('../lib/base_filter'),
  dirty = require('dirty'),
  gun = require ('gun'),
  util = require('util'),
  session,
  opaqueID,	//posso creare un set degli opaqueID di una sessione?
  handle,
  handle_set;

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

	this.db = gun({file: '/home/enrico/Scrivania/prova.json'});		//salvataggio su file del DB
	
	session = this.db.get('session');
	handle = this.db.get('handle');
	handle_set = this.db.get('prova');

 callback();
};


FilterAppJanus.prototype.process = function(data) {

var obj = JSON.parse(data.message);	//se gli eventi sono raggruppati in janus (grouping= yes in janus.event.config allora message è 1 array e va modificato il parsing -> [0] alla fine e ciclare sul numero di json ricevuti

// Process MEETECHO JANUS Events
  if (obj.type == 1) {
// session create/destroy
        // store session_id


/*var bob = gun.get('person/bob').put({name: 'bob', age: 24});
var alice = gun.get('person/alice').put({name: 'alice', age: 22});
bob.path('spouse').put(alice);*/

	if (obj.event.name == "created" && obj.session_id){
		session.put({session_id: obj.session_id});
		handle.put({session_id: obj.session_id});
		
		//session.map().val(function(sess){		//stampa tutte le sessioni
 		//console.log("The session is", sess);});		//val stampa solo 1 livello, per avere tutti i livelli usa estensione 										https://github.com/kristianmandrup/future-gun
	} else if (obj.event.name == "destroyed") {
		//set the reference to null
		session.get(obj.session_id).put(null);
		handle.get(obj.session_id).put(null);	
	}

  } else if (obj.type == 2){

	//console.log("\nTIPO 2: ",obj);

	//store opaqueID
	if (obj.event.opaque_id && obj.event.name!='detached'){
		console.log("\nTIPO 2: ",obj);
	 	var opaque = session.get(obj.session_id).put({opaque_id: obj.event.opaque_id},function(){});

		//console.log("\nOPAQUE DEL MESSAGGIO: ", obj.event.opaque_id);		
		session.get(obj.session_id).val(function(opaque_id){		//STAMPA L'INTERO OGGETTO INSERITO
		//console.log('\nOPAQUE INSERITO: ',opaque_id)	
		});

		//session.get(obj.session_id).get(obj.event.opaque_id).put('prova');

    		session.get(obj.session_id).get('opaque_id').val(function(value, field){	//STAMPA DEL CAMPO OPAQUE_ID!
		console.log("\nSESSIONE: ",obj.session_id);   		
		console.log("VALORE OPAQUE", value);   
    		});
		
		/*session.get(obj.session_id).val(function(value, field){	//STAMPA ANCHE QUELLO CHE C'È "SOTTO" L'OPAQUE_ID (es.prova)
    		console.log("\nVALORE OPAQUE", value);   
    		});*/

		//console.log("\nHANDLE DEL MESSAGGIO: ", obj.handle_id);
		var han = handle.get(obj.session_id).put({handle_id: obj.handle_id});
		
		handle_set.set(han);
		/*handle_set.map().val(function(handle_id){
 		console.log("The handle is", handle_id);});*/	
		
		han.get(obj.handle_id).put(opaque);	//inserisci una reference all'OPAQUE_ID all'handle 
		/*handle.get(obj.session_id).val(function(handle_id){
		console.log('\nHANDLE: ',handle_id)
		});*/
	
	
		//funzione di stampa del puntatore inserito
		/*handle.get(obj.session_id).get(obj.handle_id).val(function(handle_id){
    		  console.log("\nThe opaque is",handle_id );
		});*/

	handle.get(obj.session_id).val(function(handle_id){
    		//  console.log("\nThe opaque is",handle_id );
		});


/* esempio dalla wiki di gun

var bob = gun.get('person/bob').put({name: 'bob', age: 24});
var alice = gun.get('person/alice').put({name: 'alice', age: 22});
bob.path('spouse').put(alice);
var people = gun.get('people');
people.map().val(function(person){
  console.log("The person is", person);
});

*/

}	else if (obj.event.name == "detached") {

		//console.log("\nTIPO 2: ",obj);
		
		//rimuovi l'handle
		/*handle.get(obj.session_id).get(obj.handle_id).val(function(handle_id){
    		  console.log("\nThe opaque is",handle_id );
		});
		handle.get(obj.session_id).get(obj.handle_id).put(null);

		handle.get(obj.session_id).get(obj.handle_id).val(function(handle_id){
    		  console.log("\nThe NEW opaque is",handle_id );
		});	*/
		
	 }

  } else if (obj.type == 128) {
/*


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
  } else if (obj.type == 64) {

	

}


  if(data.session_id) data.session_id = data.session_id.toString();	//da testare
	if(data.handle_id) data.handle_id = data.handle_id.toString();
	if(data.sender) data.sender = data.sender.toString();
  if(data.type) data.type = data.type.toString();
  if(data.event && data.even.transport) { if (typeof data.event.transport === "string") { data.event.transport = { transport: data.event.transport } } }
	if(data.plugindata && data.plugindata.data && data.plugindata.data.result) { 
		if (typeof data.plugindata.data.result === "string") { data.plugindata.data.result = { result: data.plugindata.data.result } }
	}

  

  return data;
};

exports.create = function() {
  return new FilterAppJanus();
};
