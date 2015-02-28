from mongoengine import *
import datetime

connect("cs3281", username="cs3281", password="cs3281")

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
            {'fields': ['id'], 'sparse': True, 'unique': True},
        ]
    }
    createdAt = StringField(max_length=100)
    id = StringField(max_length=50, unique=True)
    text = StringField(max_length=300)
    source = StringField(max_length=100)
    # inReplyToStatusID = StringField()
    # inReplyToUserID = StringField()
    # inReplyToScreenName = StringField()
    user = ReferenceField(TwitterUser)
    pk = StringField(default="")

class WikiArticle(Document):
    pageID = StringField(required=True, unique=True)
    pageTitle = StringField(unique=True)
    query = StringField()
    lastAccess = DateTimeField(default=datetime.datetime.now)
    text = StringField(default="")
    tweets = ListField(EmbeddedDocumentField(SimpleTweet))

