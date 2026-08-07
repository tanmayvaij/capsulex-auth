/**
 * Artifact Registry Configuration
 * 
 * This file provisions the Docker Artifact Registry for this specific "Spoke" project.
 * All backend and frontend container images for this application will be pushed here
 * by the GitHub Actions CI/CD pipeline.
 */

# ==========================================================
# Artifact Registry
# ==========================================================
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = var.app_name
  description   = "Docker repository for ${var.app_name}"
  format        = "DOCKER"
}
