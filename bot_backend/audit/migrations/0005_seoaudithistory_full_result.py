from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('audit', '0003_seoaudithistory_audit_seoau_project_50af07_idx'),
    ]

    operations = [
        migrations.AddField(
            model_name='seoaudithistory',
            name='full_result',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
