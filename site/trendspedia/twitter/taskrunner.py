from __future__ import absolute_import
from celery import Celery
from twitter.mongoModels import Hot

import json
import urllib2, socket, sys
from httplib import BadStatusLine
import locale
import breadability.readable as readable
from bs4 import BeautifulSoup

app = Celery('urls')

@app.task
def summarize(id):
  page = Hot.objects(pk=id).first()
  if page is None:
    return
  url = page.url
  page.crawled, page.url, page.title, page.description, page.images = extractContentFromUrl(url)
  duplicate = Hot.objects(pk__ne=id, url=page.url, crawled=True)
  if len(duplicate) == 0 and page.crawled == True:
    # No duplicate URLs and no errors in parsing, save the page
    page.save()
  elif len(duplicate) != 0:
    # Delete all duplicate URLs and insert page (updated version)
    duplicate.delete()
    page.save()
  elif page.crawled == False:
    # Errors in parsing (or exceptions etc..)
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
  document = readable.Article(content, url=url, return_fragment=False)
  encoding = locale.getpreferredencoding()
  reduced_content = document.readable.encode(encoding)
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
  return crawled, url, title, description, images
