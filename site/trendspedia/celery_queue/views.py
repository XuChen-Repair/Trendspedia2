# Create your views here.
from django.http import HttpResponse
from celery_queue import tasks

def dummy_celery(request):
	result = tasks.api.delay("search", {"q":"python"})
	return result.get()

