# Standard library import
import datetime

# Third party library
from mongoengine import *

# Local application and Django
from django.conf import settings

# Connecto mongoDB instance
connect(settings.MONGO_CONNECTION["database"],
	username=settings.MONGO_CONNECTION["username"],
	password=settings.MONGO_CONNECTION["password"],
	host=settings.MONGO_CONNECTION["host"])


class TwitterUser(Document):
    """
    Schema from the full user object in Twitter API
    """
    userID = StringField(max_length=100, required=True, unique=True, primary_key=True)
    name = StringField(max_length=100)
    screenname = StringField(max_length=100)
    createdAt = StringField(max_length=100)
    location = StringField(max_length=1000)
    description = StringField(default="")
    url = StringField(default="")
    profileImageUrl = StringField(max_length=1000)
    profileImageUrlHttps = StringField()
    profileBackgroundImageUrl = StringField(default="")
    profileBackgroundImageUrlHttps = StringField(default="")
    statusesCount = IntField(default=0)
    followersCount = IntField(default=0)
    favouritesCount = IntField(default=0)
    friendsCount = IntField(default=0)
    listedCount = IntField(default=0)

class SimpleTweet(EmbeddedDocument):
    meta = {
        'indexes': [
            {'fields': ['id'],
             'unique': True},
        ]
    }
    createdAt = StringField(max_length=100)
    id = StringField(max_length=100, unique=True)
    text = StringField(max_length=300)
    source = StringField(max_length=1000)
    profileImageUrl = StringField()
    # inReplyToStatusID = StringField()
    # inReplyToUserID = StringField()
    # inReplyToScreenName = StringField()
    user = ReferenceField(TwitterUser)
    pk = StringField(default="")

#
class Topics(Document):
    priority = IntField(default=0)
    lastSearchedAt = DateTimeField(default=datetime.datetime.now)
    pageID = StringField(required=True, unique=True)
    query = StringField(required=True)
    sinceID = StringField()

class WikiArticle(Document):
    meta = {
        'collection': 'wiki_article',
        'allow_inheritance': False,
        'indexes': [{'fields': ['pageID'],
                     'unique': True}],
    }
    pageID = StringField(required=True, unique=True)
    pageTitle = StringField(unique=True)
    query = StringField()
    lastAccess = DateTimeField(default=datetime.datetime.now)
    text = StringField(default="")
    #tweets = ListField(EmbeddedDocumentField(SimpleTweet))

class HotLink(Document):
    meta = {
        'collection': 'hot_link1',
        'allow_inheritance': False,
        'indexes': [{'fields': ['pageID'],
                     'unique': True}],
    }
    pageID = StringField(required=True, unique=True)
    url = ListField(StringField())

class HotImage(Document):
    meta = {
        'collection': 'hot_image1',
        'allow_inheritance': False,
        'indexes': [{'fields': ['pageID'],
                     'unique': True}],
    }
    pageID = StringField(required=True, unique=True)
    records = ListField()

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
    id = StringField(max_length=100, primary_key=True)
    text = StringField(max_length=300)
    source = StringField(max_length=1000)
    userID = StringField(max_length=100)
    name = StringField(max_length=100)
    urls = StringField(default="")
    screenname = StringField(max_length=100)
    location = PointField()
    description = StringField(default="")
    profileImageUrl = StringField(max_length=1000)
    profileBackgroundImageUrl = StringField(default="")
    statusesCount = IntField(default=0)
    crawled = BooleanField(default=False)

class Hot(Document):
    meta = {
        'collection': 'hot',
        'allow_inheritance': False,
        'index_drop_dups': True,
        'indexes': [
            {'fields': ['pageID', 'url']},
        ]
    }
    description = StringField()
    title = StringField()
    pageID = StringField(required=True)
    tweetID = StringField(max_length=100, required=True)
    url = StringField()
    urlMD5 = StringField()
    mentionedCount = IntField(default=1)
    images = ListField()
    tweetCreatedTime = DateTimeField()
    crawled = BooleanField(default=False)

