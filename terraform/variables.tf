/**
 * Input Variables
 * 
 * This file defines all the configurable variables for this Terraform module.
 * Rather than hardcoding project IDs or region names throughout the code,
 * they are defined here to make the codebase reusable for other projects.
 */

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
  default     = "intelllexosv91"
}

variable "region" {
  description = "Google Cloud Region"
  type        = string
  default     = "europe-west1"
}

variable "app_name" {
  description = "Application Name (used for resource naming)"
  type        = string
  default     = "intellaxis-auth"
}

variable "github_repo" {
  description = "GitHub Repository Name (e.g. org/repo)"
  type        = string
  default     = "IntellaxisAI/intellaxis-auth"
}

variable "secrets" {
  description = "List of secret names to create in Secret Manager"
  type        = list(string)
  default     = [
    "DATABASE_URL",
    "SECRET_KEY"
  ]
}

variable "workload_identity_pool_name" {
  description = "The full resource name of the Workload Identity Pool"
  type        = string
  default     = "projects/1001306903031/locations/global/workloadIdentityPools/github-actions-pool-tf"
}
