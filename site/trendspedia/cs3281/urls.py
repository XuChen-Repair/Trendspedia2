from django.conf.urls import patterns, include, url
from django.views.generic import RedirectView

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'twitter.views.home', name='home'),
    # url(r'^twitter/', include('twitter.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),

    # Begin here
    url(r'^$', 'twitter.views.home', {'lang' : 'en'}),
    url(r'^test_celery', 'celery_queue.views.dummy_celery'),
    url(r'^twitter/', include('twitter.urls')),
    url(r'', include('social_auth.urls')),
    url(r'', include('wikipedia.urls')),
    url(r'^login/$', RedirectView.as_view(url='/login/twitter')),
    url(r'^private$', 'twitter.views.private'),
    url(r'^home$', 'twitter.views.home', {'lang' : 'en'}),
    url(r'^home/(\w{2})/$', 'twitter.views.home'),
    url(r'^logout/$', 'twitter.views.logout_view'),
)
