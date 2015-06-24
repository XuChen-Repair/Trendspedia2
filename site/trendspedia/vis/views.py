from django.http import HttpResponse
from django.template import Context, loader, RequestContext
import requests
import mysql.connector
from mysql.connector import (connection)
from mysql.connector import errorcode
import json
import random

# get all pagelinks in a page
def getAllPLs(request):
    print "getAllPLs called."
    params = request.GET
    page_id = params.get("pageID")
    try:
        cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb')
        cursor = cnx.cursor()
        get_pagelinks = "SELECT pl_id, pl_title FROM pagelinks WHERE pl_from_id = %s;"
        cursor.execute(get_pagelinks, (str(page_id), ))
        pagelinks = cursor.fetchall()
        def convert(link):
            link = list(link)
            link[1] = link[1].decode('utf-8')
            return link
        pagelinks = map(convert, pagelinks)
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Something is wrong with your user name or password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print("Database does not exist")
        else:
            print(err)
    else:
        cnx.close()
    return HttpResponse(json.dumps(pagelinks))

def selectNodes(request, format):
    t = loader.get_template('selectNodes.html') 
    c = RequestContext(request, {})
    return HttpResponse(t.render(c))