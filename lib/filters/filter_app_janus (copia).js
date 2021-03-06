
var base_filter = require('../lib/base_filter'),
  gun = require ('gun'),
  util = require('util'),
  levelup = require('level'),
  level = require('level-browserify'),
  levelgraph = require('levelgraph'),
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

//	this.db = gun();

	//this.db = gun({file: '/home/enrico/Scrivania/prova.json'});		//salvataggio su file del DB

	//this.db = levelup('./mydb');

	db = levelgraph(level("050701"));

  //handle = session.put('handle');
//	user = this.db.get('user');
//	handle_set = this.db.get('handle_set');

 callback();
};


FilterAppJanus.prototype.process = function(data) {



//TODO gestire gli array -> grouping yes in janus

//se gli eventi sono	 raggruppati in janus (grouping= yes in janus.event.config allora message è 1 array e va modificato il parsing -> [0] alla fine e ciclare sul numero di json ricevuti
  //data = JSON.parse(data.message);

  data.message = JSON.parse(data.message);
  //OLD     var obj = JSON.parse(data.message);

//data.message.correlation = "TEST";
// Process MEETECHO JANUS Events
  if (data.message.type == 1) {

// session create/destroy
        // store session_id

	if (data.message.event.name == "created" && data.message.session_id){


	} else if (data.message.event.name == "destroyed") {
		//per il momento non fare nulla
	}

  } else if (data.message.type == 2){
      //handle attached/detached

	//TODO if (plugin = videoroom)   - gestire i vari plugin

	 //store opaqueID and handleID
      if (data.message.event.opaque_id && data.message.event.name=='attached'){


        //Creo tripla Opaque_ID -> Session_ID -> Handle_ID
        triples = {subject: data.message.event.opaque_id, predicate: data.message.session_id, object: data.message.handle_id};
        db.put(triples,function(err){
        if (err)
          console.log(err)
        });

		/*query = { subject: data.message.event.opaque_id, predicate: "related to" }	//stampa tutti gli handle associati all'opaque
		this.db.get(query, function(err, triples) {
		for (i=0;i<triples.length;i++)
			console.log("handle n ",i,": ",triples[i].object);    //stampa solo un campo - triples è 1 array
		//console.log(triples)					      //stampa la tripla relativa all'opaque inserito
		})*/

	/*	query = {object: data.message.handle_id}			//stampa opaque associato all'handle_id
		this.db.get(query, function(err,triples){
	        console.log("Handle: ",data.message.handle_id," - Opaque: ",triples [0].subject);
		})*/

}	else if (data.message.event.name == "detached") {
  //handle rimosso - se l'opaqueID non ha più handle associati è uscito dalla room

//TODO creare un campo JSON
//  data.message.correlation = {a: "ciao", b: "prova"}
//  console.log(data.message.correlation);

    //elimina la tripla Opaque_ID -> Session_id -> Handle_ID
    //TODO potrei usare una variabile per salvare l'opaqueID
       db.get({predicate: data.message.session_id, object: data.message.handle_id}, function(err,solutions){
              db.del(solutions[0], function (err){
              if(err)
                console.log(err)
              else db.search ({subject: solutions[0].subject, predicate:data.message.session_id}, function(err,list){
                if (err){
                  console.log(err);
                } else if (list.length==0){
                    // se non ci sono più handle associati all'utente cancella la tripla Opaque -> publishingID -> room
                    db.get({subject: solutions[0].subject}, function(err,results){
                      if (err)
                        console.log(err)
                      else
                        db.del(results[0],function(err){
                          if (err) console.log(err)
                        })
                    })
                  }
                  })
              })
        })

    /*query = { object: data.message.handle_id }		//stampa la tripla relativa all'handle detached
		this.db.get(query, function(err, triples) {
  		console.log(triples)
		})

    stream = this.db.searchStream([{ subject: x, object: data.message.handle_id }]);	//equivalente alla search ma con Stream
    stream.on('data', function(triple) {
        console.log(JSON.stringify(triple))
    })*/

	}

  } else if (data.message.type == 128) {
/* TODO mi serve???


    // transports, no session_id native
        // store IP for Session for transport lookups
        if(data.message.event.id && data.message.event.data.ip && data.message.event.data.port) {
		this.db.get(data.message.event.id).put({ip: data.message.event.data.ip,port: data.event.data.port}, function() {}); //manca replace per ffff
        }
       /* if (!data.message.session_id && data.message.event.id) {			//TODO
                        var getsession = db.get("sess_"+data.message.event.id);
                        if (getsession && getsession.session_id != undefined) {
                                data.message.session_id = getsession.session_id;
                        };
        }*/

  } else if (data.message.type == 32) {
    //media message

      if (!data.message.session_id) return;
        // lookup of media transport IP - ignoring handle_id or grabbing them all
      /*  if (this.db) {
          if (data.message.session_id && this.db.get(data.message.session_id)) {		//i messaggi di tipo MEDIA non hanno il transportID
            data.message.ip = {
                ip: this.db.get(data.message.session_id).get(transport_id).ip,
                port: this.db.get(data.message.session_id).get(transport_id).port
            };
          }
        }*/
  } else if (data.message.type == 64) {
		//plugin message

// TODO if plugin is videoroom

	if(data.message.event.data.event == "joined" ){
    //l'user proprietario dell'handle è entrato nella room data.message.event.data.room con displayname data.message.event.data.display


	  // cerca l'opaque associato all'handle
		db.search([{subject: x=db.v('x'),predicate:data.message.session_id, object: data.message.handle_id}], function (err,solutions){
      //crea tripla OpaqueID -> publishingID -> Room (displayname)
			triples = [{subject: solutions[0].x, predicate: data.message.event.data.id, object: data.message.event.data.room, "displayname": data.message.event.data.display}];
			try {
        	db.put(triples,function(err){ });
      } catch (err) {console.log(err)}
		});
	} else if (data.message.event.data.event == "published"){
		//l'user con publisher id = data.message.event.data.id sta pubblicando (è un publisher) nella room data.message.event.data.room tramite l'handle = handle_id

		// crea tripla OpaqueID -> "publisher" -> Room (handle_id)
			db.search([{subject: x=db.v('x'), predicate: data.message.session_id, object: data.message.handle_id}], function (err,solutions){
			triples = [{subject: solutions[0].x, predicate: "publisher", object: data.message.event.data.room, "handle":data.message.handle_id}];
			try {
          db.put(triples, function(err){
			    WhoIsPublishing();
        });
      } catch (err) {console.log(err)}
		});
	} else if(data.message.event.data.event == "unpublished"){
//l'user con publisher id = data.message.event.data.id non sta + pubblicando (rimuovi da publisher) nella room data.message.event.data.room
//elimina la tripla OpaqueID -> "publisher" -> Room   (OpaqueID viene recuperato tramite l'handle)
//elimina gli utenti sottoscritti a all'utente (OpaqueID -> "subscribed" -> OpaqueID)


    //cerco il "proprietario" dell'handle del messaggio e cancello la tripla Opaque -> publisher -> room
    db.search({subject:db.v('x'), predicate: data.message.session_id, object: data.message.handle_id}, function(err,solutions){
			triples = [{subject: solutions[0].x, predicate: "publisher", object: data.message.event.data.room}];
			try {
           db.del(triples[0], function(err) {
             WhoIsPublishing();
             });
             // cerco gli utenti che erano sottoscritti al mittente e cancello le triple relative (opaque -> subscribed-> opaques)
           db.get({predicate:"subscribed",object:solutions[0].x},function(err,list){
                  for(i=0;i<list.length;i++){
                      db.del(list[i]);    //cancello chi si era sottoscritto a quell'utente
                   }
            WhoIsSubscribed();
            });
          }
			catch (err) {console.log(err)}   //il catch qui è corretto o va dopo il primo err???
		});
	} else if (data.message.event.data.event == "unsubscribed"){
    //l'utente "proprietario" dell'handle_id si sta disiscrivendo dall'utente con publishingID = feed
    //cancello la relazione opaqueID -> subscribed -> opaqueID


    //cerco l'opaque di chi ha inviato unsubscribed (x) e l'opaque dell'utente da cui si sta disiscrivendo (y)
    //cancello la relazione x -> subscribed -> y
    db.search([{subject:db.v('x'), predicate: data.message.session_id, object: data.message.handle_id},
              {subject:db.v('y'), predicate:data.message.event.data.feed, object: data.message.event.data.room}], function(err,solutions){
                triples = {subject:solutions[0].x, predicate: "subscribed", object: solutions[0].y};
                db.del(triples, function(err){
                  if(err)
                    console.log(err);
                  WhoIsSubscribed();
                });
              });

  }
  else if (data.message.event.data.event == "subscribing"){
	//l'user con id= data.message.event.data..private_id si sta sottoscrivendo all'utente con publisher id = data.message.event.data..feed nella stanza data.message.event.data..room
	//TODO mi serve? può arrivare subscribing e non subscribed???
	} else if (data.message.event.data.event == "subscribed"){
		//l'handle dell'utente con publisher id data.message.event.data.feed è stato collegato all'handle con id = data.message.handle_id

    //TODO con materialized costruisco direttamente la tripla come risultato, come posso usarla????
    // triples = results[0] ??
    //db.put(triples)
/*    db.search([{subject: db.v('x'), predicate: data.message.session_id, object: data.message.handle_id},
				{subject: db.v('y'), predicate: data.message.event.data.feed, object: data.message.event.data.room}],
        {materialized: {subject:db.v('x'),predicate:"subscribed", object: db.v('y')}
      }, function(err,results){
      console.log(results)
    });*/

    //cerco l'utente "proprietario" dell'handle contenuto nel messaggio (x) e l'utente a cui si è sottoscritto (y)
    //Creo tripla OpaqueID (x) -> subscribed (to) -> OpaqueID (y) + (handle)

    db.search([{subject: db.v('x'), predicate: data.message.session_id, object: data.message.handle_id},
				{subject: db.v('y'), predicate: data.message.event.data.feed, object: data.message.event.data.room}],function(err,solutions){
			triples = [{subject: solutions[0].x, predicate:"subscribed", object: solutions[0].y,"handle":data.message.handle_id}];
			try {
			    db.put(triples,function(err){
          WhoIsSubscribed()
      });
			}
			catch (err) {console.log(err)}
		});
	}
}


/*  if(data.message.session_id) data.message.session_id = data.message.session_id.toString();	//TODO che fa questa parte???
	if(data.message.handle_id) data.message.handle_id = data.message.handle_id.toString();
	if(data.message.sender) data.message.sender = data.message.sender.toString();
  if(data.message.type) data.message.type = data.message.type.toString();
  if(data.message.event && data.message.even.transport) { if (typeof data.message.event.transport === "string") { data.message.event.transport = { transport: data.message.event.transport } } }
	if(data.message.plugindata && data.message.plugindata.message.data && data.message.plugindata.message.data.message.result) {
		if (typeof data.message.plugindata.message.data.message.result === "string") { data.message.plugindata.message.data.message.result = { result: data.message.plugindata.message.data.message.result } }
	}*/

  return data;
};

exports.create = function() {
  return new FilterAppJanus();
};
