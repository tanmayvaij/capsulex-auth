/**
 * Terraform Providers & Backend Configuration
 * 
 * This file configures the Google Cloud provider and sets up the remote state backend.
 * The `backend "gcs"` block ensures that the terraform.tfstate file is stored securely
 * in the central Hub bucket, allowing GitHub Actions to run Terraform automatically.
 */

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "intelllexosv91-terraform-state"
    prefix = "terraform/state/intellaxis360"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
