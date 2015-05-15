# Deployment of trendspedia.com

Project folder at  
`/Users/shubhamgoyal/NUS/SeSaMe/Trendspedia2/site/trendspedia/`

## Nginx
Nginx is our internet-facing server. If any request starts
with `/static/` it is redirected to the static directory of
our project, otherwise it is proxied to the Gunicorn
server running at `http://127.0.0.1:8001`.

Nginx configuration file at  
`/usr/local/etc/nginx/nginx.conf`

Make sure it reflects `nginx_orig.conf` committed to the repo.
Especially the server and location blocks.

Nginx logs at 
`/usr/local/var/log/nginx/`  

Use `tail -f <filename>` to watch requests realtime.

`nginx -h` gives a list of useful commands. To restart nginx 
for whatever reason use `nginx -s reload`, the 
likelihood of this is small. In most cases it's sufficient to
restart Gunicorn. If nginx is not already running simply
use the `nginx` command without arguments to start it up.

## wsgi.py
Make sure `DJANGO_SETTINGS_MODULE` in `cs3281/wsgi.py` is set to
`settings.deployment`. During development you may set this to
`settings.development`.

## Other options
Make sure MySQL, MongoDB and RabbitMQ are running

``
mysqld  
mongod --dbpath={where db directory is}
rabbitmq-server -detached
``

Make sure there is at least one celery worker scraping URLs in tweets.
``
python manage.py celery -A twitter.taskrunner worker
``

## Gunicorn
Gunicorn is the server that runs the Django code. It is essentially
a production-ready replacement to the `manage.py runserver` option 
used for development.

To run it, use  
`gunicorn cs3281.wsgi:application --bind 127.0.0.1:8001 -D`  

The `-D` runs it in daemonized mode. Adjust other options as required.
The port is important because this port is where nginx will send
requests to.