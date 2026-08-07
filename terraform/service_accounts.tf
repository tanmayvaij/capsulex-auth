/**
 * Service Accounts & IAM Configuration
 * 
 * This file establishes the "Principle of Least Privilege" by creating two isolated identities:
 * 1. Deployer (github_deployer): Used by GitHub Actions. Can push code and deploy, but cannot read secrets.
 * 2. Runtime (app_runtime): Used by Cloud Run. Can read production secrets, but cannot deploy code.
 * 
 * It also grants the Deployer access to the central Terraform State GCS bucket.
 */

# ==========================================================
# Deployer Service Account (For GitHub Actions)
# ==========================================================
resource "google_service_account" "github_deployer" {
  account_id   = "${var.app_name}-deployer"
  display_name = "GitHub Actions Deployer"
}

resource "google_project_iam_member" "artifact_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_project_iam_member" "cloud_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

resource "google_project_iam_member" "service_account_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.github_deployer.email}"
}

# Bind the specific GitHub repo to the deployer service account
resource "google_service_account_iam_member" "github_wif_binding" {
  service_account_id = google_service_account.github_deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${var.workload_identity_pool_name}/attribute.repository/${var.github_repo}"
}

# ==========================================================
# Runtime Service Account (For Cloud Run Application)
# ==========================================================
resource "google_service_account" "app_runtime" {
  account_id   = "${var.app_name}-runtime"
  display_name = "Cloud Run Runtime Identity"
}

resource "google_secret_manager_secret_iam_member" "secret_accessor" {
  for_each = toset(var.secrets)

  project   = var.project_id
  secret_id = google_secret_manager_secret.app_secrets[each.key].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.app_runtime.email}"
}
