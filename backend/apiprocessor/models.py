from django.db import models

class UploadedFile(models.Model):
    """
    Model to store uploaded files and their metadata.
    Attributes:
    ----------
    file_path: FileField
        Path to the uploaded file.
    file_name: CharField
        Name of the uploaded file.
    uploaded_at: DateTimeField
        Timestamp when the file was uploaded.
    processed: BooleanField
        Indicates whether the file has been processed.
    result: JSONField
        Stores the result of processing the file.
    overrides: JSONField
        Stores any overrides applied to the file.
    """
    file_path = models.FileField(upload_to='uploads/')
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)
    result = models.JSONField(null=True, blank=True)
    overrides = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.file_name