from mongoengine import *

#connect('TweetStorage',username="cs3281",password="cs3281")

class RawMapping(Document):
    pageTitle = StringField(max_length=1000, required=True)
    pageID = StringField(max_length=10, required=True)
    tweetID = StringField(max_length=100, required=True, unique_with='pageID')
    rawTweet = StringField(max_length=50000)
    getUserInfo = BooleanField(default=False)

class RawTwitterUser(Document):
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

class TwitterRelationship():
    id = StringField(max_length=100)
    follower = ListField()

'''
class Tweet(Document):
    createdAt = StringField(max_length=100)
    id = StringField(max_length=50)
    text = StringFieild(max_length=300)
    source = StringField(max_length=100)
    truncated = BooleanField()
    in_reply_to_status_id = StringField()
    in_reply_to_user_id = StringField()
    in_reply_to_screen_name = StringField()
'''

