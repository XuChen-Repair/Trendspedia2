import Queue
import time, threading, logging
import json
from social_auth.models import UserSocialAuth

# The user of this class must take into account that the tokens queue
# itself is aware of the rate limitations imposed by Twitter and will
# distribute tokens based on that. However, the tokens queue is not aware
# of the rate limitations for certain APIs such as streaming because it
# was not made known to developers by Twitter. In this case, the queue
# will just dispense tokens with an imaginary "infinite" limit. It's up
# to the user of the tokens queue to impose a back-off timing in the event
# that the user gets rate-limited by Twitter.

class TokensQueue:
    # Makes the tokens queue a Singleton object
    _instance = None
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(Singleton, cls).__new__(
                                cls, *args, **kwargs)
        return cls._instance

    # Constructor for the Tokens Queue class. It takes in a logger object
    # to be used for logging activities conducted by the the Tokens Queue.
    # During construction, a timerThread is started to refresh the counters
    # for the tokens every every quarter of an hour. It also initializes
    # the tokens bucketed by the Twitter API queryType (e.g. search, friendsID).
    # Each token bucket is a priority queue. The tokens are merely a snapshot
    # of the ones saved within the UserSocialAuth database.
    def __init__(self, logger):
        # The bucket limits are per self.rateWindow time interval
        self.bucketLimits = {
            "search":180,
            "followersID":15,
            "followersList":15,
            "friendsID":15,
            "friendshipLookup":15,
            "stream":-1, # -1 symbolizes unknown rate limits
            } 
        # total remaining uses per queryType => bucketLimits * tokens
        self.remainingUses = {}
        self.rateWindow = 15 * 60 # 15 minutes
        self.threadLock = threading.Lock()
        self.logger = logger
        self.logInfo("Tokens Queue Service started.")
        # self.validateTokens()
        self.refreshPQ()

        # Spin off a timer thread to refresh the tokens queue on
        # the self.rateWindow time interval.
        self.t = threading.Thread(target=self.timerThread)
        self.t.daemon = True
        self.t.start()

    def logInfo(self, message):
        if self.logger != None:
            self.logger.info(json.dumps({"message":message}))
        else:
##            print message
            pass

    def logWarning(self, message):
        if self.logger != None:
            self.logger.warning(json.dumps({"message":message}))
        else:
##            print message
            pass

    # Return the number of unique tokens in the Tokens Queue at the moment.
    # It is set to refresh every quarter of an hour.
    def returnNumUniqueTokens(self):
        return len(self.tokens)

    # Initiates the token priority queues (a.k.a. buckets) with the TOKENS.
    def initiatePQ(self, tokens = []):
        # The lock should be acquired prior to using this method.
        assert(self.threadLock.locked())
        self.pq = {}
        self.remainingUses = {}
        for key in self.bucketLimits:
            self.pq[key] = Queue.PriorityQueue()
            self.remainingUses[key] = 0
            # Store token pairs in PriorityQueue
            for token in self.tokens:
                # More tokens, more total uses
                self.remainingUses[key] += self.bucketLimits[key]
                # Pair of (uses left, token)
                self.pq[key].put((-1*self.bucketLimits[key], token)) # Priority Queue sort by minimum

    # This is a timer thread that will refresh the contents of the queues.
    def timerThread(self):
        while True:
            currentTime = (int)(time.time())
            sleepDuration = self.rateWindow - (currentTime % self.rateWindow)
            time.sleep(sleepDuration)
            self.refreshPQ()

    # Function called on by timer thread in order to refresh the contents
    # of the tokens queue.
    def refreshPQ(self):
        self.threadLock.acquire()
        self.pq = Queue.PriorityQueue()
        # Retrieve all token pairs from UserSocialAuth table that are
        # Twitter tokens
        ua = UserSocialAuth.objects.filter(provider='twitter')
        print ua

        self.tokens = []
        # Store tokens in a list
        for user in ua:
            if (user.provider == "twitter"):
                #DY
                from django.conf import settings
                import requests
                from requests_oauthlib import OAuth1
                
                url = u'https://api.twitter.com/1.1/account/verify_credentials.json'                
                oauth = OAuth1(unicode(settings.TWITTER_CONSUMER_KEY), unicode(settings.TWITTER_CONSUMER_SECRET), unicode(user.tokens['oauth_token']), unicode(user.tokens['oauth_token_secret']), signature_type='query')
                response = requests.get(url, auth=oauth)
                if (response.status_code == 401):
                    #remove invalid tokens
                    user.delete()
                else:
                    self.tokens.append(user.tokens)
                    print "token appended, ", user

        self.initiatePQ(self.tokens)
        self.logInfo("Refreshed Tokens Queue.")
        self.nextRefreshAt = (int)(time.time()) + self.rateWindow
        self.threadLock.release()

    # Function returns minimum time to wait between uses such that
    # the service won't be starved for tokens due to Twitter's API limits
    # If there are no tokens left, advise 30 seconds before retry
    def getMinTimeBetweenUses(self, queryType):
        remainingTime = self.nextRefreshAt - (int)(time.time())
        if self.remainingUses.get(queryType) != 0:
            return (remainingTime * 1.0 / self.remainingUses[queryType])
        else:
            return 30

    # Returns a token for QUERYTYPE. None is returned if there's no tokens
    # available.
    def retrieveToken(self, queryType):
        ret = None
        self.threadLock.acquire()
        if (queryType in self.pq) and (not self.pq[queryType].empty()):
            tokenPair = self.pq[queryType].get()
            self.logInfo("Retrieved Token {0}, remaining uses: {1} from {2} bucket.".format(tokenPair[1], tokenPair[0], queryType))
            tokenPair = (tokenPair[0] + 1, tokenPair[1])
            self.remainingUses[queryType] = self.remainingUses[queryType] - 1
            # -1 is means unknown rate limit, an equality to 0
            # is used here to allow tokens to be reused for
            # streaming indefinitely. 
            if tokenPair[0] != 0: 
                self.pq[queryType].put(tokenPair)

            ret = tokenPair[1]
        else:
            self.logWarning("No token retrieved from {0} bucket.".format(queryType))
            
        self.threadLock.release()
        return ret

#tq = TokensQueue()
#print "id is ",  id(tq)



