from celery import task
import pika
import os, json
from twitter.views import search_with_tokens

@task()
def api(queryType, params):
    print 'fuck'
    print 'abs'
    # Send tokens request
    connection = pika.BlockingConnection(pika.ConnectionParameters(
            host='localhost'))
    channel = connection.channel()
    channel.queue_declare(queue='tokens_queue')
    channel.basic_publish(exchange='',
                          routing_key='tokens_queue',
                          body=queryType)
    
    # Receive tokens generated
    channel.queue_declare(queue=queryType)
    method_frame, header_frame, token = channel.basic_get(queue=queryType)
    token = json.loads(token)
    connection.close()

    if token == None:
        return "No valid tokens availables."
    res = search_with_tokens(token, queryType, params)
    # Add a check here for rate-limited
    return res
