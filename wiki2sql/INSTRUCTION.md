## parser.py parse wikipedia xml dump to mysql database
wikipedia xml dump can be downloaded from wikipedia
specify the location of the dump file in parser.py

mysql database schema is in schema.sql

## autosync is in /celery_queue
### run /celery_queue/processChangeFeed.py
/celery_queue/processChangeFeed.py constantly pull changes from wikipeida api and store the pages changed in table ChangeTable.

log of /celery_queue/processChangeFeed.py (for checking speed of changes vs. speed of process & if there is any changes not captured) is in stored in table Log.

### run /celery_queue/producer.py
/celery_queue/producer.py constantly get waiting pages to be updated and send to worker.py

### run /celery_queue/worker.py
run /celery_queue/worker.py receive the page to be updated and would query the current page and update the database.
