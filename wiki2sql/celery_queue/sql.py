import mysql.connector
from mysql.connector import (connection)
from mysql.connector import errorcode
import datetime
import json
import re

# for processing wikipedia recent changes
def update(dict):
    if not dict:
        print "No page received."
    else:
        page = dict['page']
        revision = dict['revision']
        pageid = dict['page']['pageid']
        try:
            cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb')
            cursor = cnx.cursor()
            try:
                sqlq = "SELECT * FROM page WHERE page_id = %s" 
                cursor.execute(sqlq, (str(pageid), ))
                row = cursor.fetchone()
                if row is not None:
                    # check whether revision already exist
                    revid = dict['revision']['revid']
                    sqlq2 = "SELECT * FROM revision WHERE rev_id = %s"
                    cursor.execute(sqlq2, (str(revid), ))
                    if cursor.fetchone():
                        updateTextOnUpdate(cnx, cursor, page, revision)
                    else:                    
                        insertRevisionOnUpdate(cnx, cursor, page, revision)
                else:
                    revid = dict['revision']['revid']
                    sqlq2 = "SELECT * FROM revision WHERE rev_id = %s"
                    cursor.execute(sqlq2, (str(revid), ))
                    if cursor.fetchone():
                        # case from wikipedia
                        # where a page id may not exist but its revision already exist
                        # write to UnknownCase.txt                    
                        f=open("UnknownCase.txt",'a')
                        f.write(str(pageid))
                        f.write(", ")
                        f.write(str(revid))
                        f.write("\n")
                        f.close()
                    else:
                        insertOnUpdate(cnx, cursor, page, revision)
            except mysql.connector.Error as e:
                print e
                cnx.rollback()
                f=open("notSuccessful.txt",'a')
                json.dump(dict, f)
                f.write(str(e))
                f.close()
        except mysql.connector.Error as err:
            if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
                print("Something is wrong with your user name or password")
            elif err.errno == errorcode.ER_BAD_DB_ERROR:
                print("Database does not exist")
            else:
                print(err)
        else:
            cnx.close()

# new page is created on wikipeida
def insertOnUpdate(cnx, cursor, page, revision):
    if 'redirects' in page:
        page_is_redirect = 1
    else:
        page_is_redirect = 0

    add_text = ("INSERT INTO text "
        "(text_id, text_text, text_page, text_revision) "
        "VALUES (%s, %s, %s, %s);")
    data_text = (None,
        (revision.get('*') or ''),
        page.get('pageid'),
        revision.get('revid'))
    # Insert new text
    cursor.execute(add_text, data_text)
    # Get text_id 
    text_id = cursor.lastrowid           
    add_page = ("INSERT INTO page "
        "(page_id, page_namespace, page_title, page_is_redirect, page_revision) "
        "VALUES (%s, %s, %s, %s, %s);")
   
    data_page = (page.get('id'),
        page.get('ns'),
        (page.get('title') or ''),
        page_is_redirect,
        (revision.get('revid') or ''))
    # Insert new page
    cursor.execute(add_page, data_page)
    
    if 'minor' in revision:
        minor = 1
    else:
        minor = 0
    # timestamp format conversion
    # timestamp format used in wiki objects: http://www.mediawiki.org/wiki/Manual:WfTimestamp                
    date_text = revision.get('timestamp')
    date = datetime.datetime.strptime(date_text,"%Y-%m-%dT%H:%M:%SZ")
    dateInBinary14 = date.strftime("%Y%m%d%H%M%S")

    add_revision = ("INSERT INTO revision "
        "(rev_id, rev_page, rev_parent_id, rev_timestamp, rev_text_id, rev_comment, rev_minor_edit, rev_sha1) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s);")
    rev_sha1 = base36encode(int(revision.get('sha1'), 16))
    data_revision = (
        revision.get('revid'), 
        page.get('pageid'), 
        revision.get('parentid'),
        dateInBinary14,
        text_id,
        (revision.get('comment') or ''),
        minor,
        rev_sha1)
    # Insert new revision
    cursor.execute(add_revision, data_revision)
    
    cnx.commit()

# existing page is updated on wikipedia (new revision)
def insertRevisionOnUpdate(cnx, cursor, page, revision):
    if 'redirects' in page:
        page_is_redirect = 1
    else:
        page_is_redirect = 0
    add_text = ("INSERT INTO text "
        "(text_id, text_text, text_page, text_revision) "
        "VALUES (%s, %s, %s, %s);")
    data_text = (None,
        (revision.get('*') or ''),
        page.get('pageid'),
        revision.get('revid'))
    # Insert new text
    cursor.execute(add_text, data_text)
    # Get text_id 
    text_id = cursor.lastrowid
    
    if 'minor' in revision:
        minor = 1
    else:
        minor = 0
    # timestamp format conversion
    # timestamp format used in wiki objects: http://www.mediawiki.org/wiki/Manual:WfTimestamp                
    date_text = revision.get('timestamp')
    date = datetime.datetime.strptime(date_text,"%Y-%m-%dT%H:%M:%SZ")
    dateInBinary14 = date.strftime("%Y%m%d%H%M%S")

    add_revision = ("INSERT INTO revision "
        "(rev_id, rev_page, rev_parent_id, rev_timestamp, rev_text_id, rev_comment, rev_minor_edit, rev_sha1) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s);")
    rev_sha1 = base36encode(int(revision.get('sha1'), 16))
    data_revision = (
        revision.get('revid'), 
        page.get('pageid'), 
        revision.get('parentid'),
        dateInBinary14,
        text_id,
        (revision.get('comment') or ''),
        minor,
        rev_sha1)
    # Insert new revision
    cursor.execute(add_revision, data_revision)

    update_page = ("UPDATE page SET page_revision = %s WHERE page_id = %s;")
    data_page = ((revision.get('revid') or ''), page.get('id'))
    # Update page
    cursor.execute(update_page, data_page)
    
    cnx.commit()

# existing page exsiting revision is updated on wikipedia
def updateTextOnUpdate(cnx, cursor, page, revision):
    if 'redirects' in page:
        page_is_redirect = 1
    else:
        page_is_redirect = 0

    add_text = ("INSERT INTO text "
        "(text_id, text_text, text_page, text_revision) "
        "VALUES (%s, %s, %s, %s);")
    data_text = (None,
        (revision.get('*') or ''),
        page.get('pageid'),
        revision.get('revid'))
    # Insert new text
    cursor.execute(add_text, data_text)
    # Get text_id 
    text_id = cursor.lastrowid
    
    if 'minor' in revision:
        minor = 1
    else:
        minor = 0
    # timestamp format conversion
    # timestamp format used in wiki objects: http://www.mediawiki.org/wiki/Manual:WfTimestamp                
    date_text = revision.get('timestamp')
    date = datetime.datetime.strptime(date_text,"%Y-%m-%dT%H:%M:%SZ")
    dateInBinary14 = date.strftime("%Y%m%d%H%M%S")

    add_revision = ("UPDATE revision SET rev_parent_id = %s, rev_timestamp = %s, rev_text_id = %s, rev_comment = %s, rev_minor_edit = %s, rev_sha1 = %s WHERE rev_id = %s;")
    rev_sha1 = base36encode(int(revision.get('sha1'), 16))
    data_revision = (revision.get('parentid'),
        dateInBinary14,
        text_id,
        (revision.get('comment') or ''),
        minor,
        rev_sha1,
        revision.get('revid'))
    # Update revision
    cursor.execute(add_revision, data_revision)
    cnx.commit()

# base36 helper function
def base36encode(number, alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
    """Converts an integer to a base36 string."""
    if not isinstance(number, (int, long)):
        raise TypeError('number must be an integer')
    base36 = ''
    sign = ''
    if number < 0:
        sign = '-'
        number = -number
    if 0 <= number < len(alphabet):
        return sign + alphabet[number]
    while number != 0:
        number, i = divmod(number, len(alphabet))
        base36 = alphabet[i] + base36
    return sign + base36

def base36decode(number):
    return int(number, 36)

def queueChanges(timestamp, title):
    try:
        cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb')
        cursor = cnx.cursor()
        try:
            exist = "SELECT * FROM ChangeTable WHERE change_page_title = %s AND flag = %s"
            cursor.execute(exist, (title, 0))
            if cursor.fetchone() is None:
                add_change = ("INSERT INTO ChangeTable "
                "(change_page_title, change_timestamp, flag) "
                "VALUES (%s, %s, %s);")
                change_text = (title, timestamp, 0)
                # Insert new changes
                cursor.execute(add_change, change_text)
                cnx.commit()
            else:
                pass
        except mysql.connector.Error as e:
            print e
            cnx.rollback()
            f=open("notSuccessful.csv",'a')
            f.write(title)
            f.write(", ")
            f.write(timestamp)
            f.write(", ")
            f.write(str(e))
            f.write("\n")
            f.close()

    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Something is wrong with your user name or password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print("Database does not exist")
        else:
            print(err)
    else:
        cnx.close()

# text_text from table text is in wiki markup language.
# process page links from text_text
def updatePagelinks(page_id, page_title):
    existingLinkIds = []
    added_ids = []
    newLinkIdsInExistingIds = []

    try:
        cnx = connection.MySQLConnection(user='root', password='', host='localhost', database='wikidb', buffered=True)
        cursor = cnx.cursor()

        # get pagelinks
        sqlSelectPage = "SELECT page_namespace, page_revision FROM page WHERE page_id = %s"
        cursor.execute(sqlSelectPage, (page_id, ))
        row = cursor.fetchone()
        # flag for whehter the given page have links
        pagelinksExistFlag = False

        if row:
            rev_id = row[1]
            page_namespace = row[0]
            sqlSelectPage = "SELECT rev_text_id FROM revision WHERE rev_id = %s"
            cursor.execute(sqlSelectPage, (rev_id, ))
            row = cursor.fetchone()
            if row:                
                text_id = row[0]
                sqlSelectText = "SELECT text_text FROM text WHERE text_id = %s"
                cursor.execute(sqlSelectText, (text_id, ))
                row = cursor.fetchone()
                if row:
                    text = row[0]
                    # get all links in [[]]
                    links = re.findall(r"(?<=\[\[)(.*?)(?=\]\])", text)
                    if links:
                        pagelinksExistFlag = True

        # get all old pagelinks
        sqlSelectExisting = "SELECT pl_id FROM pagelinks WHERE pl_from_id = %s"
        cursor.execute(sqlSelectExisting, (str(page_id), ))
        existingLinkIds = cursor.fetchall()

        def convert(link):
            link = list(link)
            link = link[0]
            return link
        existingLinkIds = map(convert, existingLinkIds)

        # insert new links
        if pagelinksExistFlag:
            for link in links:                
                link_titles = link.decode("utf8")
                # for link in the format of [[XX|YY]], get XX.
                link_title = re.findall(r"^[^\|]+", link_titles)[0]

                # flag for whether the link is not the page itself and is an existing page in db
                flag = False
                if page_title != link_title:
                    sqlCheckExistenceOfPage = "SELECT page_id FROM page WHERE page_title = %s"
                    cursor.execute(sqlCheckExistenceOfPage, (link_title, ))
                    row = cursor.fetchone()
                    if row is not None:
                        link_id = row[0]
                        flag = True

                if flag:
                    if link_id in existingLinkIds:
                        newLinkIdsInExistingIds.append(link_id)
                    elif link_id in added_ids:
                        pass
                    else:
                        add_link = ("INSERT INTO pagelinks "
                            "(pl_from_id, pl_from_title, pl_namespace, pl_id, pl_title) "
                            "VALUES (%s, %s, %s, %s, %s);")
                        data_link = (page_id,
                            page_title,
                            page_namespace,
                            link_id,
                            link_title)
                        cursor.execute(add_link, data_link)
                        cnx.commit()
                        added_ids.append(link_id)

            # remove duplicate in newLinkIdsInExistingIds
            newLinkIdsInExistingIds = list(set(newLinkIdsInExistingIds))
            for newLinkIdInExistingIds in newLinkIdsInExistingIds:
                existingLinkIds.remove(newLinkIdInExistingIds)

            for idTORemove in existingLinkIds:
                sqlDeleteLink = "DELETE FROM pagelinks WHERE pl_from_id = %s AND pl_id = %s"
                cursor.execute(sqlDeleteLink, (page_id, idTORemove))
                cnx.commit()

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
