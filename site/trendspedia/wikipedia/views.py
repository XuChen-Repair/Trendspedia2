# Standard library imports
import logging
import inspect
import json

# Third party library
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
import requests # Requests library to make HTTP calls
from bs4 import BeautifulSoup # Library to parse XML/HTML tree

# Django utitilies 
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

"""A wrapper class of HttpResponse, returns a JSON response instead
"""
class JSONResponse(HttpResponse):
    def __init__(self, data, **kwargs):
        content = JSONRenderer().render(data)
        kwargs['content_type'] = 'application/json'
        super(JSONResponse, self).__init__(content, **kwargs)

"""Function-based view of a GET API to get the HTML content of a Wiki page

This function will receive language detection from the client, a Wiki page's
title to use an appropriate version of Wikipedia's API. It parses the 
response using BeautifulSoup, removes unecessary DOM parts and returns only
HTML text of the articles and its CSS format.

Using Wikipedia API will terminate the needs to use a custom version of 
MediaWiki with its complex API to parse the makrup langague embed inside 
the raw text in a Wikipedia dump MySQL database.

"""
def getWiki(request, lang="en"):
    #url = "http://idata-a.d1.comp.nus.edu.sg:81/mediawiki/index.php"
    infoAPI = ""
    url = ""
    # Detect the language, possibly have a better implementation
    if(lang=="en"):
        infoAPI = "http://en.wikipedia.org/w/api.php"
        url = "http://en.wikipedia.org/wiki/"
    elif(lang=="zh"):
        infoAPI = "http://zh.wikipedia.org/w/api.php"
        url = "http://zh.wikipedia.org/wiki/"
    # Only respond to GET request
    if request.method == 'GET':
        title = request.GET.get('title','') # Get the Wiki title
        if title is '':
            #title = 'Special:Random'
            title = 'Main_Page' # The default is always Wiki's homepage

        #''' For local wiki server '''
        #para = {'title':title}
        #r = requests.get(url,params=para)

        # For wiki server
        # Fetch page html
        url+=title
        r = requests.get(url)
        soup = BeautifulSoup(r.text)

        # Fetch page info
        infoParams = {
            'action' : 'query',
            'titles' : title,
            'prop' : 'info',
            'inprop' : 'protection|talkid',
            'format' : 'xml',
            'continue': ''
        }

        # Make a connection and build a DOM tree using BeautifulSoup
        infoRequest = requests.get(infoAPI,params=infoParams)
        infoSoup = infoRequest.text
        infoText = BeautifulSoup(infoSoup)
        page = infoText.api.query.pages.page # There could be more pages to parse
        try:
            pageID = page["pageid"] # Get article ID
        except:
            pageID = ""
        try:
            title = page["title"] # Get article title
        except:
            title = ""
 
        '''
        mw_head = soup.find("div", {"id": "mw-head"})
        mw_panel = soup.find("div", {"id": "mw-panel"})
        footer = soup.find("div", {"id": "footer"})
        mw_head.extract()
        mw_panel.extract()
        footer.extract()
        '''

        # Replace direct links to Wikipedia server with a custom link 
        # to the app instead
        link = soup.findAll("a") 
        for l in link:
            try:
                href = l["href"]
                ''' Local wiki replacement '''
                #mw = "/mediawiki/index.php?" 
                mw = "/wiki/"
                en_wiki = "//en.wikipedia.org/wiki/"
                zh_wiki  = "//zh.wikipedia.org/wiki/"
                if href.startswith(mw):
                    l["href"] = href.replace(mw,"/home/"+lang+"/?title=",1)
                elif href.startswith(en_wiki):
                    l["href"] = href.replace(en_wiki,"/home/en/?title=",1)
                elif href.startswith(zh_wiki):
                    l["href"] = href.replace(zh_wiki,"/home/zh/?title=",1)

            except AttributeError:
                continue
            except KeyError:
                continue

        # Remove unnecessary scripts, css and html sections 
        script = soup.findAll("script")
        stylesheet = soup.findAll("link", {"rel": "stylesheet"})
        content = soup.find("div", {"id": "content"})
        edit_section = soup.findAll("span", {"class": "editsection"})
        ''' For real wiki, remove the mbox suggesting editing the articles '''
        edit_box = soup.findAll("table", {"class": "metadata plainlinks ambox"})
        for es in edit_section:
            es.extract()
        for s in script:
            s.extract()
        for eb in edit_box:
            eb.extract()
        #script.extract()
        text = ""
        for tag in stylesheet:
            text+=(str(tag)+"\n")
        text+=str(content)

        data = {
            'pageID' : pageID,
            'title' : title,
            'text' : text
        }
        return JSONResponse(data)

"""Function-based view of a GET API to get search results of Wiki page

This function will receive language detection from the client, an user's
query to use an appropriate version of Wikipedia's Search API. It parses the 
response using BeautifulSoup, removes unecessary DOM parts and returns only
HTML text of the articles and its CSS format.

Using Wikipedia API will terminate the needs to use a custom version of 
MediaWiki with its complex API to parse the makrup langague embed inside 
the raw text in a Wikipedia dump MySQL database.

"""
def getSearchResult(request, lang):
    #api = "http://idata-a.d1.comp.nus.edu.sg:81/mediawiki/api.php"
    api = ""
    mw = ""
    # Detect the language for correct API version
    if(lang=="en"):
        api = "http://en.wikipedia.org/w/api.php"
        mw = "http://en.wikipedia.org/wiki/"
    elif(lang=="zh"):
        api = "http://zh.wikipedia.org/w/api.php"
        mw = "http://zh.wikipedia.org/wiki/"
    # Only respond to GET request
    if request.method == 'GET':
        query = request.GET.get('query','') # Get query keywords
        # Default query to search, undecided
        if query is '':
            query = 'Sp'
        # Init parameter needed for a Wikipedia API's call
        para = {
            'action' : 'opensearch',
            'limit' : 20,
            'namespace' : 0,
            'format' : 'xml',
            'search' : query
        }
        # Make a connection and build a DOM tree using BeautifulSoup
        r = requests.get(api,params=para)
        soup = BeautifulSoup(r.text)
        set = []
        #mw = "http://idata-a.d1.comp.nus.edu.sg:81/mediawiki/index.php?"
        # Extract all search results and returns as JSON format to the client
        for item in soup.findAll('item'):
            set.append({
                'text' : item.find("text").text,
                'description' : item.find("description").text,
                'url' : "/home/"+lang+"/?title=" + item.find("url").text.split('/')[-1]
                # 'url' : item.find("url").text.replace(mw,"/home/"+lang+"/?title=",1)
            })
        status = 'OK'
        data = {
            'status' : status,
            'results' : set
        }
        return JSONResponse(data)

