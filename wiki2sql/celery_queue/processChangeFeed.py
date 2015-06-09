# get recent changes from last fetch
# store the last modified time
# for each item
#     get the page title
#     make request(page_title) to wikipedia to get the text
#     update database:
#         if existing, update wikidb; else create new rows
import mysql.connector
from mysql.connector import (connection)
from mysql.connector import errorcode
import threading, time
import urllib, urllib2
from urllib2 import Request, urlopen, URLError
from lxml import etree
import pdb
import datetime
import json
from sql import queueChanges

def processChangeFeedOnce():    
    # get queryDate # timestamp of wikipedia dump: 20150515000000
    # for autosync
    queryDate = open('queryDate.txt').read()
    feedrecentchangesRequestUrl = 'http://en.wikipedia.org/w/api.php?action=feedrecentchanges&hideminor=&from=' + queryDate
    feedrecentchangesRequest = Request(feedrecentchangesRequestUrl)

    try:
        cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb')
        cursor = cnx.cursor()
        try:
            mostRecent = ''
            mostBack = ''
            count = 0

            feedrecentchangesResponse = urlopen(feedrecentchangesRequest)
            result = feedrecentchangesResponse.read()
            recentChanges = etree.fromstring(result)
            # reverse the sequence of recent changes to process the old changes first
            itemStack = []

            run = True
            for element in recentChanges.iter("*"):
                if element.tag == 'item':
                    itemStack.append(element)
                    if (run):
                        for subElement in element:
                            if subElement.tag == 'pubDate':
                                mostRecent_text = subElement.text
                                mostRecent = datetime.datetime.strptime(mostRecent_text,"%a, %d %b %Y %H:%M:%S %Z").strftime("%Y%m%d%H%M%S")
                                run = False
                                break
            itemStack = itemStack

            run = True
            if len(itemStack) > 0:
                for item in reversed(itemStack):
                    if (run):
                        for subElement in item:
                            if subElement.tag == 'pubDate':
                                mostBack_text = subElement.text
                                mostBack = datetime.datetime.strptime(mostBack_text,"%a, %d %b %Y %H:%M:%S %Z").strftime("%Y%m%d%H%M%S")
                                run = False
                                break
                
                for item in reversed(itemStack):
                    count = count + 1
                    page_title = ''
                    timestamp = '' 
                    for subElement in item:
                        if subElement.tag == 'title':
                            page_title = subElement.text.encode("utf8")
                        elif subElement.tag == 'pubDate':
                            timestamp = datetime.datetime.strptime(subElement.text,"%a, %d %b %Y %H:%M:%S %Z").strftime("%Y%m%d%H%M%S")
                    if len(page_title) > 0 and len(timestamp) == 14:
                        queueChanges(timestamp, page_title)

            if queryDate == mostBack:
                noMissing = True
            else:
                noMissing = False

            queryDateFile = 'queryDate.txt'
            output = open(queryDateFile, 'w')
            output.write(mostRecent)

            log_text = ("INSERT INTO Log "
                "(log_id, log_mostRecent, log_mostBack, log_count, log_noMissing) "
                "VALUES (%s, %s, %s, %s,%s);")
            data_log = (None,
                mostRecent,
                mostBack,
                count,
                noMissing)
            cursor.execute(log_text, data_log)
            cnx.commit()

        except URLError, e:
            print 'Error code:', e
            cnx.rollback()
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Something is wrong with your user name or password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print("Database does not exist")
        else:
            print(err)
    else:
        cnx.close()

def sync():
    while True:
        processChangeFeedOnce()
        time.sleep(5)

try:
    t = threading.Thread(target=sync)
    t.daemon = True
    t.start()
    while True:
        if not t.is_alive():
            logger.critical(json.dumps({"message":"Autosync crashed, restarting thread."}))
            t = threading.Thread(target=sync)
            t.daemon = True
            t.start()        
except (KeyboardInterrupt, SystemExit):
    pass
