import numpy as np
import h5py
import glob
from collections import OrderedDict


SEED = 1
MAX_FLOW_LEN = 100 
TIME_WINDOW = 10
TRAIN_SIZE = 0.90 

protocols = ['arp','data','dns','ftp','http','icmp','ip','ssdp','ssl','telnet','tcp','udp']
powers_of_two = np.array([2**i for i in range(len(protocols))])


feature_list = OrderedDict([
    ('timestamp', [0,10]),
    ('packet_length',[0,1<<16]),
    ('highest_layer',[0,1<<32]),
    ('IP_flags',[0,1<<16]),
    ('protocols',[0,1<<len(protocols)]),
    ('TCP_length',[0,1<<16]),
    ('TCP_ack',[0,1<<32]),
    ('TCP_flags',[0,1<<16]),
    ('TCP_window_size',[0,1<<16]),
    ('UDP_length',[0,1<<16]),
    ('ICMP_type',[0,1<<8])]
)

def load_dataset(path):
    filename = glob.glob(path)[0]
    dataset = h5py.File(filename, "r")
    set_x_orig = np.array(dataset["set_x"][:])
    set_y_orig = np.array(dataset["set_y"][:]) 

    X_train = np.reshape(set_x_orig, (set_x_orig.shape[0], set_x_orig.shape[1], set_x_orig.shape[2], 1))
    Y_train = set_y_orig

    return X_train, Y_train

def scale_linear_bycolumn(rawpoints, mins,maxs,high=1.0, low=0.0):
    rng = maxs - mins
    return high - (((high - low) * (maxs - rawpoints)) / rng)

def count_packets_in_dataset(X_list):
    packet_counters = []
    for X in X_list:
        TOT = X.sum(axis=2)
        packet_counters.append(np.count_nonzero(TOT))

    return packet_counters

def all_same(items):
    return all(x == items[0] for x in items)

def static_min_max(time_window=10):
    feature_list['timestamp'][1] = time_window

    min_array = np.zeros(len(feature_list))
    max_array = np.zeros(len(feature_list))

    i=0
    for feature, value in feature_list.items():
        min_array[i] = value[0]
        max_array[i] = value[1]
        i+=1

    return min_array,max_array

def find_min_max(X,time_window=10):
    sample_len = X[0].shape[1]
    max_array = np.zeros((1,sample_len))
    min_array = np.full((1, sample_len),np.inf)

    for feature in X:
        temp_feature = np.vstack([max_array,feature])
        max_array = np.amax(temp_feature,axis=0)
        temp_feature = np.vstack([min_array, feature])
        min_array = np.amin(temp_feature, axis=0)

    max_array[0] = time_window
    min_array[0] = 0

    return min_array,max_array

def normalize_and_padding(X,mins,maxs,max_flow_len,padding=True):
    norm_X = []
    for sample in X:
        if sample.shape[0] > max_flow_len: 
            sample = sample[:max_flow_len,...]
        packet_nr = sample.shape[0] 

        norm_sample = scale_linear_bycolumn(sample, mins, maxs, high=1.0, low=0.0)
        np.nan_to_num(norm_sample, copy=False) 
        if padding == True:
            norm_sample = np.pad(norm_sample, ((0, max_flow_len - packet_nr), (0, 0)), 'constant',constant_values=(0, 0)) 
        norm_X.append(norm_sample)
    return norm_X

def padding(X,max_flow_len):
    padded_X = []
    for sample in X:
        flow_nr = sample.shape[0]
        padded_sample = np.pad(sample, ((0, max_flow_len - flow_nr), (0, 0)), 'constant',
                              constant_values=(0, 0)) 
        padded_X.append(padded_sample)
    return padded_X


