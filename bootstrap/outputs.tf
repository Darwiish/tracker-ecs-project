# Expose the bucket name for backend configuration.
output "state_bucket_name" {
  description = "S3 bucket containing Terraform state."
  value       = aws_s3_bucket.terraform_state.id
}

# Identify the remote key used by this bootstrap root.
output "bootstrap_backend_key" {
  description = "Backend key for this bootstrap state."
  value       = "bootstrap/terraform.tfstate"
}

# Reserve a separate remote key for application infrastructure.
output "application_backend_key" {
  description = "Backend key reserved for the main tracker infrastructure."
  value       = "tracker/terraform.tfstate"
}