var abstract_udp = require('./abstract_udp'),
  hepjs = require('hep-js'),
  util = require('util');

function OutputHep() {
  abstract_udp.AbstractUdp.call(this);
  this.mergeConfig({
    name: 'Udp',
  });
  this.mergeConfig(this.serializer_config());
  this.mergeConfig({
    name: 'HEP/EEP Server',
    optional_params: ['hep_id', 'hep_pass', 'hep_cid', 'hep_type'],
    default_values: {
      host: '127.0.0.1',
      port: 9060,
      hep_id: '2001',
      hep_pass: 'MyHep',
      hep_cid: '#{rcinfo.correlation_id}',
      hep_type: '#{rcinfo.payload_type}',
    },
  });
}

util.inherits(OutputHep, abstract_udp.AbstractUdp);

OutputHep.prototype.preHep = function(data) {

  // IF HEP JSON
  if (data.rcinfo && data.payload) {
	data.rcinfo.captureId = this.hep_id;
	data.rcinfo.capturePass = this.hep_pass;
	return hepjs.encapsulate(data.payload,data.rcinfo);
  }

  // Default to static type

  var hep_proto = {
    'type': 'HEP',
    'version': 3,
    'payload_type': this.hep_type ? this.hep_type : 100,
    'captureId': this.hep_id ? this.hep_id : 2001,
    'capturePass': this.hep_pass ? this.hep_pass : 'paStash',
    'ip_family': 2
  };

  var datenow = (new Date()).getTime();
	hep_proto.time_sec = Math.floor(datenow / 1000);
	hep_proto.time_usec = datenow - (hep_proto.time_sec * 1000);

	// Build HEP3 w/ null network parameters - TBD configurable
	hep_proto.ip_family = 2;
  	hep_proto.protocol = 6;
  	hep_proto.srcIp = '127.0.0.1';
  	hep_proto.dstIp = '127.0.0.1';
  	hep_proto.srcPort = 0;
  	hep_proto.dstPort = 0;
  	// pair correlation id from pattern
		hep_proto.correlation_id = this.hep_cid;
	if (hep_proto.correlation_id !== '') {
			// Pack HEP3
			return hepjs.encapsulate(data,hep_proto);
	} else {
	    return false;
 	}
};

OutputHep.prototype.formatPayload = function(data, callback) {
  callback(new Buffer(this.serialize_data(this.preHep(data))));
};

OutputHep.prototype.to = function() {
  return 'HEP udp to ' + this.host + ':' + this.port;
};

exports.create = function() {
  return new OutputHep();
};
