HEP/EEP output plugin
---

Status : experimental


This plugin is used to send correlated data to a collector supporting the [HEP](http://hep.sipcapture.org) encapsulation protocol. It accepts dynamic or static settings depending on received data.

#### Static Example:
Config using url: ``output://hep://localhost:9060``

Config using logstash format:
```
    input {
      file {
        path => "/var/log/kamailio/kamailio.log"
      }
    }

    filter {
          regex {
            regex => /ID=([^&]\\S*)/
            fields => [hep_cid]
          }
        }

    output {
      hep {
        host => localhost
        port => 9060
        hep_id => 2022
        hep_tyep => 100
      }
    }
```

#### Dynamic Example:
When the received data is already formatted in HEP JSON (rcinfo,payload) HEPIPE will dynamically manage types and 

Config using logstash format:
```
    input {
      esl {}
    }

    filter {
          esl {}
        }

    output {
      hep {
        host => localhost
        port => 9060
      }
    }
```

Parameters:

* ``host``: ip of the HEP server.
* ``port``: port of the HEP server.
* ``hep_id`` to change the HEP id of the stream. Default value: ``2001``.
* ``hep_pass``: to enable HEP authentication support. Default : none
* ``hep_cid``: to insert a (required) correaltion id, interpolated from string. Default : none.


