/**
 * Secret Manager Configuration
 *
 * This file creates the securely encrypted slots for production secrets.
 * Note: Terraform only creates the empty secret containers. The actual secret
 * payloads (like the real database password) must be added manually in the 
 * GCP Console to prevent exposing them in plaintext within the Terraform state.
 */

# ==========================================================
# Secret Manager
# ==========================================================

resource "google_secret_manager_secret" "app_secrets" {
  for_each = toset(var.secrets)

  secret_id = "${upper(var.app_name)}_${each.key}"
  replication {
    auto {}
  }
}

# Note: We create the secrets here, but we do NOT set the values via Terraform.
# Setting secret values in code is a security risk. You should manually add the 
# values for these secrets in the GCP Console after Terraform creates them.
