from __future__ import absolute_import
from celery import Celery
from twitter.mongoModels import Tweets

import json
import urllib2
import locale
import breadability.readable as readable

app = Celery('urls')

@app.task
def summarize(tweet_id):
  tweet = Tweets.objects(pk=tweet_id).first()
  urls = json.loads(tweet.urls)
  map(extractContentFromUrl, urls)
  tweet.urls = json.dumps(urls)
  tweet.save()

def extractContentFromUrl(url):
  """
  Accepts a string URL and returns
  a dictionary(url=url, content=<summary of article at url>)
  """
  content = ""
  try:
    req = urllib2.Request(url)
    res = urllib2.urlopen(req)
    content = res.read()
    res.close()
  except urllib2.URLError as u:
    print "URL ERROR: " + u.reason
  except urllib2.HTTPError as h:
    print "HTTP Error: ", h.code
  document = readable.Article(content, url=url, return_fragment=True)
  ret = {}
  ret["url"] = url;
  encoding = locale.getpreferredencoding()
  ret["content"] = document.readable.encode(encoding)
  print "Extracted " +  url + " |= " + str(len(content)) + " ==> " + str(len(ret["content"]))
  return ret
