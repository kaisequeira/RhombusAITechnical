from django.urls import path
from .views import FileUploadView, FileListView, OverrideDataTypesView, DownloadFileView, DeleteFileView

urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='upload-file'),
    path('files/', FileListView.as_view(), name='list-files'),
    path('files/<int:file_id>/override/', OverrideDataTypesView.as_view(), name='override-data-types'),
    path('files/<int:file_id>/download/', DownloadFileView.as_view(), name='download-file'),
    path('files/<int:file_id>/delete/', DeleteFileView.as_view(), name='delete-file'),
]