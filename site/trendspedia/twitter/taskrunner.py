from __future__ import absolute_import
from celery import Celery
from twitter.mongoModels import Hot
from mongoengine.errors import NotUniqueError

import json
import urllib2, socket, sys
from httplib import BadStatusLine
import locale
import breadability.readable as readable
from bs4 import BeautifulSoup

from time import time

app = Celery('urls')

@app.task(queue='urls')
def summarize(id):
  start_time = time()
  page = Hot.objects(pk=id).first()
  retrieve_time = time()
  if page is None:
    return
  url = page.url
  try:
    page.crawled, summ_time, page.url, page.title, page.description, page.images = extractContentFromUrl(url)
  except:
    page.delete()
    print url, sys.exc_info()[0]
    return
  crawl_time = time()
  try:
    if page.crawled:
      page.save()
    else:
      page.delete()
  except NotUniqueError:
    orig = Hot.objects(url=page.url, pageID=page.pageID).first()
    if orig is not None:
      orig.mentionedCount = orig.mentionedCount + 1
      orig.save()
    page.delete()
  except:
    page.delete()
    print url, sys.exc_info()[0]
  duplicate_time = time()
  total_time = duplicate_time - start_time
  duplicate_time = duplicate_time - crawl_time
  crawl_time = crawl_time - retrieve_time
  crawl_time = crawl_time - summ_time
  retrieve_time = retrieve_time - start_time
  if page.crawled and total_time < 12:
    print ":>> {0}".format(total_time)
  elif page.crawled:
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
    res = urllib2.urlopen(req, timeout=12)
    content = res.read()
    url = res.geturl()
    crawled = True
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
  except socket.timeout, e:
    print 'Timeout: ' + url
  except:
    print url, sys.exc_info()[0]
  reduced_content = ""
  summ_time = 0
  try:
    start_time = time()
    if crawled:
      document = readable.Article(content, url=url, return_fragment=False)
      encoding = locale.getpreferredencoding()
      reduced_content = document.readable.encode(encoding)
    summ_time = time() - start_time
  except:
    crawled = False
    print url, sys.exc_info()[0]
  title = ""
  description = ""
  images = []
  if reduced_content == '<div id="readabilityBody" class="parsing-error"/>':
    crawled = False
  else:
    if crawled:
      bigdom = BeautifulSoup(content)
      dom = BeautifulSoup(reduced_content)
      if bigdom.title and bigdom.title.string:
        title = bigdom.title.string.strip()
      description = dom.get_text()
      images = map(lambda img: img.get('src'), dom.find_all('img'))
  return crawled, summ_time, url, title, description, images
