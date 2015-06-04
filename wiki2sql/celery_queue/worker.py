from celery import Celery
import mysql.connector
from sql import update
from mysql.connector import (connection)
from mysql.connector import errorcode
import urllib, urllib2
from urllib2 import Request, urlopen, URLError
import json

app = Celery('sample', backend='amqp', broker='amqp://')

@app.task
def consumer(id, title):
    print title
    # make query to wikipedia by title
    queryRequestUrlForPage = "http://en.wikipedia.org/w/api.php?action=query&format=json&titles=" + urllib2.quote(title.encode("utf8")) + "&prop=redirects|revisions"
    queryResponseForPage = json.load(urllib2.urlopen(queryRequestUrlForPage))
    d = {}
    d['page'] = queryResponseForPage['query']['pages'][queryResponseForPage['query']['pages'].keys()[0]]

    # revision of a certain page may be missing
    # ignore case with missing revisions
    if not 'revisions' in d['page']:
        pass
    else:
        revision_id = d['page']['revisions'][0]['revid']
        # reference for parameters: http://www.mediawiki.org/wiki/API:Revisions
        queryRequestUrlForRevision = "http://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&rvprop=content|flags|ids|comment|timestamp|sha1&revids=" + str(revision_id)
        queryResponseForRevision = json.load(urllib2.urlopen(queryRequestUrlForRevision))
        d['revision'] = queryResponseForRevision['query']['pages'][queryResponseForRevision['query']['pages'].keys()[0]]['revisions'][0]
        # update DB
        update(d)

    # delete row from waiting list
    try:
        cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb')
        cursor = cnx.cursor()
        try:
            sqlDelete = "DELETE FROM ChangeTable WHERE change_id = %s"
            cursor.execute(sqlDelete, (str(id), ))
            cnx.commit()
        except mysql.connector.Error as e:
            print e
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