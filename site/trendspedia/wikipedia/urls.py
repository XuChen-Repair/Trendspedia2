from django.conf.urls import patterns, url

urlpatterns = patterns('wikipedia.views',
    url(r'^getWiki/(\w{2})/$', 'getWiki'),
    url(r'^getSearchResult/(\w{2})/$', 'getSearchResult'),
)
