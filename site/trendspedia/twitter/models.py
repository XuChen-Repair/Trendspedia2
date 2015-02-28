##from django.db import models
##from django.utils import timezone
##import datetime
##
##class Tweet(models.Model):
##    # id
##    id_str = models.CharField(max_length=30, primary_key=True) # for id_str, id is ignored due to possible overflow issues
##    from_user = models.CharField(max_length=20) # Up to 15 characters, http://help.twitter.com/entries/14609-how-to-change-your-username
##    # from_user_id
##    from_user_id_str = models.CharField(max_length=30)
##    from_user_name = models.CharField(max_length=40) 
##    geo = models.CharField(max_length=30, null=True, blank=True) # TODO: not sure about this one
##    iso_language_code = models.CharField(max_length=20) # TODO: maybe can optimize length
##    #metadata =
##    profile_image_url = models.CharField(max_length=200)
##    profile_image_url_https = models.CharField(max_length=200)
##    source = models.CharField(max_length=200) # TODO: not sure about length
##    text = models.CharField(max_length=160) # Max length is 140
##    to_user = models.CharField(max_length=20, null=True, blank=True) # Up to 15 characters, http://help.twitter.com/entries/14609-how-to-change-your-username
##    # to_user_id = 	
##    to_user_id_str = models.CharField(max_length=30, null=True, blank=True)
##    to_user_name = models.CharField(max_length=40, null=True, blank=True) 
##    created_at = models.DateTimeField('created at')
##    
##    def __unicode__(self):
##        return self.id_str
##
##    class Meta:
##        ordering = ('created_at',)
##
##class URL(models.Model):
##    url = models.CharField(max_length=200, primary_key=True)
##
##class Contains(models.Model):
##    id_str = models.ForeignKey(Tweet)
##    url = models.ForeignKey(URL)
##    class Meta:
##        unique_together = (("id_str", "url"),)
##
##class TwitterUser(models.Model):
##    user_id_str = models.CharField(max_length=30, primary_key=True)
##    user = models.CharField(max_length=20, null=True, blank=True)
##    user_name = models.CharField(max_length=40, null=True, blank=True)
##
##    def __unicode__(self):
##        return self.user_id_str
##
##    class Meta:
##        ordering = ('user',)
##
##class Follow(models.Model):
##    user_id_str_followed = models.ForeignKey(TwitterUser, related_name='user_id_str_followed')
##    user_id_str_follower = models.ForeignKey(TwitterUser, related_name='user_id_str_follower') # generic.GenericForeignKey(TwitterUser)
##    class Meta:
##        unique_together = (("user_id_str_followed", "user_id_str_follower"),)
##
##class Tweeted(models.Model):
##    user_id_str = models.ForeignKey(TwitterUser)
##    id_str = models.ForeignKey(Tweet)
##
##class Responded_To(models.Model):
##    user_id_str = models.ForeignKey(TwitterUser)
##    id_str = models.ForeignKey(Tweet)
##    class Meta:
##        unique_together = (("user_id_str", "id_str"),)
##
##class Wiki_Search(models.Model):
##    search_key = models.CharField(max_length=100)
##    wiki_id = models.CharField(max_length=100)
##    class Meta:
##        unique_together = (("search_key", "wiki_id"),)
##
##class Yields(models.Model):
##    id_str = models.ForeignKey(Tweet)
##    wiki_search = models.ForeignKey(Wiki_Search)
##    class Meta:
##        unique_together = (("id_str", "wiki_search"),)
##
##
#### SAMPLE TWEET
##
####{
####"created_at": "Sat, 03 Nov 2012 17:48:57 +0000"	,
####"from_user": "ninsterrs",
####"from_user_id": 789179911,	
####"from_user_id_str": "789179911",
####"from_user_name": "Nino Noel",
####"geo": null,
####"id": 264786256553197570,
####"id_str": "264786256553197569",
####"iso_language_code": "en",
####"profile_image_url":"http://a0.twimg.com/pro...8845f3b914e_normal.jpeg",
####"profile_image_url_https":"https://si0.twimg.com/p...8845f3b914e_normal.jpeg",	
####"source":"&lt;a href=&quot;http:/...&quot;&gt;web&lt;/a&gt;",
####"text":"All I want from Singapo...ck safe @jedavidxx ! :)",
####"to_user":null,
####"to_user_id":0,
####"to_user_id_str": "0",
####"to_user_name": null
####}
##
#### TEST: insert the following. not sure how to deal with formats of date above
####{
####"created_at": "2012-06-06 11:22"	,
####"from_user": "ninsterrs",
####"from_user_id": 789179911,	
####"from_user_id_str": "789179911",
####"from_user_name": "Nino Noel",
####"geo": null,
####"id": 264786256553197570,
####"id_str": "264786256553197569",
####"iso_language_code": "en",
####"profile_image_url":"http://a0.twimg.com/pro...8845f3b914e_normal.jpeg",
####"profile_image_url_https":"https://si0.twimg.com/p...8845f3b914e_normal.jpeg",	
####"source":"&lt;a href=&quot;http:/...&quot;&gt;web&lt;/a&gt;",
####"text":"All I want from Singapo...ck safe @jedavidxx ! :)",
####"to_user":null,
####"to_user_id":null,
####"to_user_id_str": null,
####"to_user_name": null
####}
