from django.urls import path

from . import views


urlpatterns = [
    path("csrf/", views.csrf, name="auth-csrf"),
    path("register/", views.register, name="auth-register"),
    path("login/", views.login_view, name="auth-login"),
    path("logout/", views.logout_view, name="auth-logout"),
    path("me/", views.me, name="auth-me"),
    path("google/start/", views.google_start, name="google-start"),
    path("google/callback/", views.google_callback, name="google-callback"),
]
