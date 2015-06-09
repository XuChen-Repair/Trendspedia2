from sql import updatePagelinks
import mysql.connector
from mysql.connector import (connection)
from mysql.connector import errorcode

try:
    cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb')
    cursor = cnx.cursor()

    lastPageID = open('lastPageID_allPagelinks.txt').read()
    sqlSelectPage = "SELECT page_id, page_title FROM page WHERE page_id > %s;"
    cursor.execute(sqlSelectPage, (lastPageID, ))
    for row in cursor:
        page_id = row[0]
        page_title = row[1].decode("utf8")
        print page_title + ": Start..."
        updatePagelinks(page_id, page_title)
        f=open('lastPageID_allPagelinks.txt','w')
        f.write(str(page_id))
        

except mysql.connector.Error as err:
    if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("Something is wrong with your user name or password")
    elif err.errno == errorcode.ER_BAD_DB_ERROR:
        print("Database does not exist")
    else:
        print(err)
else:
    cnx.close()