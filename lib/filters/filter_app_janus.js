var base_filter = require('../lib/base_filter'),
  dirty = require('dirty'),
  gun = require ('gun'),
  util = require('util'),
  levelup = require('level'),
  level = require('level-browserify'),
  levelgraph = require('levelgraph'),
  /*session,
  opaqueID,
  handle,
  handle_set,
  user,*/
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
    else {for (i=0;i<solutions.length;i++){
        console.log("Publisher numero ",i,": ",solutions[i].z)
       /*db.get({predicate:"subscribed",object:temp},function(err,results){
          console.log("Lista subscriber  di",temp," :",results);
        });*/
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
  }else{
    if (solutions.length==0){
		    console.log("\nNessun viewer nella room ",room);
			   }
    else {for (i=0;i<solutions.length;i++){
        console.log("Viewer numero ",i,": ",solutions[i].z)
       /*db.get({predicate:"subscribed",object:temp},function(err,results){
          console.log("Lista subscriber  di",temp," :",results);
        });*/
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

	db = levelgraph(level("210607"));

  //handle = session.put('handle');
//	user = this.db.get('user');
//	handle_set = this.db.get('handle_set');

 callback();
};


FilterAppJanus.prototype.process = function(data) {

var obj = JSON.parse(data.message);	//se gli eventi sono	 raggruppati in janus (grouping= yes in janus.event.config allora message è 1 array e va modificato il parsing -> [0] alla fine e ciclare sul numero di json ricevuti

// Process MEETECHO JANUS Events
  if (obj.type == 1) {

// session create/destroy
        // store session_id		//TODO

	if (obj.event.name == "created" && obj.session_id){


	} else if (obj.event.name == "destroyed") {
		//per il momento non fare nulla
	}

  } else if (obj.type == 2){
      //handle attached/detached


	//TODO if (plugin = videoroom)   - gestire i vari plugin

	 //store opaqueID and handleID
	  if (obj.event.opaque_id && obj.event.name=='attached'){

        //Creo tripla Opaque_ID -> Session_ID -> Handle_ID
        triples = {subject: obj.event.opaque_id, predicate: obj.session_id, object: obj.handle_id};
        db.put(triples,function(err){
        if (err)
          console.log(err)
        });

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


var op;
    //elimina la tripla Opaque_ID -> Session_id -> Handle_ID
    //TODO una volta rimosso un handle devo controllare se quell'utente ha ancora handle associati, in caso contrario è uscito dalla room
       db.get({predicate: obj.session_id, object: obj.handle_id}, function(err,solutions){
              db.del(solutions[0], function (err){
              if(err)
                console.log(err)
              else db.search ({subject: solutions[0].subject, predicate:obj.session_id}, function(err,list){
                if (err){
                  console.log(err);
                } else if (list.length==0){
                    // se non ci sono handle associati all'utente cancella la tripla Opaque -> publishingID -> room
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

    /*query = { object: obj.handle_id }		//stampa la tripla relativa all'handle detached
		this.db.get(query, function(err, triples) {
  		console.log(triples)
		})

    stream = this.db.searchStream([{ subject: x, object: obj.handle_id }]);	//equivalente alla search ma con Stream
    stream.on('data', function(triple) {
        console.log(JSON.stringify(triple))
    })*/

	}

  } else if (obj.type == 128) {
/* TODO mi serve???


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
    //media message

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

// TODO if plugin is videoroom
// TODO provare a cercare per displayname

	if(obj.event.data.event == "joined" ){

	  // cerca l'opaque associato all'handle
		db.search([{subject: x=db.v('x'),predicate:obj.session_id, object: obj.handle_id}], function (err,solutions){
      //crea tripla OpaqueID -> publishingID -> Room (displayname)
			triples = [{subject: solutions[0].x, predicate: obj.event.data.id, object: obj.event.data.room, "displayname": obj.event.data.display}];
			try {
        	db.put(triples,function(err){ });
      } catch (err) {console.log(err)}
		});
	} else if (obj.event.data.event == "published"){
		//l'user con publisher id = obj.event.data.id sta pubblicando (è un publisher) nella room obj.event.data.room

		// crea tripla OpaqueID -> "publisher" -> Room
			db.search([{subject: x=db.v('x'), predicate: obj.session_id, object: obj.handle_id}], function (err,solutions){
			triples = [{subject: solutions[0].x, predicate: "publisher", object: obj.event.data.room}];
			try {
          db.put(triples, function(err){
			    WhoIsPublishing();
        });
      } catch (err) {console.log(err)}
		});
	} else if(obj.event.data.event == "unpublished"){
//l'user con publisher id = obj.event.data.id non sta + pubblicando (rimuovi da publisher) nella room obj.event.data.room
//elimina la tripla OpaqueID -> "publisher" -> Room   (OpaqueID viene recuperato tramite l'handle)
//elimina gli utenti sottoscritti a all'utente (OpaqueID -> "subscribed" -> OpaqueID)

    //cerco il "proprietario" dell'handle del messaggio e cancello la tripla Opaque -> publisher -> room
    db.search({subject:db.v('x'), predicate: obj.session_id, object: obj.handle_id}, function(err,solutions){
			triples = [{subject: solutions[0].x, predicate: "publisher", object: obj.event.data.room}];
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
	} else if (obj.event.data.event == "unsubscribed"){
    //l'utente "proprietario" dell'handle_id si sta disiscrivendo dall'utente con publishingID = feed
    //cancello la relazione opaqueID -> subscribed -> opaqueID

    //cerco l'opaque di chi ha inviato unsubscribed (x) e l'opaque dell'utente da cui si sta disiscrivendo (y)
    //cancello la relazione x -> subscribed -> y
    db.search([{subject:db.v('x'), predicate: obj.session_id, object: obj.handle_id},
              {subject:db.v('y'), predicate:obj.event.data.feed, object: obj.event.data.room}], function(err,solutions){
                triples = {subject:solutions[0].x, predicate: "subscribed", object: solutions[0].y};
                db.del(triples, function(err){
                  if(err)
                    console.log(err);
                  WhoIsSubscribed();
                });
              });

  }
  else if (obj.event.data.event == "subscribing"){
	//l'user con id= obj.event.data.private_id si sta sottoscrivendo all'utente con publisher id = obj.event.data.feed nella stanza obj.event.data.room
	//TODO mi serve? può arrivare subscribing e non subscribed???
	} else if (obj.event.data.event == "subscribed"){
		//l'handle dell'utente con publisher id obj.event.data.feed è stato collegato all'handle con id = obj.handle_id

/*db.search([{  } {  }], {
    materialized: {
      subject: db.v("a"),
      predicate: "friend-of-a-friend",
      object: db.v("b")
    }
  }, function(err, results) {
  });*/

    //cerco l'utente "proprietario" dell'handle contenuto nel messaggio (x) e l'utente a cui si sta sottoscrivendo (y)
    //Creo tripla OpaqueID (x) -> subscribed (to) -> OpaqueID (y) + (handle)

    //TODO con materialized costruisco direttamente la tripla come risultato, come posso usarla????
    // triples = results[0] ??
    //db.put(triples)
/*    db.search([{subject: db.v('x'), predicate: obj.session_id, object: obj.handle_id},
				{subject: db.v('y'), predicate: obj.event.data.feed, object: obj.event.data.room}],
        {materialized: {subject:db.v('x'),predicate:"subscribed", object: db.v('y')}
      }, function(err,results){
      console.log(results)
    });*/



    db.search([{subject: db.v('x'), predicate: obj.session_id, object: obj.handle_id},
				{subject: db.v('y'), predicate: obj.event.data.feed, object: obj.event.data.room}],function(err,solutions){
			triples = [{subject: solutions[0].x, predicate:"subscribed", object: solutions[0].y,"handle":obj.handle_id}];
			try {
			    db.put(triples,function(err){
          WhoIsSubscribed()
      });
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
