# Standard library imports
import datetime

# Third party library
from mongoengine import *

# Local application and Django
from django.conf import settings

# Connecto mongoDB instance
connect(settings.MONGO_CONNECTION["database"])
        #username=settings.MONGO_CONNECTION["username"],
        #password=settings.MONGO_CONNECTION["password"])

"""A Model class based on Mongo Engine model to represent a log document(entry)

This is an abstraction to save a logging message from Twitter API module. Each
field is an attribute of a document saved in a collection of a database in 
MongoDB. Set 'meta' attributes to specify some properties of the collection 
like Capped Collections, etc...

"""
class RequestLog(Document):
    query = StringField(max_length=1000, required=True)
    queryType = StringField(max_length=1000, required=True)
    pageID = StringField(max_length=10, required=True)
    time = DateTimeField(default=datetime.datetime.now)
    source = StringField(max_length=10)
    tweetsCount = IntField()
    crawlFlag = BooleanField(default=False)
