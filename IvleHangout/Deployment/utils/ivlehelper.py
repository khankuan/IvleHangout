import urllib
import threading


_ivleAPIKey = None
_ivleURL = None


_multipleURLResults = {}
_multipleURLThreads = {}


def _getURL(url,requesttype,resultsmap):
    resultsmap[requesttype] = urllib.urlopen(url).read()
    resultsmap[requesttype] = resultsmap[requesttype][1:len(resultsmap[requesttype])-1]



def getUserIvleInfo(token): 
    requesttype = ['UserID_Get', 'UserEmail_Get', 'UserName_Get']      
    _multipleURLThreads[token] = []
    _multipleURLResults[token] = {}
    for t in requesttype:
        targetURL = _ivleURL + t + "?APIKey=" + _ivleAPIKey + '&Token=' + token
        t = threading.Thread(target=_getURL, args=(targetURL, t, _multipleURLResults[token]))
        t.daemon = True
        t.start()
        _multipleURLThreads[token].append(t)
        
        
    for threads in _multipleURLThreads[token]:
        threads.join()
    
    del _multipleURLThreads[token]
    
    ivleid = _multipleURLResults[token]['UserID_Get']
    email = _multipleURLResults[token]['UserEmail_Get']
    fullname = _multipleURLResults[token]['UserName_Get']
    del _multipleURLResults[token]
    return ivleid, email, fullname