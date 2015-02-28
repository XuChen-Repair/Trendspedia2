from pymongo import Connection
import codecs, re

con = Connection()
db = con['cs3281']
wikiCol = db['wiki_article']
wordPattern = re.compile(r'[\w]+')
title_file = './wikiTitle.txt'

wordSet = set()
for doc in wikiCol.find():
    if 'pageTitle' in doc:
        title = doc['pageTitle']
        wordlist = re.findall(wordPattern, title.lower())
        for word in wordlist:
            if len(word) > 3 and len(word) < 20:
                wordSet.add(word)

fwp = codecs.open(title_file, 'w', 'utf-8')
for word in wordSet:
    fwp.write( "%s\n" % (word) )      
fwp.close()
from pymongo import Connection
from datetime import datetime
import codecs, re 

ISOTIMEFORMAT = '%Y-%m-%d'
wikititle_file = './wikiTitle.txt'
tweet_file = './tweet.txt'
min_time = datetime.max
max_time = datetime.min
titleSet = set() # The set of titles of wiki articles 
wordSet = set() # To keep all the keywords in the tweet collection
wordPattern = re.compile(r'[\w]+')

def loadTitleSet():
    fp = codecs.open(wikititle_file, 'r', 'utf-8')
    for line in fp.readlines():
        title = line.strip()
        titleSet.add( title )
    fp.close()

def processTweets():
    global min_time, max_time
    con = Connection()
    db = con['cs3281']
    tweetCol = db['tweets']
    fwp = open(tweet_file, 'w')
    cnt = 0
    for doc in tweetCol.find():
        if 'createdAt' not in doc or 'text' not in doc:
            continue
        create_time = doc['createdAt']
        min_time = create_time if create_time < min_time else min_time
        max_time = create_time if create_time > max_time else max_time
        timeString = create_time.strftime(ISOTIMEFORMAT)
        fwp.write(timeString)
        
        text = doc['text']
        wordlist = re.findall(wordPattern, text.lower())
        for word in wordlist:
            if word in titleSet:
                wordSet.add( word )
                fwp.write(" %s" % word)
        
        fwp.write("\n")
        cnt += 1
        if cnt % 10000 == 0:
            print cnt
    fwp.close()

def writeWordSet():
    wordList = list( wordSet )
    wordList.sort()
    fp = open('TweetWords.txt', 'w')
    for word in wordList:
        fp.write("%s\n" % word )
    fp.close()

def run():
    loadTitleSet()
    processTweets()
    writeWordSet()
    print min_time, max_time

run()
# Find relevant words for each term

from datetime import datetime

import string, time, operator, re, nltk



class TopEvents:

    ISOTIMEFORMAT = '%Y-%m-%d'

    start_time = time.strptime('2015-02-01', ISOTIMEFORMAT) #start time of the twitter data set

    day_number = int((time.mktime(datetime.today().timetuple()) - time.mktime(start_time)) / 86400) #slice by day

    time_pattern = re.compile(r'\d{4}-\d{2}-\d{2}')

    term_pattern = re.compile(r'[a-zA-Z]+')

    stopwords = set()

    day_cnt_list = []

    day_doc_list = []

    day_weight_list = []

    

    def __init__(self, stopword_file):

        with open(stopword_file, 'r') as fp:

            for line in fp:

                self.stopwords.add( line.strip() )

        

    def get_top_K_events(self, tweets, alpha, K, N):

        self.initialize_days()

        self.update_days( tweets )

        top_events = self.rank_events(alpha, K) #K: number of events

        result = []

        for (day, weight) in top_events:

            freqdist = self.day_doc_list[day]

            if len( freqdist.items() ) == 0:

                continue

            word_list = []

            for word, num in freqdist.items()[:N]:  # N:number of words for each event

                word_list.append( ( word, num) )

            result.append( (day, weight, word_list) )

        return result 

    

    def initialize_days(self):

        self.day_number = int((time.mktime(datetime.today().timetuple()) - time.mktime(self.start_time)) / 86400)

        self.day_cnt_list = [0] * self.day_number

        self.day_doc_list = [nltk.FreqDist() for i in xrange(self.day_number)]

        self.day_weight_list = [0] * self.day_number

            

    def update_days(self, tweets):

        for tweet in tweets:

            time_string = re.search(self.time_pattern, tweet).group()

            post_time = time.strptime(time_string, self.ISOTIMEFORMAT)

            day = int((time.mktime(post_time) - time.mktime(self.start_time)) / 86400)

            term_list = self.get_terms( tweet )

            self.day_cnt_list[ day ] += 1

            self.day_doc_list[ day ].update( term_list )



    def get_terms(self, tweet):

        term_list = re.findall(self.term_pattern, tweet.lower())

        return [term for term in term_list if len(term) > 3 and len(term) < 20 and term not in self.stopwords]



    def rank_events(self, alpha, K):

        maxBurst = self.findMaxBurst()

        maxDay = self.getMaxDay()

        sort_list = []

        for day in xrange(self.day_number):

            weight = self.get_weight( day, maxBurst, maxDay, alpha)

            sort_list.append( (day, weight) )

        sort_list.sort( key = operator.itemgetter(1), reverse = True ) #descending order of weight

        return sort_list[:K]

        

    def findMaxBurst(self):

        maxBurst = 0

        for burst in self.day_cnt_list:

            if burst > maxBurst:

                maxBurst = burst

        return maxBurst

    

    def getMaxDay(self):

        return self.day_number

    

    def get_weight(self, day, maxBurst, maxDay, alpha):

        burst = self.day_cnt_list[day]

        return alpha*burst/maxBurst + (1-alpha)*day/maxDay



tweets = []

with open('tweet.txt', 'r') as fp:

    for line in fp:

        tweets.append( line.strip() )



te = TopEvents('stopwords')

print te.get_top_K_events(tweets, 0.5, 1, 5)


