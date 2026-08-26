# Use Stockholm unless another region is explicitly provided.
variable "aws_region" {
  description = "AWS region where the Terraform state bucket is created."
  type        = string
  default     = "eu-north-1"
}

# Allow an explicit globally unique bucket name when needed.
variable "state_bucket_name" {
  description = "Optional globally unique S3 bucket name for Terraform state."
  type        = string
  default     = null

  # Reject names that do not meet S3 bucket naming requirements.
  validation {
    condition     = var.state_bucket_name == null || can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.state_bucket_name))
    error_message = "state_bucket_name must be a valid S3 bucket name."
  }
}