import dpkt
import os
from ryu.base import app_manager
from ryu.controller import ofp_event
from ryu.controller.handler import MAIN_DISPATCHER, CONFIG_DISPATCHER, set_ev_cls
from ryu.ofproto import ofproto_v1_3
from ryu.lib.packet import packet
from ryu.lib.packet import ethernet

class SimpleSwitch(app_manager.RyuApp):
    OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]

    def __init__(self, *args, **kwargs):
        super(SimpleSwitch, self).__init__(*args, **kwargs)
        # Initialize PCAP file for writing
        self.pcap_file_path = 'traffic_capture.pcap'
        self.pcap_writer = None
        self.init_pcap()

    def init_pcap(self):
        """Initialize the PCAP file and writer."""
        try:
            # Open the file in append and binary mode
            self.pcap_writer = open(self.pcap_file_path, 'wb')
            # Write PCAP global header
            pcap_hdr = dpkt.pcap.Writer(self.pcap_writer)
            self.pcap_hdr = pcap_hdr
        except Exception as e:
            self.logger.error(f"Failed to initialize PCAP file: {e}")

    def close_pcap(self):
        """Close the PCAP file."""
        if self.pcap_writer:
            self.pcap_writer.close()

    @set_ev_cls(ofp_event.EventOFPSwitchFeatures, CONFIG_DISPATCHER)
    def switch_features_handler(self, ev):
        """Install table-miss flow entry."""
        datapath = ev.msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        match = parser.OFPMatch()
        actions = [parser.OFPActionOutput(ofproto.OFPP_CONTROLLER, ofproto.OFPCML_NO_BUFFER)]
        self.add_flow(datapath, 0, match, actions)

    def add_flow(self, datapath, priority, match, actions):
        """Adds a flow to the switch."""
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser

        inst = [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, actions)]
        mod = parser.OFPFlowMod(datapath=datapath, priority=priority, match=match, instructions=inst)
        datapath.send_msg(mod)

    @set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)
    def packet_in_handler(self, ev):
        """Handles packet-in messages from the switch."""
        msg = ev.msg
        datapath = msg.datapath
        ofproto = datapath.ofproto
        parser = datapath.ofproto_parser
        in_port = msg.match['in_port']

        pkt = packet.Packet(msg.data)
        eth = pkt.get_protocol(ethernet.ethernet)

        # Ignore LLDP packets to avoid endless loop
        if eth.ethertype == 0x88cc:
            return

        dst = eth.dst
        src = eth.src

        # Log packet details
        self.logger.info(f"Packet in: src={src}, dst={dst}, in_port={in_port}")

        # Save packet data to the PCAP file
        self.write_to_pcap(msg.data)

        # Get the destination MAC and send packet out
        actions = [parser.OFPActionOutput(ofproto.OFPP_FLOOD)]
        out = parser.OFPPacketOut(datapath=datapath, buffer_id=ofproto.OFP_NO_BUFFER,
                                  in_port=in_port, actions=actions, data=msg.data)
        datapath.send_msg(out)

    def write_to_pcap(self, data):
        """Write the captured packet to the PCAP file."""
        try:
            # Write the raw packet data to the pcap file
            self.pcap_hdr.writepkt(data)
        except Exception as e:
            self.logger.error(f"Failed to write packet to PCAP: {e}")

    def __del__(self):
        """Destructor to ensure the PCAP file is closed properly."""
        self.close_pcap()
