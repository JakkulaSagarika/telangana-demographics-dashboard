import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase


class AuthenticationApiTests(TestCase):
    def post(self, endpoint, data):
        return self.client.post(endpoint, data=json.dumps(data), content_type="application/json")

    def test_register_hashes_password_and_creates_session(self):
        response = self.post("/api/auth/register/", {"email": "resident@example.com", "password": "SafePortalPassword!42"})
        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(email="resident@example.com")
        self.assertTrue(user.check_password("SafePortalPassword!42"))
        self.assertNotEqual(user.password, "SafePortalPassword!42")
        self.assertEqual(self.client.get("/api/auth/me/").json()["user"]["email"], "resident@example.com")

    def test_login_rejects_invalid_credentials(self):
        get_user_model().objects.create_user(username="resident@example.com", email="resident@example.com", password="SafePortalPassword!42")
        response = self.post("/api/auth/login/", {"email": "resident@example.com", "password": "not-the-password"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("couldn’t sign you in", response.json()["detail"])

    def test_login_creates_a_session_recognized_by_me(self):
        get_user_model().objects.create_user(username="resident-name", email="resident@example.com", password="SafePortalPassword!42")
        response = self.post("/api/auth/login/", {"email": "resident@example.com", "password": "SafePortalPassword!42"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me/").json()["user"]["email"], "resident@example.com")

    def test_logout_clears_the_authenticated_session(self):
        get_user_model().objects.create_user(username="resident@example.com", email="resident@example.com", password="SafePortalPassword!42")
        self.post("/api/auth/login/", {"email": "resident@example.com", "password": "SafePortalPassword!42"})
        response = self.post("/api/auth/logout/", {})
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(self.client.get("/api/auth/me/").json()["user"])

    def test_google_start_reports_missing_configuration(self):
        response = self.client.get("/api/auth/google/start/")
        self.assertEqual(response.status_code, 503)

    def test_google_start_uses_environment_configuration(self):
        with patch.dict("os.environ", {"GOOGLE_OAUTH_CLIENT_ID": "client-id", "GOOGLE_OAUTH_CLIENT_SECRET": "client-secret"}):
            response = self.client.get("/api/auth/google/start/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("accounts.google.com", response.json()["url"])

    def test_localhost_frontend_is_a_trusted_csrf_origin(self):
        client = self.client_class(enforce_csrf_checks=True)
        csrf_response = client.get("/api/auth/csrf/")
        response = client.post(
            "/api/auth/register/",
            data=json.dumps({"email": "new@example.com", "password": "SafePortalPassword!42"}),
            content_type="application/json",
            HTTP_ORIGIN="http://localhost:5173",
            HTTP_X_CSRFTOKEN=csrf_response.cookies["csrftoken"].value,
        )
        self.assertEqual(response.status_code, 201)
