from __future__ import absolute_import
from celery import Celery
from twitter.mongoModels import Hot

import json
import urllib2, socket, sys
from httplib import BadStatusLine
import locale
import breadability.readable as readable
from bs4 import BeautifulSoup

from time import time

app = Celery('urls')

@app.task
def summarize(id):
  start_time = time()
  page = Hot.objects(pk=id).first()
  retrieve_time = time()
  if page is None:
    return
  url = page.url
  page.crawled, summ_time, page.url, page.title, page.description, page.images = extractContentFromUrl(url)
  crawl_time = time()
  if page.crawled == True:
    page.save()
  else:
    page.delete()
  duplicate_time = time()
  total_time = duplicate_time - start_time
  duplicate_time = duplicate_time - crawl_time
  crawl_time = crawl_time - retrieve_time
  crawl_time = crawl_time - summ_time
  retrieve_time = retrieve_time - start_time
  if page.crawled:
    print ":>>{0}, {1}, {2}, {3}, {4}".format(total_time, retrieve_time, crawl_time, summ_time, duplicate_time)

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
    url = res.geturl()
    res.close()
  except urllib2.URLError as u:
    if isinstance(u.reason, basestring):
      print 'URLError:\t\t' + url + ' --> ' + u.reason.encode('utf-8').strip()
    else:
      print url, sys.exc_info()[0]
  except urllib2.HTTPError as h:
    print 'HTTPError:\t\t' + url + ' --> ' + h.code
  except BadStatusLine:
    print 'BadStatusLine:\t' + url
  except:
    print url, sys.exc_info()[0]
  reduced_content = ""
  crawled = False
  try:
    start_time = time()
    document = readable.Article(content, url=url, return_fragment=False)
    encoding = locale.getpreferredencoding()
    reduced_content = document.readable.encode(encoding)
    crawled = True
    summ_time = time() - start_time
  except:
    print url, sys.exc_info()[0]
  title = ""
  description = ""
  images = []
  if reduced_content == '<div id="readabilityBody" class="parsing-error"/>':
    crawled = False
  else:
    bigdom = BeautifulSoup(content)
    dom = BeautifulSoup(reduced_content)
    if bigdom.title and bigdom.title.string:
      title = bigdom.title.string.strip()
    description = dom.get_text()
    images = map(lambda img: img.get('src'), dom.find_all('img'))
  return crawled, summ_time, url, title, description, images
