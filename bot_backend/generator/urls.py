from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'articles', views.ArticleViewSet, basename='article')
router.register(r'content-plans', views.ContentPlanViewSet, basename='contentplan')

urlpatterns = [
    path('', include(router.urls)),
    path('generation-status/<int:task_id>/', views.generation_status),
    path('bulk-generate/', views.bulk_generate),
    path('internal-links/', views.generate_internal_links),

    # SEO Tools
    path('tools/keyword-difficulty/', views.keyword_difficulty_checker),
    path('tools/faq-schema/', views.faq_schema_generator),
    path('tools/article-schema/', views.article_schema_generator),
    path('tools/qa-schema/', views.qa_schema_generator),
]