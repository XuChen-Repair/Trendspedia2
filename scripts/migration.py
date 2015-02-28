from mongoengine import *
from pymongo import MongoClient
import datetime
client = MongoClient()

db = client.cs3281;
collection = db.wiki_article
users_collection = db.twitter_user

time_example = "Sat Apr 13 03:52:59 +0000 2013"
time_format = "%a %b %d %H:%M:%S +0000 %Y"

class Tweets(Document):
    meta = { 
        'indexes': [
            {'fields': ['id']},
            {'fields': ['pageID']},
            {'fields': ['createdAt']},
        ]   
    }   
    createdAt = DateTimeField()
    pageID = StringField(required=True)
    id = StringField(max_length=100, unique_with="pageID")
    text = StringField(max_length=300)
    source = StringField(max_length=1000)
    userID = StringField(max_length=100, required=True, unique=True, primary_key=True)
    name = StringField(max_length=100)
    screenname = StringField(max_length=100)
    location = StringField(max_length=1000)
    description = StringField(default="")
    profileImageUrl = StringField(max_length=1000)
    profileBackgroundImageUrl = StringField(default="")
    statusesCount = IntField(default=0)

connect("cs3281",
        username="cs3281",
        password="cs3281")

articles = collection.find()
#article = collection.find_one({"pageID":"27318"})
for article in articles:
    if "tweets" in article and len(article["tweets"]) != 0 :
        pageID = article["pageID"]
        print pageID, article["pageTitle"], len(article["tweets"])
        for item in article["tweets"]:
            user = users_collection.find_one({"_id":item["user"].id})
            tweet = Tweets(createdAt=datetime.datetime.strptime(item["createdAt"], time_format),
                          pageID=pageID,
                          id=str(item["id"]),
                          text=item["text"],
                          source=item["source"],
                          userID=str(item["user"].id),
                          name=user["name"],
                          screenname=user["screenname"],
                          #location=user["location"],
                          #description=user["description"],
                          #statusesCount=user["statusesCount"],
                          profileImageUrl=user["profileImageUrl"],
                          profileBackgroundImageUrl=user["profileBackgroundImageUrl"])
            try:
                tweet.save()
            except Exception, e:
                print "Error",e
'''
    createdAt = DateTimeField()
    pageID = StringField(required=True)
    id = StringField(max_length=100, unique_with="pageID")
    text = StringField(max_length=300)
    source = StringField(max_length=1000)
    userID = StringField(max_length=100, required=True, unique=True, primary_key=True)
    name = StringField(max_length=100)
    screenname = StringField(max_length=100)
    location = StringField(max_length=1000)
    description = StringField(default="")
    url = StringField(default="")
    profileImageUrl = StringField(max_length=1000)
    profileBackgroundImageUrl = StringField(default="")
    statusesCount = IntField(default=0)
    followersCount = IntField(default=0)
    favouritesCount = IntField(default=0)
    friendsCount = IntField(default=0)
    listedCount = IntField(default=0)

'''

