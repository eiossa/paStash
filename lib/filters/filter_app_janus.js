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

//SOLUZIONE CON SEARCH
 /*db.search([{subject: db.v('z'),predicate: "publisher", object:room}],function(err,solutions){
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
})*/

//SOLUZIONE CON GET
 db.get({predicate: "publisher", object:room},function(err,list){
  if (err){
	   console.log(err);
  }else{
    if (list.length==0){
		    console.log("\nNessun publisher nella room ",room);
			   }
    else {
     for (i=0;i<list.length;i++){
          console.log("Publisher numero ",i,": ",list[i].subject)
      }
      //console.log(list);
    }
  }
});
}

////utenti sottoscritti nella stanza
function WhoIsSubscribed(room){
 room = 1234;

 //TODO sostituire search con GET

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

	db = levelgraph(level("210902"));

 callback();
};


FilterAppJanus.prototype.process = function(data) {


/*  try { data = JSON.parse(data.message); }
  catch(e) {//console.log("NO PARSING");
            data = data; }*/

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

//console.log(data);

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

  //if (data.event.plugin == "janus.plugin.videoroom"){


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

    //TODO diversificare per i vari plugin????
    data.correlation = {opaque: null, quitted : null};

    //cerco l'opaqueID associato all'handle rimosso e elimino la tripla Opaque_ID -> Session_id -> Handle_ID
    db.get({predicate: data.session_id, object: data.handle_id}, function(err,solutions){
      op = solutions[0].subject;
      data.correlation.opaque = op;
      db.del(solutions[0], function (err){
           if(err) console.log(err)
           //Cerca gli handle associati all'utente identificato da opaqueID all'interno della sessione sessionID
              db.search ({subject: op, predicate:data.session_id}, function(err,list){
                  if (err){ console.log(err);}
                  else if (list.length==0){
                        // se non ci sono più handle associati all'utente (l'utente è uscito dalla room)
                        //cancella la tripla Opaque -> publishingID -> room   //TODO cancello tutte le triple con subject: opaqueID ....è giusto???
                        db.get({subject: op}, function(err,results){
                          if (err) console.log(err);
                          else if (results.length!=0){
                            for(i=0;i<results.lenght;i++)
                              db.del(results[i],function(err){
                                if (err) {console.log(err);}
                              });
                          data.correlation.quitted= "yes";
                          ship(msg);
                          }
                        });
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

//}
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


    data.correlation = {opaque : null, subscribedto : null}
    db.get({predicate: data.session_id, object: data.handle_id}, function(err,solutions){
    if(solutions[0] != undefined){
      data.correlation.opaque = solutions[0].subject;
    /*  db.get({subject: solutions[0].subject, predicate: "subscribed"}, function (err,solutions){
       for(i=0;i<solutions.length;i++)
          console.log(solutions[i].handle);
      });*/
    }
    ship(msg);
    });


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

if (data.event.plugin == "janus.plugin.videoroom"){

      data.correlation = {opaque : null, publisher: ""};

	if(data.event.data.event == "joined" ){
    //l'user proprietario dell'handle data.handle.id è entrato nella room data.event.data.room con displayname data.event.data.display

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
                data.correlation.publisher = "yes";
			          //WhoIsPublishing();
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
               data.correlation.publisher = "no";
        //     WhoIsPublishing();
             });
             // cerco gli utenti che erano sottoscritti al mittente e cancello le triple relative (opaque -> subscribed-> opaques)
             //TODO per questa operazione non posso settare nulla nel JSON, ma lato ES dovrei rimuovere le connessioni quando arriva unpublished
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
                data.correlation.opaque = solutions[0].x;
                data.correlation.unsubscribedfrom = solutions[0].y;
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
        data.correlation.opaque = solutions[0].x;
        data.correlation.subscribedto = solutions[0].y;
			db.put(triples,function(err){
          //WhoIsSubscribed()
        });
      ship(msg);
    });
	} else ship(msg);
} else if (data.event.plugin == "janus.plugin.streaming"){

    data.correlation = {opaque : null};

    if(data.event.data.status == "starting"){
          //l'user proprietario dell'handle data.handle.id ha cominciato la visione del mountpoint con id = event.data.id

          // cerca l'opaque associato all'handle
      	    db.search([{subject: x=db.v('x'),predicate:data.session_id, object: data.handle_id}], function (err,solutions){
            //crea tripla OpaqueID -> "viewing"" -> MountPoint (handle)
            data.correlation.opaque = solutions[0].x;
      			 triples = [{subject: solutions[0].x, predicate:"viewing", object: data.event.data.id, "handle_id": data.handle_id}];
             db.put(triples);
             ship(msg);
          });
    } else if(data.event.data.status == "stopping"){

       db.search({subject: x=db.v('x'), predicate:data.session_id, object: data.handle_id}, function (err,solutions){
            triples = {subject: solutions[0].x, predicate:"viewing", object: data.event.data.id};
            data.correlation.opaque = solutions[0].x;
            try{
              db.del(triples,function (err){});
            } catch (err) {console.log(err)}
        ship(msg);
      });
    } else if(data.event.data.status == "switching"){
    //l'utente proprietario dell'handle data.handle.id ha switchato da un mountID ad 1 altro usando lo stesso handle
    // cancello la relazione di tipo 2 (opaqueID -> "viewing" -> mountID) esistente e ne creo 1 altra con diverso mountID

    //TODO TESTARE, non la posso testare con la demo dello streaming

    //Cerco l'opaqueID associato all'handle_id all'interno della sessione e prelevo tutte le triple opaqueID->viewing->mountID,
    //quella con handle_id = data.handle_id è quella che mi interessa e la cancello
    db.search({subject: x=db.v('x'), predicate:data.session_id, object: data.handle_id}, function (err,solutions){
        var op = solutions[0].x;
        data.correlation.opaque = op;
        db.get({subject: solutions[0].x, predicate: "viewing"}, function(err,list){
          if(list.length!=0){
              i=0;
              var trovato = false;
              while (list[i] && !trovato){
                if (list[i].handle_id == data.handle_id){
                    trovato = true;
                    db.del(list[i])
                    }
                else i++;
              }
          }
        });
        //Creo ed inserisco la nuova tripla: opaqueID -> "viewing" -> mountID
        triples = {subject: op, predicate: "viewing", object: data.event.data.id};
        db.put(triples);
      });



    } else ship(msg);
  } else ship (msg);
} else ship(msg);

};

exports.create = function() {
  return new FilterAppJanus();
};
