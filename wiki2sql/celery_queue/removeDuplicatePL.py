import mysql.connector
from mysql.connector import (connection)
from mysql.connector import errorcode

try:
    cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb')
    cursor = cnx.cursor()

    count = 0
    sqlFindDuplicate = "SELECT pl_from_id, pl_from_title, pl_namespace, pl_id, pl_title, count(*) FROM pagelinks GROUP BY pl_from_id, pl_id HAVING count(*) > 1;"
    cursor.execute(sqlFindDuplicate)
    duplicates = cursor.fetchall()
    if duplicates:
        for duplicate in duplicates:
            count = count + 1
            pl_from_id = duplicate[0]
            pl_from_title = duplicate[1]
            pl_namespace = duplicate[2]
            pl_id = duplicate[3]
            pl_title = duplicate[4]
            sqlDeleteDuplicate = "DELETE FROM pagelinks WHERE pl_from_id = %s AND pl_id = %s"
            data_duplicate = (pl_from_id, pl_id)
            cursor.execute(sqlDeleteDuplicate, data_duplicate)
            cnx.commit()            
            print "DELETED pl_from_id - " + str(pl_from_id) + ", pl_id - " + str(pl_id)
            sqlInsertBackOne = ("INSERT INTO pagelinks "
                "(pl_from_id, pl_from_title, pl_namespace, pl_id, pl_title) "
                "VALUES (%s, %s, %s, %s, %s);")
            insertBack_data = (pl_from_id,
                pl_from_title,
                pl_namespace,
                pl_id,
                pl_title)
            cursor.execute(sqlInsertBackOne, insertBack_data)
            cnx.commit()
            print "INSERTD back one."
            print str(count)
    print "Done"
except mysql.connector.Error as err:
    if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("Something is wrong with your user name or password")
    elif err.errno == errorcode.ER_BAD_DB_ERROR:
        print("Database does not exist")
    else:
        print(err)
else:
    cnx.close()
