
var base_filter = require('../lib/base_filter'),
  util = require('util'),
  levelup = require('level'),
  level = require('level-browserify'),
  levelgraph = require('levelgraph'),
  query,
  stream,
  i,x,op,z;

function FilterAppJanus() {
  base_filter.BaseFilter.call(this);
  this.mergeConfig({
    name: 'AppJanus',
    start_hook: this.start,
  });
}

//chi sta pubblicando nella stanza
function WhoIsPublishing(room){
 room = 1234;

 db.search([{subject: db.v('z'),predicate: "publisher", object:room}],function(err,solutions){
  if (err){
	   console.log(err);
  }else{
    if (solutions.length==0){
		    console.log("\nNessun publisher nella room ",room);
			   }
    else {
      for (i=0;i<solutions.length;i++){
          console.log("Publisher numero ",i,": ",solutions[i].z)
      }
      console.log("\t");
    }
  }
 })
}

////utenti sottoscritti nella stanza
function WhoIsSubscribed(room){
 room = 1234;

 db.search([{subject: db.v('z'),predicate: "subscribed"}],function(err,solutions){
  if (err){
	   console.log(err);
  }else {
    if (solutions.length==0){
		    console.log("\nNessun viewer nella room ",room);
			  }
    else {
        for (i=0;i<solutions.length;i++){
          console.log("Viewer numero ",i,": ",solutions[i].z)
          }
        console.log("\t");
        }
    }
 })
}



util.inherits(FilterAppJanus, base_filter.BaseFilter);

FilterAppJanus.prototype.start = function(callback) {

	db = levelgraph(level("060701"));

 callback();
};


FilterAppJanus.prototype.process = function(data) {


  var triples ={};
  var msg = { message: data, type: data.type };


  var ship = function(msg) {
 	  if (!msg.message) { console.log('NO MESSAGE!!! Skipping.. ',msg); }
    // SANITIZE!

    try {
        if(msg.message.session_id) msg.message.session_id = msg.message.session_id.toString();
        if(msg.message.handle_id) msg.message.handle_id = msg.message.handle_id.toString();
      /*  if(msg.message.sender) msg.message.sender = msg.message.sender.toString();
        if(msg.message.type) msg.message.type = msg.message.type.toString();
        if(msg.message.event && msg.message.event.transport) {
          if (typeof msg.message.event.transport === "string") { msg.message.event.transport = { transport: msg.message.event.transport } } }
        if(msg.message.plugindata && msg.message.plugindata.data && msg.message.plugindata.data.result) {
          if (typeof msg.message.plugindata.data.result === "string") { msg.message.plugindata.data.result = { result: msg.message.plugindata.data.result } }
        }*/
      } catch(e) { console.log('error sanitizing!',e); }
 	 this.emit('output',msg.message);
  }.bind(this);


/*try { data = JSON.parse(data.message); }
catch(e) { data = data; }     // non arriva nulla su ES così
*/


//TODO gestire gli array -> grouping yes in janus
//se gli eventi sono	 raggruppati in janus (grouping= yes in janus.event.config allora message è 1 array e va modificato il parsing -> [0] alla fine e ciclare sul numero di json ricevuti


// Process MEETECHO JANUS Events
  if (data.type == 1) {
// session create/destroy
        // store session_id

	if (data.event.name == "created" && data.session_id){
     ship(msg);
  } else if (data.event.name == "destroyed") {
		//per il momento non fare nulla
    ship(msg);
	}
  else ship(msg);


  } else if (data.type == 2){
      //handle attached/detached
      //TODO if (plugin = videoroom)   - gestire i vari plugin

	    //store opaqueID and handleID
      if (data.event.opaque_id && data.event.name=='attached'){

        //Creo tripla Opaque_ID -> Session_ID -> Handle_ID
        triples = {subject: data.event.opaque_id, predicate: data.session_id, object: data.handle_id};
        db.put(triples);
        ship(msg);


  	/*query = { subject: data.event.opaque_id, predicate: "related to" }	//stampa tutti gli handle associati all'opaque
		this.db.get(query, function(err, triples) {
		for (i=0;i<triples.length;i++)
			console.log("handle n ",i,": ",triples[i].object);    //stampa solo un campo - triples è 1 array
		//console.log(triples)					      //stampa la tripla relativa all'opaque inserito
		})*/

	/*	query = {object: data.handle_id}			//stampa opaque associato all'handle_id
		this.db.get(query, function(err,triples){
	        console.log("Handle: ",data.handle_id," - Opaque: ",triples [0].subject);
		})*/

}	else if (data.event.name == "detached") {
  //handle rimosso - se l'opaqueID non ha più handle associati è uscito dalla room

    data.correlation = {opaque: null, quitted : null};

    //elimina la tripla Opaque_ID -> Session_id -> Handle_ID
    //TODO potrei usare una variabile per salvare l'opaqueID

    //TODO metti una GET invece della Search

    db.get({predicate: data.session_id, object: data.handle_id}, function(err,solutions){
      data.correlation.opaque = solutions[0].subject;
      db.del(solutions[0], function (err){
           if(err) console.log(err)
              db.search ({subject: solutions[0].subject, predicate:data.session_id}, function(err,list){
                  if (err){ console.log(err);}
                  else if (list.length==0){
                        // se non ci sono più handle associati all'utente cancella la tripla Opaque -> publishingID -> room
                        db.get({subject: solutions[0].subject}, function(err,results){
                        if (err) console.log(err);
                        else db.del(results[0],function(err){
                              if (err) {console.log(err);}
                              data.correlation.quitted= "yes";
                              ship(msg);
                            })
                        })
                  } else ship(msg);
            })
        })
      })

    /*query = { object: data.handle_id }		//stampa la tripla relativa all'handle detached
		this.db.get(query, function(err, triples) {
  		console.log(triples)
		})

    stream = this.db.searchStream([{ subject: x, object: data.handle_id }]);	//equivalente alla search ma con Stream
    stream.on('data', function(triple) {
        console.log(JSON.stringify(triple))
    })*/
	} else ship(msg);

  } else if (data.type == 128) {

    ship(msg);

    // transports, no session_id native
        // store IP for Session for transport lookups
      /*  if(data.event.id && data.event.data.ip && data.event.data.port) {
		this.db.get(data.event.id).put({ip: data.event.data.ip,port: data.event.data.port}, function() {}); //manca replace per ffff
        }
        if (!data.session_id && data.event.id) {			//TODO
                        var getsession = db.get("sess_"+data.event.id);
                        if (getsession && getsession.session_id != undefined) {
                                data.session_id = getsession.session_id;
                        };
        }*/

  } else if (data.type == 32) {
    //media message
    ship(msg);

    /*  if (!data.session_id) return;
        // lookup of media transport IP - ignoring handle_id or grabbing them all
        if (this.db) {
          if (data.session_id && this.db.get(data.session_id)) {		//i messaggi di tipo MEDIA non hanno il transportID
            data.ip = {
                ip: this.db.get(data.session_id).get(transport_id).ip,
                port: this.db.get(data.session_id).get(transport_id).port
            };
          }
        }*/
  } else if (data.type == 64) {
		//plugin message

      data.correlation = {opaque : null};
// TODO if plugin is videoroom

	if(data.event.data.event == "joined" ){
    //l'user proprietario dell'handle è entrato nella room data.event.data.room con displayname data.event.data.display
    // cerca l'opaque associato all'handle


	    db.search([{subject: x=db.v('x'),predicate:data.session_id, object: data.handle_id}], function (err,solutions){
      //crea tripla OpaqueID -> publishingID -> Room (displayname)
      data.correlation.opaque = solutions[0].x;
			 triples = [{subject: solutions[0].x, predicate: data.event.data.id, object: data.event.data.room, "displayname": data.event.data.display}];
       db.put(triples);
       ship(msg);
    });


	} else if (data.event.data.event == "published"){
		//l'user con publisher id = data.event.data.id sta pubblicando (è un publisher) nella room data.event.data.room tramite l'handle = handle_id

		// crea tripla OpaqueID -> "publisher" -> Room (handle_id)
			db.search([{subject: x=db.v('x'), predicate: data.session_id, object: data.handle_id}], function (err,solutions){
			     triples = [{subject: solutions[0].x, predicate: "publisher", object: data.event.data.room, "handle":data.handle_id}];
			     try {
                db.put(triples, function(err){
                data.correlation.opaque = solutions[0].x;
			  //      WhoIsPublishing();
                ship(msg);
                });
          } catch (err) {console.log(err)}
      });

  } else if(data.event.data.event == "unpublished"){
//l'user con publisher id = data.event.data.id non sta + pubblicando (rimuovi da publisher) nella room data.event.data.room
//elimina la tripla OpaqueID -> "publisher" -> Room   (OpaqueID viene recuperato tramite l'handle)
//elimina gli utenti sottoscritti a all'utente (OpaqueID -> "subscribed" -> OpaqueID)

    //cerco il "proprietario" dell'handle del messaggio e cancello la tripla Opaque -> publisher -> room
    db.search({subject:db.v('x'), predicate: data.session_id, object: data.handle_id}, function(err,solutions){
			triples = {subject: solutions[0].x, predicate: "publisher", object: data.event.data.room};
			try {
           db.del(triples, function(err) {  //TODO la tripla get che viene dopo potrei inserirla nella delete, per essere sicuro di quando viene chiamato ship
               data.correlation.opaque = solutions[0].x;
        //     WhoIsPublishing();
             });
             // cerco gli utenti che erano sottoscritti al mittente e cancello le triple relative (opaque -> subscribed-> opaques)
           db.get({predicate:"subscribed",object:solutions[0].x},function(err,list){
                  for(i=0;i<list.length;i++){
                      db.del(list[i]);    //cancello chi si era sottoscritto a quell'utente
                   }
          //  WhoIsSubscribed();
              ship(msg);
            });
          }
			catch (err) {console.log(err)}   //il catch qui è corretto o va dopo il primo err???
  });

	} else if (data.event.data.event == "unsubscribed"){
    //l'utente "proprietario" dell'handle_id si sta disiscrivendo dall'utente con publishingID = feed
    //cancello la relazione opaqueID -> subscribed -> opaqueID


    //cerco l'opaque di chi ha inviato unsubscribed (x) e l'opaque dell'utente da cui si sta disiscrivendo (y)
    //cancello la relazione x -> subscribed -> y
    db.search([{subject:db.v('x'), predicate: data.session_id, object: data.handle_id},
              {subject:db.v('y'), predicate:data.event.data.feed, object: data.event.data.room}], function(err,solutions){
                triples = {subject:solutions[0].x, predicate: "subscribed", object: solutions[0].y};
                db.del(triples, function(err){
                  if(err)
                    console.log(err);
                //  WhoIsSubscribed();
                  ship(msg);
                });
            });

  }
  else if (data.event.data.event == "subscribing"){
	//l'user con id= data.event.data..private_id si sta sottoscrivendo all'utente con publisher id = data.event.data..feed nella stanza data.event.data..room
	//TODO mi serve? può arrivare subscribing e non subscribed???
  ship(msg);

	} else if (data.event.data.event == "subscribed"){
		//l'handle dell'utente con publisher id data.event.data.feed è stato collegato all'handle con id = data.handle_id

    //TODO con materialized costruisco direttamente la tripla come risultato, come posso usarla????
    // triples = results[0] ??
    //db.put(triples)
/*    db.search([{subject: db.v('x'), predicate: data.session_id, object: data.handle_id},
				{subject: db.v('y'), predicate: data.event.data.feed, object: data.event.data.room}],
        {materialized: {subject:db.v('x'),predicate:"subscribed", object: db.v('y')}
      }, function(err,results){
      console.log(results)
    });*/

    //cerco l'utente "proprietario" dell'handle contenuto nel messaggio (x) e l'utente a cui si è sottoscritto (y)
    //Creo tripla OpaqueID (x) -> subscribed (to) -> OpaqueID (y) + (handle)

    db.search([{subject: db.v('x'), predicate: data.session_id, object: data.handle_id},
				{subject: db.v('y'), predicate: data.event.data.feed, object: data.event.data.room}],function(err,solutions){
			triples = [{subject: solutions[0].x, predicate:"subscribed", object: solutions[0].y,"handle":data.handle_id}];
			db.put(triples,function(err){
          //WhoIsSubscribed()
        });
      ship(msg);
    });
	} else ship(msg);
} else ship(msg);


/*  if(data.session_id) data.session_id = data.session_id.toString();	//TODO che fa questa parte???
	if(data.handle_id) data.handle_id = data.handle_id.toString();
	if(data.sender) data.sender = data.sender.toString();
  if(data.type) data.type = data.type.toString();
  if(data.event && data.even.transport) { if (typeof data.event.transport === "string") { data.event.transport = { transport: data.event.transport } } }
	if(data.plugindata && data.plugindata.data && data.plugindata.data.result) {
		if (typeof data.plugindata.data.result === "string") { data.plugindata.data.result = { result: data.plugindata.data.result } }
	}*/
};

exports.create = function() {
  return new FilterAppJanus();
};
