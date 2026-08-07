/**
 * Output Values
 * 
 * This file defines the values that Terraform should display to the user
 * after a successful `terraform apply`. These outputs are often used to 
 * feed values into CI/CD pipelines or other Terraform modules.
 */

output "deployer_service_account_email" {
  description = "The email of the deployer service account (should match WIF_SERVICE_ACCOUNT in GitHub Actions)"
  value       = google_service_account.github_deployer.email
}

output "runtime_service_account_email" {
  description = "The email of the runtime service account used by Cloud Run"
  value       = google_service_account.app_runtime.email
}

output "artifact_registry_repo" {
  description = "The name of the Artifact Registry repository"
  value       = google_artifact_registry_repository.docker_repo.name
}

output "secrets_created" {
  description = "A map of all created secrets and their IDs"
  value = {
    for k, v in google_secret_manager_secret.app_secrets : k => v.secret_id
  }
}
