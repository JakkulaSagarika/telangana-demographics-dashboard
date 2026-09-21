import json
import os
import secrets
import urllib.parse
import urllib.request

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import ensure_csrf_cookie
from google.auth.transport.requests import Request
from google.oauth2 import id_token

User = get_user_model()
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


def _json_body(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


def _user_data(user):
    return {"id": user.id, "email": user.email, "name": user.get_full_name() or user.get_username()}


def _frontend_url():
    return os.environ.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def _google_settings():
    client_id = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
    redirect_uri = os.environ.get("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback/")
    return client_id, client_secret, redirect_uri


@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"detail": "CSRF cookie set."})


def register(request):
    if request.method != "POST":
        return JsonResponse({"detail": "POST is required."}, status=405)
    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"detail": "Please submit valid form data."}, status=400)
    email, password = str(payload.get("email", "")).strip().lower(), payload.get("password", "")
    if not email or "@" not in email:
        return JsonResponse({"email": "Enter a valid email address."}, status=400)
    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse({"email": "An account with this email already exists. Please sign in."}, status=400)
    candidate = User(username=email, email=email)
    try:
        validate_password(password, candidate)
    except ValidationError as error:
        return JsonResponse({"password": list(error.messages)}, status=400)
    user = User.objects.create_user(username=email, email=email, password=password)
    login(request, user)
    return JsonResponse({"user": _user_data(user)}, status=201)


def login_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "POST is required."}, status=405)
    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"detail": "Please submit valid form data."}, status=400)
    email, password = str(payload.get("email", "")).strip().lower(), payload.get("password", "")
    if not email or not password:
        return JsonResponse({"detail": "Enter both your email address and password."}, status=400)
    # Accounts created by this portal use the email as username. Looking up the
    # matching user first also supports existing Django users whose username is
    # different from their registered email address.
    account = User.objects.filter(email__iexact=email).first()
    user = authenticate(request, username=account.get_username() if account else email, password=password)
    if user is None:
        return JsonResponse({"detail": "We couldn’t sign you in with that email and password."}, status=400)
    login(request, user)
    return JsonResponse({"user": _user_data(user)})


def logout_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "POST is required."}, status=405)
    logout(request)
    return JsonResponse({"detail": "Signed out."})


def me(request):
    return JsonResponse({"user": _user_data(request.user) if request.user.is_authenticated else None})


def google_start(request):
    client_id, client_secret, redirect_uri = _google_settings()
    if not client_id or not client_secret:
        return JsonResponse({"detail": "Google sign-in is not configured yet. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in the project .env file, then restart Django."}, status=503)
    state = secrets.token_urlsafe(32)
    request.session["google_oauth_state"] = state
    params = urllib.parse.urlencode({"client_id": client_id, "redirect_uri": redirect_uri, "response_type": "code", "scope": "openid email profile", "state": state, "prompt": "select_account"})
    return JsonResponse({"url": f"{GOOGLE_AUTH_URL}?{params}"})


def google_callback(request):
    expected_state = request.session.pop("google_oauth_state", None)
    if request.GET.get("error") or not expected_state or not secrets.compare_digest(expected_state, request.GET.get("state", "")):
        return redirect(f"{_frontend_url()}/login?error=google_cancelled")
    code = request.GET.get("code")
    client_id, client_secret, redirect_uri = _google_settings()
    if not code or not client_id or not client_secret:
        return redirect(f"{_frontend_url()}/login?error=google_failed")
    try:
        body = urllib.parse.urlencode({"code": code, "client_id": client_id, "client_secret": client_secret, "redirect_uri": redirect_uri, "grant_type": "authorization_code"}).encode()
        with urllib.request.urlopen(urllib.request.Request(GOOGLE_TOKEN_URL, data=body, method="POST"), timeout=10) as response:
            token_data = json.loads(response.read())
        claims = id_token.verify_oauth2_token(token_data["id_token"], Request(), client_id)
        email = claims.get("email", "").lower()
        if not email or not claims.get("email_verified"):
            raise ValueError("Google did not return a verified email address.")
    except Exception:
        return redirect(f"{_frontend_url()}/login?error=google_failed")
    user, created = User.objects.get_or_create(email=email, defaults={"username": email, "first_name": claims.get("given_name", ""), "last_name": claims.get("family_name", "")})
    if created:
        user.set_unusable_password()
        user.save(update_fields=["password"])
    login(request, user)
    return redirect(_frontend_url())
