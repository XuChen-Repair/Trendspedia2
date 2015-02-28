import pymongo
import twitter.helper
o = twitter.helper.TopEvents('./stopwords.txt')
from pymongo import MongoClient
client = MongoClient()
db = client['cs3281']
collection = db.tweets

