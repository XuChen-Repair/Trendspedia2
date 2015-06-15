from workerForPagelinks import consumer
import mysql.connector
from mysql.connector import (connection)
from mysql.connector import errorcode

try:
    cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb')
    cursor = cnx.cursor()

    lastPageID = open('lastPageID_allPagelinks.txt').read()
    sqlSelectPage = "SELECT page_id, page_title FROM page WHERE page_id > %s AND page_id < %s;"
    cursor.execute(sqlSelectPage, (lastPageID, 20000))
    for row in cursor:
        page_id = row[0]
        page_title = row[1].decode("utf8")
        consumer.delay(page_id, page_title)
        print page_title + ": Done."

except mysql.connector.Error as err:
    if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("Something is wrong with your user name or password")
    elif err.errno == errorcode.ER_BAD_DB_ERROR:
        print("Database does not exist")
    else:
        print(err)
else:
    cnx.close()
    