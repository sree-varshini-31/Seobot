from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from rest_framework.response import Response
import json

from .models import Article, ContentPlan, ContentTemplate, GenerationTask, Backlink
from .services import content_generator, backlink_builder
from .serializers import ArticleSerializer, ContentPlanSerializer, BacklinkSerializer
from projects.models import Project


class ArticleViewSet(viewsets.ModelViewSet):
    """API for managing articles — users see only their own project articles."""
    serializer_class = ArticleSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            qs = Article.objects.all().order_by("-created_at")
        else:
            qs = Article.objects.filter(project__user=user).order_by("-created_at")
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs.select_related("project")

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """Generate a full long-form article for a project."""
        project_id   = request.data.get("project_id")
        keyword      = request.data.get("keyword", "").strip()
        template_type = request.data.get("template_type", "blog")
        youtube_url  = request.data.get("youtube_url", "")

        if not project_id or not keyword:
            return Response({"error": "project_id and keyword are required"}, status=400)

        try:
            if request.user.is_staff:
                project = Project.objects.get(id=project_id)
            else:
                project = Project.objects.get(id=project_id, user=request.user)

            article, task = content_generator.generate_article(
                project, keyword, template_type, youtube_url or None
            )
            return Response({
                "success": True,
                "article_id": str(article.id),
                "task_id": task.id,
                "status": task.status,
                "title": article.title,
                "word_count": article.word_count,
                "reading_time": article.reading_time,
            })
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
        except ValueError as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=["post"])
    def optimize(self, request, pk=None):
        """Optimize existing article for SEO."""
        article = self.get_object()
        try:
            result = content_generator.optimize_content(article.content, article.primary_keyword)
            article.seo_score = result.get("seo_score", 0)
            article.save()
            return Response({"success": True, "optimization": result})
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Mark article as published."""
        article = self.get_object()
        article.status = "published"
        article.save()
        return Response({"success": True, "status": "published"})


class ContentPlanViewSet(viewsets.ModelViewSet):
    """API for content planning."""
    serializer_class = ContentPlanSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return ContentPlan.objects.all().order_by("-created_at")
        return ContentPlan.objects.filter(project__user=user).order_by("-created_at")

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """Generate a 12-month content plan for a project."""
        project_id = request.data.get("project_id")
        if not project_id:
            return Response({"error": "project_id is required"}, status=400)

        try:
            if request.user.is_staff:
                project = Project.objects.get(id=project_id)
            else:
                project = Project.objects.get(id=project_id, user=request.user)

            plan = content_generator.generate_content_plan(project)
            return Response({
                "success": True,
                "plan_id": plan.id,
                "title": plan.title,
                "content_pillars": plan.content_pillars,
                "monthly_topics": plan.monthly_topics,
                "target_keywords": plan.target_keywords,
            })
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_internal_links(request):
    """
    Analyze all articles in a project and suggest internal linking opportunities.
    POST body: {"project_id": 123}
    """
    project_id = request.data.get("project_id")
    if not project_id:
        return Response({"error": "project_id is required"}, status=400)

    try:
        if request.user.is_staff:
            project = Project.objects.get(id=project_id)
        else:
            project = Project.objects.get(id=project_id, user=request.user)

        suggestions = content_generator.generate_internal_linking(project)
        return Response({
            "success": True,
            "project_id": project_id,
            "total_articles_analyzed": Article.objects.filter(project=project).count(),
            "suggestions": suggestions,
        })
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generation_status(request, task_id):
    """Check article generation task status."""
    try:
        task = GenerationTask.objects.get(id=task_id)
        # User can only check their own tasks
        if not request.user.is_staff and task.article.project.user != request.user:
            return Response({"error": "Not found"}, status=404)
        return Response({
            "status": task.status,
            "progress": task.progress,
            "error_message": task.error_message,
            "article_id": str(task.article.id) if task.article else None,
        })
    except GenerationTask.DoesNotExist:
        return Response({"error": "Task not found"}, status=404)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bulk_generate(request):
    """Generate multiple articles for a project at once (max 5)."""
    project_id    = request.data.get("project_id")
    keywords      = request.data.get("keywords", [])
    template_type = request.data.get("template_type", "blog")

    if not project_id or not keywords:
        return Response({"error": "project_id and keywords are required"}, status=400)

    keywords = keywords[:5]  # cap at 5 to avoid overwhelming Groq

    try:
        if request.user.is_staff:
            project = Project.objects.get(id=project_id)
        else:
            project = Project.objects.get(id=project_id, user=request.user)

        tasks = []
        for keyword in keywords:
            article, task = content_generator.generate_article(project, keyword, template_type)
            tasks.append({
                "keyword": keyword,
                "article_id": str(article.id),
                "task_id": task.id,
                "status": task.status,
                "title": article.title,
            })

        return Response({
            "success": True,
            "message": f"Generated {len(tasks)} articles",
            "tasks": tasks,
        })
    except Project.DoesNotExist:
        return Response({"error": "Project not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def keyword_difficulty_checker(request):
    """Check keyword difficulty using SerpAPI."""
    if request.method == "GET":
        return Response({"message": "POST {keywords: ['kw1', 'kw2']} to check difficulty"})

    keywords = request.data.get("keywords", [])
    if not keywords:
        return Response({"error": "keywords are required"}, status=400)

    import os
    from serp.services import get_serp_results
    if not os.getenv('SERPAPI_API_KEY'):
        return Response({"success": False, "error": "SERPAPI_API_KEY is not configured in environment"}, status=500)

    results = []

    try:
        for keyword in keywords[:10]:
            serp = get_serp_results(keyword, num_results=10)
            n = len(serp)
            difficulty = 70 if n >= 9 else 45 if n >= 6 else 20
            competition = "High" if n >= 9 else "Medium" if n >= 6 else "Low"
            results.append({
                "keyword": keyword,
                "difficulty": difficulty,
                "serp_results_found": n,
                "competition": competition,
            })

        return Response({"success": True, "results": results})
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def faq_schema_generator(request):
    """Generate FAQ schema markup (JSON-LD)."""
    questions = request.data.get("questions", [])
    answers   = request.data.get("answers", [])
    if len(questions) != len(answers):
        return Response({"error": "Questions and answers count must match"}, status=400)

    schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in zip(questions, answers)
        ],
    }
    return Response({"success": True, "schema": json.dumps(schema, indent=2)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def article_schema_generator(request):
    """Generate Article schema markup (JSON-LD)."""
    title        = request.data.get("title")
    description  = request.data.get("description")
    author       = request.data.get("author", "SEO Bot AI")
    publish_date = request.data.get("publish_date", "")
    image_url    = request.data.get("image_url", "")

    if not title or not description:
        return Response({"error": "title and description are required"}, status=400)

    schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "image": image_url,
        "author": {"@type": "Person", "name": author},
        "publisher": {"@type": "Organization", "name": "SEO Bot AI"},
        "datePublished": publish_date,
        "dateModified": publish_date,
    }
    return Response({"success": True, "schema": json.dumps(schema, indent=2)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def qa_schema_generator(request):
    """Generate Q&A schema markup (JSON-LD)."""
    question = request.data.get("question")
    answer   = request.data.get("answer")
    author   = request.data.get("author", "SEO Bot AI")

    if not question or not answer:
        return Response({"error": "question and answer are required"}, status=400)

    schema = {
        "@context": "https://schema.org",
        "@type": "QAPage",
        "mainEntity": {
            "@type": "Question",
            "name": question,
            "answerCount": 1,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": answer,
                "author": {"@type": "Person", "name": author},
            },
        },
    }
    return Response({"success": True, "schema": json.dumps(schema, indent=2)})
    