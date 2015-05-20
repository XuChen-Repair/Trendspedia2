import datetime, time, threading, logging, json, inspect, pdb
import pika
from twitter.mongoModels import Topics
from twython import Twython
from django.conf import settings
from celery_queue import tokens_queue, tokens_producer
from twitter.helper import Helper

## Monitors and makes sure that the thread is always running
logger = tokens_producer.createLogger("crawler_log", True)
def start():
  try:
    t = threading.Thread(target=run)
    t.daemon = True
    t.start()
    while True:
      if not t.is_alive():
        logger.critical(json.dumps({"message":"Crawler crashed, restarting thread."}))
        t = threading.Thread(target=run)
        t.daemon = True
        t.start()
      time.sleep(30)
  except (KeyboardInterrupt, SystemExit):
    return

def run():
  logger.info(json.dumps({"message":"Crawler started."}))
  while True:
    topic = Topics.objects.order_by('priority','lastSearchedAt').first()
    if topic is None:
      logger.info("Nothing to crawl")
      time.sleep(3);
      continue
    logger.info("Searching query = '" + topic.query + "'")
    #Search returns the time to sleep so that searches can continue without
    #hiccups from twitter, need to improve the design later
    timetosleep = search(topic.query, topic.pageID, topic.sinceID)
    topic.priority = topic.priority + 1
    topic.lastSearchedAt = datetime.datetime.now()
    topic.save()
    #Sleep just enough to circumvent the twitter limits
    logger.info("Sleeping for " + str(timetosleep) + " seconds")
    time.sleep(timetosleep)

def search(query, pageID, since):
  #query, pageID, result_type=recent, count=100
  #Get a token
  channel = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost')).channel()
  channel.queue_declare(queue='tokens_queue')
  channel.basic_publish(exchange='',
    routing_key='tokens_queue',
    body='search')
  channel.queue_declare(queue='search')
  method_frame, header_frame, token = channel.basic_get(queue='search')
  print "receiver_dump = ", token
  token, timetosleep = json.loads(token)
  timetosleep = timetosleep * 1.5 # buffer time
  t = Twython(
        app_key=settings.TWITTER_CONSUMER_KEY,
        app_secret=settings.TWITTER_CONSUMER_SECRET,
        oauth_token=token['oauth_token'],
        oauth_token_secret=token['oauth_token_secret'])
  queryResults = t.search(q=query, result_type='recent', count=100, since_id=since)
  Helper().updateWikiArticleTweet(pageID, queryResults)
  # Copied from search_with_tokens in twitter/views.py
  # ----------
  # Get the correct logger based on convention:
  # {APP}.{FILE}.{FUNCTION} = __name__.'.'.inspect.stack()[0][3]
  # Need to evaulate performance of 'inspect' library as print function name
  # is not supported by Python
  # print __name__+"."+inspect.stack()[0][3]
  logger2 = logging.getLogger(__name__+"."+inspect.stack()[0][3])
  # Fake infomation, to be updated later
  logger2.info(json.dumps({
      "pageID": pageID, # Pass the correct pageID here
      "queryType": "search",
      "query": queryResults["search_metadata"]["query"],
      "tweetsCount": queryResults["search_metadata"]["count"],
      "source": 'TwitterAPI',
  }))
  return timetosleep