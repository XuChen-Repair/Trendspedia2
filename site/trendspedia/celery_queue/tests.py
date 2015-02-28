
import os, sys
sys.path.append(os.path.dirname(os.path.basename(__file__)))
from django.utils import unittest
from django.test.client import RequestFactory
from django.test.client import Client
from django.conf import settings
from django.core.cache import cache
import django
from settings.common import LOGIN_REDIRECT_URL
import views
import socket, json

class TokensQueueView(django.test.TestCase):
    fixtures = ['fixtures/fixtures.json']
    def setUp(self):
##        from social_auth.models import UserSocialAuth
##        a = UserSocialAuth.objects.get(pk=1)
##        a.save()
        import tokens_queue
        self.tq = tokens_queue.TokensQueue(None)
        pass

    def tearDown(self):
        assert settings.CACHE_BACKEND == 'locmem:///'
        [cache.delete(key) for key in cache._cache.keys()]

    # Test that tokens can be retrieved for supported commands
    def test_get_token(self):
        self.assertTrue(self.tq.retrieveToken("followersID") != None)
        self.assertTrue(self.tq.retrieveToken("followersList") != None)
        self.assertTrue(self.tq.retrieveToken("friendsID") != None)
        self.assertTrue(self.tq.retrieveToken("friendshipLookup") != None)
        self.assertTrue(self.tq.retrieveToken("stream") != None)
        self.assertTrue(self.tq.retrieveToken("search") != None)
        self.assertTrue(self.tq.retrieveToken("random") == None)

    # Test that tokens retrieved are continuously rotating
    # Note: Test only works if there's at least two tokens in the queue
    def test_rotate_token(self):
        for i in range(100):
            self.assertTrue(self.tq.retrieveToken("search") != self.tq.retrieveToken("search"))

    # Fixtures provide 2 tokens
    # Test that the number of tokens is indeed 2
    def test_token_length(self):
        self.assertTrue(self.tq.returnNumUniqueTokens() == 2)
