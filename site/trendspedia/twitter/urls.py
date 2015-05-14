from django.conf.urls import patterns, include, url
from django.views.generic import DetailView, ListView
from rest_framework.urlpatterns import format_suffix_patterns
import twitter.views

urlpatterns = patterns('twitter.views',
##    url(r'^$', 'tweet_post'),
##    url(r'^(?P<pk>[0-9]+)$', 'tweet_detail'),
    url(r'^private$', 'private'),
    url(r'^logout/$', 'logout_view'),
    url(r'^addtask/(?P<queryType>.+)/$', 'addTask'),
    url(r'^api/(?P<queryType>.+)/$', 'search'),
    url(r'^hotMaterials$', 'hotMaterials'),
    #url(r'^hotImage$', 'hotImage'),
    url(r'^getEvents/(?P<topic>.+)/$', 'getEvents'),
    #DY
    url(r'^getTweetsfromDB$', 'getTweetsfromDB'),
)

urlpatterns = format_suffix_patterns(urlpatterns)
