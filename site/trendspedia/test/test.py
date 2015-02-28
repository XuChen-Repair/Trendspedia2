from django.http import HttpResponse
#from celery_queue import tasks
from models import *
from mongoengine import *
import requests
import json
import time
from social_auth.models import UserSocialAuth # Social Authentication of popular services
from requests.auth import OAuth1
from twython import Twython
from django.conf import settings

# title = ["Singapore",
#          "China",
#          "United Stated",
#          "Russia",
#          "Facebook",
#          "Apple",
#          "Google",
#          "Microsoft",
#          "IBM",
#          "Sony"]

# Nice solution found in SO to make a list unique and keep the order
def uniqueList(seq):
    seen = set()
    seen_add = seen.add
    return [ x for x in seq if x not in seen and not seen_add(x)]

def simpleTweetCreation(tweet, user):
    tweet = SimpleTweet(createdAt=tweet["created_at"],
                        id=tweet["id"],
                        text=tweet["text"],
                        source=tweet["source"],
                        user=user)
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

def updateWikiArticleTweet(pageID, queryResults):
    timeFormat = "%a %b %d %H:%M:%S +0000 %Y"
    ids = None
    count = 0
    maxTweets = 99
    tweets = []
    try:
        article = WikiArticle.objects(pageID=pageID)
        # Sort using the createdAt attribute of the tweet list associated 
        # with the article queried by pageID
        tweets = sorted(article.first().tweets, 
                        key=lambda x: 
                            time.mktime(time.strptime
                                        (x.createdAt,
                                         timeFormat)))
        if tweets is None: # If there is no tweets, None is returned
            tweets = []    # instead of empty list

        statuses = queryResults["statuses"]
        # For each tweet, store a new user
        for status in statuses:
            try:
                user = twitterUserCreation(status["user"])
                tweet = simpleTweetCreation(status, user)
                tweets.append(tweet)
                user.save()
            except Exception, e:
                print e
                pass
        # Make sure the updated list have unique elements
        # Sort the updated list based on created time of each element(tweet)
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
    except Exception, e:
        print e
        pass
    return tweets

# def test_call(request):
#     timeFormat = "%a %b %d %H:%M:%S +0000 %Y"
#     ids = None
#     count = 0
#     newTweetsCount = 0
#     oldTweetsCount = 0
#     maxTweets = 99
#     for t in title:
#         try:
#             article = WikiArticle.objects(pageTitle=t)
#             # article.update_one(set__query=article.first().pageTitle)
#             user = UserSocialAuth.objects.filter(user=request.user).get()
#             #print article
#             # Sort using the createdAt attribute
#             tweets = sorted(article.first().tweets, 
#                             key=lambda x: 
#                                 time.mktime(time.strptime
#                                             (x.createdAt,
#                                              timeFormat)))
#             if tweets is None: # If there is no tweets, None is returned
#                 tweets = []    # instead of empty list
#             query = article.first().query
# 
#             t = Twython(app_key=settings.TWITTER_CONSUMER_KEY,
#                 app_secret=settings.TWITTER_CONSUMER_SECRET,
#                 oauth_token=user.tokens['oauth_token'],
#                 oauth_token_secret=user.tokens['oauth_token_secret'])
# 
#             queryResults = t.search(**({"q":query}))
#             ids = queryResults
# 
#             statuses = queryResults["statuses"]
#             for status in statuses:
#                 try:
#                     user = twitterUserCreation(status["user"])
#                     tweet = simpleTweetCreation(status, user)
#                     tweets.append(tweet)
#                     user.save()
#                 except Exception, e:
#                     print e
#                     pass
#             # Make sure the updated list have unique elements
#             # Sort the updated list based on created time of each element(tweet)
#             tweets = uniqueList(tweets)
#             tweets = sorted(tweets, 
#                             key=lambda x: 
#                                 time.mktime(time.strptime
#                                             (x.createdAt,
#                                              timeFormat)),
#                             reverse=True)
# 
#             if len(tweets) > maxTweets:
#                 tweets = tweets[0:maxTweets]
#             article.update_one(set__tweets=tweets)
#         except Exception, e:
#             print e
#             pass
#         # break
#     # print "count is", count
#     return HttpResponse(json.dumps({"result": ids}), mimetype="application/json")
# 
