# Standard library import
import json
import time
from collections import defaultdict
import operator

# Third party library
from mongoengine import *

# Django utitlies and module
from django.http import HttpResponse
from django.conf import settings
from twitter.mongoModels import *

from datetime import datetime
import string, time, operator, re, nltk

# Nice solution found in SO to make a list unique and keep the order
def uniqueList(seq):
    seen = set()
    seen_add = seen.add
    return [ x for x in seq if x not in seen and not seen_add(x)]

def simpleTweetCreation(tweet, user):
    tweet = SimpleTweet(createdAt=tweet["created_at"],
                        id=unicode(tweet["id"]),
                        text=tweet["text"],
                        source=tweet["source"],
                        profileImageUrl = user.profileImageUrl,
                        user=user)
    return tweet

def tweetCreation(item, user, pageID):
    time_format = "%a %b %d %H:%M:%S +0000 %Y"
    relatedUrls = map(lambda url: url["expanded_url"], item["entities"]["urls"]);
    # Below code results in short URLs but availability at the mercy of twitter
    # relatedUrls = map(lambda url: url["url"], item["entities"]["urls"]);
    tweet = Tweets(createdAt=datetime.strptime(item["created_at"], time_format),
                  pageID=pageID,
                  id=str(item["id"]),
                  text=item["text"],
                  source=item["source"],
                  userID=str(user["id"]),
                  name=user["name"],
                  screenname=user["screen_name"],
                  profileImageUrl=user["profile_image_url"],
                  urls=json.dumps(relatedUrls),
                  profileBackgroundImageUrl=user["profile_background_image_url"])

    return tweet


def twitterUserCreation(source):
    user = TwitterUser(userID=str(source["id"]),
                       name=source["name"],
                       screenname=source["screen_name"],
                       createdAt=source["created_at"],
                       location=source["location"],
                       description=source["description"],
                       url=source["url"],
                       profileImageUrl=source["profile_image_url"],
                       profileImageUrlHttps=source["profile_image_url_https"],
                       profileBackgroundImageUrl=source["profile_background_image_url"],
                       profileBackgroundImageUrlHttps=source["profile_background_image_url_https"],
                       statusesCount=source["statuses_count"],
                       followerCount=source["followers_count"],
                       favouritesCount=source["favourites_count"],
                       friendsCount=source["friends_count"],
                       listedCount=source["listed_count"])
    return user

class Helper(object):
    def jsonp(self, request, result):
        try:
            data = json.dumps(result)
            if 'callback' in request.REQUEST:
                # a jsonp response!
                data = '%s(%s);' % (request.REQUEST['callback'], data)
                return HttpResponse(str(data), "text/javascript")
        except:
            data = json.dumps(result)
        return HttpResponse(str(data), "application/json")

    def getHotMaterials(self, pageID):
        entries = Hot.objects(pageID=pageID).order_by('-mentionedCount').limit(500)

        #sortedURL = sorted(appearances.iteritems(), key=operator.itemgetter(1), reverse=True)
        sortedURL = [{"title":str(entry.title),
		     "description":str(entry.description),	
		     "url": str(entry.url),
                     "count": str(entry.mentionedCount),
                     "tweetID": str(entry.tweetID),
                     "tweetCreatedTime": str(entry.tweetCreatedTime),
                     "images": (entry.images)
                     } 
                     for entry in entries
                    ]
        return sortedURL

    '''
    def getHotImage(self, pageID):
        entry = HotImage.objects(pageID=pageID).first()
        return entry.records
    '''


    def getUserFollower(self, id, queryResults, cursor=-1):
        entries = queryResults["users"]
        for entry in entries:
            try:
                user = twitterUserCreation(entry)
                user.save()
            except Exception, e:
                print "getUserFollower", e
        '''
        while(nextCursor != 0):
            result = result.get()
            dump = json.loads(result.content)
            nextCursor = dump['next_cursor']
            nextCursor = 0
            for id in dump["ids"]:
                user = TwitterUser.objects(userID=id)
                #user = TwitterUser.objects(userID="548653422")
                if user.count == 0:
                #print user
                break
        '''

    def updateWikiArticleTweet(self, pageID, queryResults):
        timeFormat = "%a %b %d %H:%M:%S +0000 %Y"
        ids = None
        try:
            #article = WikiArticle.objects(pageID=id).first()
            # Sort using the createdAt attribute of the tweet list associated 
            # with the article queried by pageID
            '''
            tweets = sorted(article.first().tweets, 
                            key=lambda x: 
                                time.mktime(time.strptime
                                            (x.createdAt,
                                             timeFormat)))
            if tweets is None: # If there is no tweets, None is returned
                tweets = []    # instead of empty list

            '''
            statuses = queryResults["statuses"]
            # For each tweet, store a new user
            count = 0
            tweets = []
            for status in statuses:
                count = count + 1
                try:
                    user = TwitterUser.objects(userID=str(status["user"]["id"]))
                except:
                    user = twitterUserCreation(status["user"])
                    user.save()
			
                try:
                    tweet = tweetCreation(status, status["user"], pageID)
                    tweet.save()
                except Exception, e:
                    print "I am hereException", e, status["id"]

            # Make sure the updated list have unique elements
            # Sort the updated list based on created time of each element(tweet)
            '''
            tweets = uniqueList(tweets)
            tweets = sorted(tweets, 
                            key=lambda x: 
                                time.mktime(time.strptime
                                            (x.createdAt,
                                             timeFormat)),
                            reverse=True)

            if len(tweets) > maxTweets:
                tweets = tweets[0:maxTweets]
            article.update_one(set__tweets=tweets)
            '''
        except Exception, e:
            print e
            pass
        return 

class TopEvents:

    ISOTIMEFORMAT = '%Y-%m-%d'

    start_time = time.strptime('2013-3-25', ISOTIMEFORMAT) #start time of the twitter data set

    day_number = int((time.mktime(datetime.today().timetuple()) - time.mktime(start_time)) / 86400) #slice by day

    time_pattern = re.compile(r'\d{4}-\d{2}-\d{2}')

    term_pattern = re.compile(r'[a-zA-Z]+')

    stopwords = set()

    day_cnt_list = []

    day_doc_list = []

    day_weight_list = []

    

    def __init__(self, stopword_file):

        with open(stopword_file, 'r') as fp:

            for line in fp:

                self.stopwords.add( line.strip() )

        

    def get_top_K_events(self, tweets, alpha, K, N):

        self.initialize_days()

        self.update_days( tweets )

        top_events = self.rank_events(alpha, K) #K: number of events

        result = []

        for (day, weight) in top_events:

            freqdist = self.day_doc_list[day]

            if len( freqdist.items() ) == 0:

                continue

            word_list = []

            for word, num in freqdist.items()[:N]:  # N:number of words for each event

                word_list.append( ( word, num) )

            result.append( (day, weight, word_list) )

        return result 

    

    def initialize_days(self):

        self.day_number = int((time.mktime(datetime.today().timetuple()) - time.mktime(self.start_time)) / 86400)

        self.day_cnt_list = [0] * self.day_number

        self.day_doc_list = [nltk.FreqDist() for i in xrange(self.day_number)]

        self.day_weight_list = [0] * self.day_number

            

    def update_days(self, tweets):

        for tweet in tweets:

            time_string = re.search(self.time_pattern, tweet).group()

            post_time = time.strptime(time_string, self.ISOTIMEFORMAT)

            day = int((time.mktime(post_time) - time.mktime(self.start_time)) / 86400)

            term_list = self.get_terms( tweet )

            self.day_cnt_list[ day ] += 1

            self.day_doc_list[ day ].update( term_list )



    def get_terms(self, tweet):

        term_list = re.findall(self.term_pattern, tweet.lower())

        return [term for term in term_list if len(term) > 3 and len(term) < 20 and term not in self.stopwords]



    def rank_events(self, alpha, K):

        maxBurst = self.findMaxBurst()

        maxDay = self.getMaxDay()

        sort_list = []

        for day in xrange(self.day_number):

            weight = self.get_weight( day, maxBurst, maxDay, alpha)

            sort_list.append( (day, weight) )

        sort_list.sort( key = operator.itemgetter(1), reverse = True ) #descending order of weight

        return sort_list[:K]

        

    def findMaxBurst(self):

        maxBurst = 0

        for burst in self.day_cnt_list:

            if burst > maxBurst:

                maxBurst = burst

        return maxBurst

    

    def getMaxDay(self):

        return self.day_number

    

    def get_weight(self, day, maxBurst, maxDay, alpha):

        burst = self.day_cnt_list[day]

        return alpha*burst/maxBurst + (1-alpha)*day/maxDay
