from __future__ import absolute_import
from celery import Celery
from twitter.mongoModels import Hot

import json
import urllib2
import locale
import breadability.readable as readable
from bs4 import BeautifulSoup

app = Celery('urls')

@app.task
def summarize(id):
  page = Hot.objects(pk=id).first()
  url = page.url
  page.crawled, page.url, page.title, page.description, page.images = extractContentFromUrl(url)
  duplicate = Hot.objects(pk__ne=id, url=page.url).first()
  if duplicate is None:
    # No duplicate URLs, save the page
    page.save()
  else:
    # Duplicate URLs exist in the DB, delete the page
    page.delete()

def extractContentFromUrl(url):
  """
  Accepts a string URL and returns 3-tuple describing the page
  (title, description, images[])
  """
  content = ""
  crawled = False
  try:
    req = urllib2.Request(url)
    res = urllib2.urlopen(req)
    content = res.read()
    crawled = True
    res.close()
  except urllib2.URLError as u:
    print "URL ERROR: ", u.reason
  except urllib2.HTTPError as h:
    print "HTTP Error: ", h.code
  document = readable.Article(content, url=url, return_fragment=False)
  encoding = locale.getpreferredencoding()
  reduced_content = document.readable.encode(encoding)
  bigdom = BeautifulSoup(content)
  dom = BeautifulSoup(reduced_content)
  title = ""
  if bigdom.title:
    title = bigdom.title.string.strip()
  description = dom.get_text()
  images = map(lambda img: img.get('src'), dom.find_all('img'))
  print "Crawled " + res.geturl() + " (" + title + ")"
  return crawled, res.geturl(), title, description, images
