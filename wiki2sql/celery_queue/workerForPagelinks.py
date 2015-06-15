from celery import Celery
from sql import update, updatePagelinks
import mysql.connector
from mysql.connector import (connection)
from mysql.connector import errorcode
import urllib, urllib2
from urllib2 import Request, urlopen, URLError
import json
import datetime
import re

app = Celery('allCurrentPagelinks')

@app.task(queue = 'allCurrentPagelinks')
def consumer(page_id, page_title):
    updatePagelinks(page_id, page_title)
    f=open('lastPageID_allPagelinks.txt','w')
    f.write(str(page_id))
