# ********* Create your views here. **********

# General lib in Django like logging, settings, etc...
import logging
import inspect
import pika
from datetime import datetime
from django.conf import settings
from django.http import HttpResponse
from django.template import Context, loader, RequestContext
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse

#new change
import datetime


from social_auth.models import UserSocialAuth # Social Authentication of popular services
import requests # Requests library, simplifying http request
import json
from pprint import pprint
from requests_oauthlib import OAuth1
from twython import Twython
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from wikipedia.views import JSONResponse
from pymongo import Connection
from twitter.helper import Helper
from bson import json_util

# Global variable ??? How to fix
oauth = None

def dummy_index(request):
    return HttpResponse("Hello, world. You are index page now!")

def logout_view(request):
    logout(request)
    print request.user.is_authenticated()
    return redirect('/home')
    # t = loader.get_template('logout.html')
    # c = Context()
    # return HttpResponse(t.render(c))

@login_required
def private(request):
    t = loader.get_template('private.html')
    c = Context()
    return HttpResponse(t.render(c))

def dummy_test(request):
    print "Home is here"
    t = loader.get_template('home.html')
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))

def on_results(results):
    """A callback to handle passed results from Twython Stream
    """

    # TODO: Do something with these results on callback
    #print results

# Method is restricted to localhost only.
def addTask(request, queryType): #TEST-IGNORE
    import socket
    if (socket.gethostbyaddr(request.META['REMOTE_ADDR']) !=
        socket.gethostbyaddr("127.0.0.1")):
        return HttpResponse(status=403) # Forbidden
    '''Add a task to the task queue using Celery'''
    if request.method == 'GET':
        # Get parameters
        params = request.GET
        from celery_queue import tasks
        # Add to Celery Queue
        result = tasks.api.delay(queryType, params)
        return result.get()

def search(request, queryType): #TEST-IGNORE
    '''Retrieve Twitter Feeds from Twitter'''
    if request.method == 'GET':
        # Send tokens request
        connection = pika.BlockingConnection(pika.ConnectionParameters(
                host='localhost'))
        channel = connection.channel()
        channel.queue_declare(queue='tokens_queue')
        channel.basic_publish(exchange='',
                              routing_key='tokens_queue',
                              body=queryType)
        
        # Receive tokens generated
        channel.queue_declare(queue=queryType)
        method_frame, header_frame, token = channel.basic_get(queue=queryType)
        connection.close()

        if token == None:
            return HttpResponse(status=204)

        token = json.loads(token)
##        try:
##            user = UserSocialAuth.objects.filter(user=request.user).get()
##        except e:
##            return HttpResponse(code=401) # Using 401 Unauthorized as I couldn't find a better HTTP Response code.
        
        # Get parameters
        params = request.GET
        return search_with_tokens(token, queryType, params)
##        return search_with_tokens(user.tokens, queryType, params)

def search_with_tokens(tokens, queryType, params):
    #print "params = ", params
    #user = UserSocialAuth.objects.filter(user=request.user).get()
    # Set up a new Twython object with the OAuth keys

    #pprint(tokens)
    print "app_key = ", settings.TWITTER_CONSUMER_KEY
    print "app_secret = ", settings.TWITTER_CONSUMER_SECRET
    print "oauth_token = ", tokens['oauth_token']
    print "oauth_token_secret = ", tokens['oauth_token_secret']
    t = Twython(app_key=settings.TWITTER_CONSUMER_KEY,
        app_secret=settings.TWITTER_CONSUMER_SECRET,
        oauth_token=tokens['oauth_token'],
        oauth_token_secret=tokens['oauth_token_secret'])    
    
    # Obtain Twitter results using user's OAuth key
    if queryType == "search":
        params = params.copy()
        pageID = params["pageID"]
        del params["pageID"]
        queryResults = t.search(**(params))

        # Use helper to update the tweet list of the page
        # Return an array of tweets to return to the client
        helper = Helper()
        # tweets = helper.updateWikiArticleTweet(pageID, queryResults) # Update the correct pageID
        helper.updateWikiArticleTweet(pageID, queryResults) # Update the correct pageID
        '''
        tweetsSerialization = []
        for tweet in tweets:
            tweetsSerialization.append({
                "id" : tweet.id,
                "text" : tweet.text,
                "source" : tweet.source,
                "profileImageUrl" : tweet.profileImageUrl,
                "createdAt" : tweet.createdAt
            })
        '''

        # Get the correct logger based on convention:
        # {APP}.{FILE}.{FUNCTION} = __name__.'.'.inspect.stack()[0][3]
        # Need to evaulate performance of 'inspect' library as print function name
        # is not supported by Python
        #print __name__+"."+inspect.stack()[0][3]
        logger = logging.getLogger(__name__+"."+inspect.stack()[0][3])
        # Fake infomation, to be updated later
        logger.info(json.dumps({
            "pageID": pageID, # Pass the correct pageID here
            "queryType": queryType,
            "query": queryResults["search_metadata"]["query"],
            "tweetsCount": queryResults["search_metadata"]["count"],
            "source": 'TwitterAPI',
        }))
        return HttpResponse(json.dumps(queryResults), content_type="application/json")

##    elif queryType == "articleSearch":
##        params1 = dict(params)
##        # TODO, swap this out later
##        params1["q"] = unicode(params["articleId"])
##        del params1["articleId"]
##        queryResults = t.search(**(params1))
    elif queryType == "followersID":
        queryResults = t.getFollowersIDs(**(params))
    elif queryType == "followersList":
        params = params.copy()
        screen_name = params["screen_name"]
        cursor = params["cursor"]
        queryResults = t.getFollowersList(**(params))
        # Save results
        helper = Helper()
        helper.getUserFollower(screen_name, queryResults)
    elif queryType == "friendsID":
        queryResults = t.getFriendsIDs(**(params))
    elif queryType == "friendshipLookup":
        queryResults = t.lookupFriendships(**(params))
    elif queryType == "stream":
        queryResults = t.stream(params, on_results)

    return HttpResponse(json.dumps(queryResults), content_type="application/json")

"""Function-based view for the home page

It checks requests' authentication, then find the suitable stored Twitter's 
credential to get some user infomation and return them to the front end for 
interface customization

Wiki page rendered at the home page is done by using RESTful API defined by
'Wikipedia' app, which servers a redirection from Wikipedia's API to fetch
necessary information for rendering at the front end

"""
def home(request, lang):
    # Login for Twitter user, might change for other services
    url = u'https://api.twitter.com/1.1/account/verify_credentials.json'
    # Get the home template
    t = loader.get_template('main/home.html') 

    #pprint((request.user.social_auth.get().user.username))
    #pprint((request.user.is_authenticated()))

    # If user is not logged in, return an empty response (no information)
    if(request.user.is_authenticated() is False):
        c = RequestContext(request, {})
        return HttpResponse(t.render(c))

    # Else, try to setup an Oauth credential and connect to Twitter using 
    # 'requests' library. CONSUMER_KEY and CONSUMER_SECRET are provided for
    # each application. oauth_token and oauth_token_secret are unique for each
    # user.
    # For now, only return response with user's name used in Twitter
    try:
        # Get user using Django-SocialAuth APINo docs for method like get(),...
        user = UserSocialAuth.objects.filter(user=request.user).get()
        if user.provider == "twitter":
            oauth = OAuth1(unicode(settings.TWITTER_CONSUMER_KEY), 
                        unicode(settings.TWITTER_CONSUMER_SECRET),
                        unicode(user.tokens['oauth_token']),
                        unicode(user.tokens['oauth_token_secret']),
                        signature_type='query')
            r = requests.get(url, auth=oauth)
            responseJSON = json.loads(r.text)
            c = RequestContext(request, {"name" : responseJSON["name"]})
        elif user.provider == "weibo":
            c = RequestContext(request, {"name" : "weibo"})
        else:
            c = RequestContext(request, {})
    except Exception, e: # Some exceptions thrown, return an empty response
        print e
        c = RequestContext(request, {})
    #return HttpResponse("hello world.")
    return HttpResponse(t.render(c))

def get_date(record):
    return datetime.datetime.strptime(record[0], "%Y-%m-%d")

min_time = datetime.datetime.max
max_time = datetime.datetime.min
def getEvents(request, topic):
    # print "topic = ", topic
    # con = Connection()
    # db = con['cs3281']
    # col = db['trending_events']
    # events = []
    # for r in col.find({'term':str(topic)}):
    #     events.append(r['events'])
    helper = Helper()
    import codecs, re

    con = Connection()
    db = con['cs3281']
    wikiCol = db['wiki_article']
    wordPattern = re.compile(r'[\w]+')
    title_file = './wikiTitle.txt'

    #print "I am here!"
    wordSet = set()
    for doc in wikiCol.find():
        if 'pageTitle' in doc:        
            title = doc['pageTitle']
            wordlist = re.findall(wordPattern, title.lower())
            for word in wordlist:
                if len(word) > 3 and len(word) < 20:
                    wordSet.add(word)

    fwp = codecs.open(title_file, 'w', 'utf-8')
    for word in wordSet:
        fwp.write( "%s\n" % (word) )      
    fwp.close()
    import datetime
    import codecs, re
    import wiki

    ISOTIMEFORMAT = '%Y-%m-%d'
    wikititle_file = './wikiTitle.txt'
    tweet_file = './tweet.txt'
    #min_time = datetime.datetime.max
    #max_time = datetime.datetime.min
    titleSet = set() # The set of titles of wiki articles 
    wordSet = set() # To keep all the keywords in the tweet collection
    wordPattern = re.compile(r'[\w]+')

    def loadTitleSet():
        fp = codecs.open(wikititle_file, 'r', 'utf-8')
        for line in fp.readlines():
            title = line.strip()
            titleSet.add( title )
        fp.close()

    def processTweets():
        global min_time, max_time
        con = Connection()
        db = con['cs3281']
        bef = datetime.date.today()-datetime.timedelta(days=5)
        tweetCol = db['tweets']
        fwp = open(tweet_file, 'w')
        cnt = 0
        topic_page_id = wiki.page(title = topic).pageid
        for doc in tweetCol.find({'pageID': topic_page_id, 'createdAt': {'$lt': datetime.datetime(datetime.date.today().year, datetime.date.today().month, datetime.date.today().day, 23, 59, 59), '$gte': datetime.datetime(bef.year, bef.month, bef.day, 0, 0, 0)}}):
        #print doc
            if 'createdAt' not in doc or 'text' not in doc:
                continue
            create_time = doc['createdAt']
            min_time = create_time if create_time < min_time else min_time
            max_time = create_time if create_time > max_time else max_time
            timeString = create_time.strftime(ISOTIMEFORMAT)
            fwp.write(timeString)
            
            text = doc['text']
            wordlist = re.findall(wordPattern, text.lower())
            for word in wordlist:
                #if word in titleSet:
                    wordSet.add( word )
                    fwp.write(" %s" % word)
            
            fwp.write("\n")
            cnt += 1
            if cnt % 10000 == 0:
                print cnt
        fwp.close()

    def writeWordSet():
        wordList = list( wordSet )
        wordList.sort()
        fp = open('TweetWords.txt', 'w')
        for word in wordList:
            fp.write("%s\n" % word )
        fp.close()

    def run():
        loadTitleSet()
        processTweets()
        writeWordSet()
        #print min_time, max_time

    run()
    # Find relevant words for each term

    from datetime import datetime

    import string, time, operator, re, nltk

    import pprint

    class TopEvents:

        ISOTIMEFORMAT = '%Y-%m-%d'

        start_time = time.strptime('2014-10-15', ISOTIMEFORMAT) #start time of the twitter data set

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
            #print "top_events = ", top_events
            result = []
            #pprint.pprint(self.day_doc_list)

            for (day, weight) in top_events:

                freqdist = self.day_doc_list[day]
                #print "freqdist for day ", day, " = ", freqdist

                if len( freqdist.items() ) == 0:

                    continue

                word_list = []

                #for word, num in freqdist.items()[:N]:  # N:number of words for each event
                for word, num in freqdist.most_common(N):
                    word_list.append( ( word, num) )
                actual_date = datetime.date(2014, 10, 15) + datetime.timedelta(days=day)
                actual_date_string = actual_date.strftime("%Y-%m-%d")
                result.append( (actual_date_string, weight, word_list) )
                
            #pirint "result = ", result
            
            return sorted(result, key = get_date, reverse = True) 

        

        def initialize_days(self):

            self.day_number = int((time.mktime(datetime.today().timetuple()) - time.mktime(self.start_time)) / 86400)
            self.day_number = self.day_number + 1

            self.day_cnt_list = [0] * self.day_number

            self.day_doc_list = [nltk.FreqDist() for i in xrange(self.day_number)]

            self.day_weight_list = [0] * self.day_number

                

        def update_days(self, tweets):

            #print tweets
            for tweet in tweets:
            
                #print tweet

                time_string = re.search(self.time_pattern, tweet).group()

                post_time = time.strptime(time_string, self.ISOTIMEFORMAT)

                day = int((time.mktime(post_time) - time.mktime(self.start_time)) / 86400)

                term_list = self.get_terms( tweet )

                #print "day = ", day
                self.day_cnt_list[ day ] += 1

                self.day_doc_list[ day ].update( term_list )



        def get_terms(self, tweet):

            term_list = re.findall(self.term_pattern, tweet.lower())

            return [term for term in term_list if len(term) > 3 and len(term) < 20 and term not in self.stopwords]



        def rank_events(self, alpha, K):

            maxBurst = self.findMaxBurst()
            #print "maxBurst = ", maxBurst
            maxDay = self.getMaxDay()
            #print "maxDay = ", maxDay
            sort_list = []

            for day in xrange(self.day_number):

                weight = self.get_weight( day, maxBurst, maxDay, alpha)

                sort_list.append( (day, weight) )
                #print "sort_list when day = ", day, " = ", sort_list

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



    tweets = []

    with open('tweet.txt', 'r') as fp:

        for line in fp:

            tweets.append( line.strip() )



    te = TopEvents('stopwords')

    return helper.jsonp(request, te.get_top_K_events(tweets, 0.5, 10, 10))

def hotMaterials(request):
    if request.method == "GET":
        pageID = request.GET["pageID"]
        helper = Helper()
        result = {
            "pageID" : pageID,
            "hotMaterials" : helper.getHotMaterials(pageID),
        }
        #print result
        #return HttpResponse(json.dumps(queryResults), mimetype="application/json")
        return helper.jsonp(request, result)		

'''
def hotImage(request):
    if request.method == "GET":
        pageID = request.GET["pageID"]
        print 'pageID', pageID
        helper = Helper()
        result = {
            "pageID" : pageID,
            "records" : helper.getHotImage(pageID),
        }
        return helper.jsonp(request, result)
'''

##@api_view(['POST'])
##def tweet_post(request, format=None):
##    """
##    Post a tweet into the DB
##    """
##    if request.method == 'POST':
##        serializer = TweetSerializer (request.DATA)
##        if serializer.is_valid():
##            serializer.save()
##            return Response(serializer.data, status=status.HTTP_201_CREATED)
##        else:
##            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
##
##@api_view(['GET', 'PUT', 'DELETE'])
##def tweet_detail(request, pk, format=None):
##    """
##    Retrieve, update or delete a tweet instance.
##    """
##    try:
##        twitter = Tweet.objects.get(id_str=pk)
##    except Tweet.DoesNotExist:
##        return Response(status=status.HTTP_404_NOT_FOUND)
##
##    if request.method == 'GET':
##        serializer = TweetSerializer(instance=twitter)
##        return Response(serializer.data)
##
##    elif request.method == 'PUT':
##        serializer = TweetSerializer(request.DATA, instance=twitter)
##        if serializer.is_valid():
##            serializer.save()
##            return Response(serializer.data)
##        else:
##            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
##
##    elif request.method == 'DELETE':
##        twitter.delete()
##        return Response(status=status.HTTP_204_NO_CONTENT)


#DY
import pymongo
# tweets from mongoDB
def getTweetsfromDB(request):
    con = Connection()
    db = con['cs3281']
    tweetsDB = db['tweets']
    params = request.GET
    print "params = "
    print params

    if params.get('pageID') and params.get('query'):
        # Insert query into Topic DB if does not exist, if exist then
        # update priority to 1
        topic = db['topics'].find_one({"pageID": params['pageID']})
        if topic is None:
            topic = {}
            print params
            topic['query'] = params['query']
            topic['pageID'] = params['pageID']
            topic['priority'] = 1
            db['topics'].insert(topic)
        else:
            db['topics'].update({"pageID": params['pageID']},
                {"$set":{
                    "priority": 1,
                    "sinceID": params.get('since_id')
                }
            })
    query = {}
    if params.get('pageID'):
        query['pageID'] = params.get(pageID)
    if params.get('sw') and params.get('ne'):
        sw = map(float, params.get('sw').split(','))
        ne = map(float, params.get('ne').split(','))
        query['location'] = {
            "$geoWithin": {
                "$box": [sw, ne]
            }
        }
    if params.get('before') or params.get('after'):
        dateFmt = '%Y-%m-%dT%H:%M:%S.%fZ'
        query['createdAt'] = {}
        if params.get('before'):
            query['createdAt']['$lte'] = datetime.datetime.strptime(params.get('before'),dateFmt)
        if params.get('after'):
            query['createdAt']['$gt'] = datetime.datetime.strptime(params.get('after'),dateFmt)

    DBresults = tweetsDB.find(query).limit(100).sort('createdAt', pymongo.DESCENDING)

    resultList = []
    for DBresult in DBresults:
        resultList.append(DBresult)

    jsonList = json.dumps(resultList ,default=json_util.default)
    return HttpResponse(jsonList)