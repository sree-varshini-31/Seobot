from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0005_project_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='last_analyzed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='project',
            name='cache_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
