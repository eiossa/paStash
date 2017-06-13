var base_filter = require('../lib/base_filter'),
  dirty = require('dirty'),
  gun = require ('gun'),
  util = require('util'),
  levelup = require('level'),
  level = require('level-browserify'),
  levelgraph = require('levelgraph'),
  session,
  opaqueID,	
  handle,
  handle_set,
  user,
  counter=0,		//questo valore non andrebbe re-inizializzato ogni volta
  triples,
  query,
  stream,
  i,x;

function FilterAppJanus() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'AppJanus',
    start_hook: this.start,
  });
}
/*this.db.search([{subject: x, object: obj.handle_id}], function (err,solutions){
			if(err)
			console.log(err);
			else {}//console.log("Opaque relativo all'handle detached: ",solutions[0].x)
		})*/

function Searchdb(relation,name,db){		//cerca il valore NAME con ruolo RELATION
						//con la callback (obbligatoria) l'esecuzione va avanti anche se non ho ancora ritornato il valore cercato!
console.log("FUNZIONE RICERCA")

x = db.v('x');				
db.search([{subject:x,relation: name}], function (err,solutions){
			if(err) {
			   console.log("VALORE NON TROVATO!");
			   return 0;
			} else {
			   console.log("VALORE TROVATO: ",solutions[0].x)
			   return solutions[0].x;
			}
		})	
}

function WhoIsPublishing(room){
 room = 1234;
//var ele = document.getElementById('demo');
	
 
 db.search([{subject: db.v('z'),predicate: "publisher", object:room}],function(err,solutions){
  if (err){
	console.log(err);
	//ele.innerHTML =  "ciao";
  }else { //console.log(results);
	if (solutions.length==0){
		console.log("\nNessun publisher nella room ",room);
		//ele.getElementById('demo').innerHTML = Date();
	    } else for (i=0;i<solutions.length;i++){
	  console.log("publisher numero ",i,": ",solutions[i].z) // come stampare il predicato della soluzione?
	 // ele.getElementById('demo').innerHTML =  Date();	
	//console.log("L : ",solutions.length);
	 }
       }
 })
}


/*db.search([{subject: x, object: obj.handle_id}], function (err,solutions){
			if(err)
			console.log(err);
			else {console.log("L'opaque relativo all'handle",obj.handle_id," detached è: ",solutions[0].x)}
		})*/

util.inherits(FilterAppJanus, base_filter.BaseFilter);

FilterAppJanus.prototype.start = function(callback) {
 
//	this.db = gun();

	//this.db = gun({file: '/home/enrico/Scrivania/prova.json'});		//salvataggio su file del DB
	
	//this.db = levelup('./mydb');

	db = levelgraph(level("yourdb32435"));

	//handle = session.put('handle');

//	user = this.db.get('user');
//	handle_set = this.db.get('handle_set');

 callback();
};


FilterAppJanus.prototype.process = function(data) {

var obj = JSON.parse(data.message);	//se gli eventi sono	 raggruppati in janus (grouping= yes in janus.event.config allora message è 1 array e va modificato il parsing -> [0] alla fine e ciclare sul numero di json ricevuti


// Process MEETECHO JANUS Events
  if (obj.type == 1) {

//WhoIsPublishing();
// session create/destroy
        // store session_id		//TODO 

	if (obj.event.name == "created" && obj.session_id){
		// this.db.get('session').put('session_id',obj.session_id);
	//1	this.db.put('session'+ Number(counter),obj.session_id);
		

	/*	this.db.get('session'+counter,function(err, data) {			//stampa valore session
      	     		console.log('session id ',Number(counter)-1,': ',data)
    		})

		counter++;

		var stream = this.db.createReadStream({ keys: false, values: true })	//stampa tutte le sessioni
		stream.on('data', function (data) {
    			console.log("value: ",data)
  		})*/

	} else if (obj.event.name == "destroyed") {
		//per il momento non fare nulla
	}

  } else if (obj.type == 2){

	//console.log("\nTIPO 2: ",obj);
	//TODO if (plugin = videoroom)   - gestire i vari plugin
	
	//store opaqueID and handleID
	if (obj.event.opaque_id && obj.event.name=='attached'){
		
		// SESSION created OPAQUE		
		triples = [{subject: obj.session_id, predicate:'created', object: obj.event.opaque_id }];
	 	db.put(triples, function(err) {
  		   if(err) 
		   console.log(err)
		})
		// OPAQUE related to HANDLE
		triples = [{subject: obj.event.opaque_id, predicate: "related to", object: obj.handle_id}];
		db.put(triples, function(err) {
		   if(err) 
		   console.log(err)
		})
		
		/*query = { subject: obj.event.opaque_id, predicate: "related to" }	//stampa tutti gli handle associati all'opaque
		this.db.get(query, function(err, triples) {
		for (i=0;i<triples.length;i++)		
			console.log("handle n ",i,": ",triples[i].object);    //stampa solo un campo - triples è 1 array
		//console.log(triples)					      //stampa la tripla relativa all'opaque inserito
		})*/	
		
	/*	query = {object: obj.handle_id}			//stampa opaque associato all'handle_id
		this.db.get(query, function(err,triples){
	        console.log("Handle: ",obj.handle_id," - Opaque: ",triples [0].subject);					
		})*/

}	else if (obj.event.name == "detached") {

		//TODO se l'handle è detached vanno eliminati anche i subscriber
		//una volta trovato l'opaque andrebbe eliminata la tripla e reinserita con il predicato cambiato (non è supportata 			la modifica della tripla) se ci interessa tener traccia (es - predicato -> detached)

		/*query = { object: obj.handle_id }		//stampa la tripla relativa all'handle detached
		this.db.get(query, function(err, triples) {
  		console.log(triples)
		})*/

		
		//console.log(Searchdb("object",obj.handle_id,this.db))
		//console.log("PROVA: ",prova);

		x = db.v('x');				//cerca il soggetto (opaque_ID) relativo all'handle detached
		db.search([{subject: x, object: obj.handle_id}], function (err,solutions){
			if(err)
			console.log(err);
			//else {console.log("L'opaque relativo all'handle",obj.handle_id," detached è: ",solutions[0].x)}
		})

		
		/*stream = this.db.searchStream([{ subject: x, object: obj.handle_id }]);	//equivalente alla search ma con Stream
		stream.on('data', function(triple) {
  			console.log(JSON.stringify(triple))
		})*/	
		
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
		//plugin message

	//console.log(obj);

// TODO if plugin is videoroom
// TODO provare a cercare per displayname

	if(obj.event.data.event == "joined" ){		//crea tripla OpaqueID -> publishingID -> Room (displayname)
		x = db.v('x');	// cerca l'opaque associato all'handle
		db.search([{subject: x, object: obj.handle_id}], function (err,solutions){ 
			triples = [{subject: solutions[0].x, predicate: obj.event.data.id, object: obj.event.data.room, "displayname": obj.event.data.display}];
			try { 
			     console.log("TRIPLA JOIN INSERITA: ",triples[0].subject,"  ", triples[0].predicate,"  ", triples[0].object,"  ",triples[0].displayname);	
			     db.put(triples); // è questa che mi fa uscire due risultati da WhoIsPublishing
			}
			catch (err) {console.log(err)}
		});
	} else if (obj.event.data.event == "published"){ //TODO inserisce due volte la tripla, perchè'????
		//l'user con publisher id = obj.event.data.id sta pubblicando (è un publisher)nella room obj.event.data.room
		// crea tripla OpaqueID -> "publisher" -> Room
		x = db.v('x');
		db.search([{subject: x, object: obj.handle_id}], function (err,solutions){ 
			triples = [{subject: solutions[0].x, predicate: "publisher", object: obj.event.data.room}];
			try { 
			     console.log("TRIPLA PUBLISHED INSERITA: ",triples[0].subject,"  ", triples[0].predicate,"  ", triples[0].object);	     				     db.put(triples);
			    WhoIsPublishing();
			}
			catch (err) {console.log(err)}
		});		
	} else if(obj.event.data.event == "unpublished"){
//l'user con publisher id = obj.event.data.id non sta + pubblicando (rimuovi da publisher) nella room obj.event.data.room
//elimina la tripla OpaqueID -> "publisher" -> Room   (OpaqueID viene recuperato tramite l'handle)	
//TODO eliminare i subscribers

		x = db.v('x');
		db.search([{subject: x, predicate: "related to", object: obj.handle_id }], function (err,solutions){ 
			triples = [{subject: solutions[0].x, predicate: "publisher", object: obj.event.data.room}];
			try { 
			     console.log("TRIPLA ELIMINATA (unpublished): ",triples[0].subject,"  ", triples[0].predicate,"  ", triples[0].object);	     				     db.del(triples);
			     WhoIsPublishing();
			}
			catch (err) {console.log(err)}
		});
	} else if (obj.event.data.event == "subscribing"){
	//l'user con id= obj.event.data.private_id si sta sottoscrivendo all'utente con publisher id = obj.event.data.feed nella stanza obj.event.data.room
	//TODO mi serve? può arrivare subscribing e non subscribed???
	} else if (obj.event.data.event == "subscribed"){
		//l'handle dell'utente con publisher id obj.event.data.feed è stato collegato all'handle con id = obj.handle_id
		//Crea tripla OpaqueID -> subscribed (to) -> OpaqueID
		//TODO cambiare le search in modo che costruiscano la tripla direttamente (materialized??)
		db.search([{subject: db.v('x'), predicate: "related to", object: obj.handle_id},
				{subject: db.v('y'), predicate: obj.event.data.feed, object: obj.event.data.room }],function(err,solutions){
		//console.log("SOLUZIONE x: ",solutions[0].x,"  y:",solutions[0].y);
			triples = [{subject: solutions[0].x, predicate:"subscribed", object: solutions[0].y}];	
			try { 
			     console.log("TRIPLA subscribed INSERITA: ",triples[0].subject,"  ", triples[0].predicate,"  ", triples[0].object);	     				    
			     db.put(triples);
			}
			catch (err) {console.log(err)}
		});
	}

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
