terraform {
  # Require Terraform support for S3 lockfiles.
  required_version = ">= 1.10.0"

  # Pin the AWS provider to the major version used by this root.
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    # Keep bootstrap state separate from application state.
    key = "bootstrap/terraform.tfstate"
    # Use S3's native lockfile instead of a DynamoDB lock table.
    use_lockfile = true
    encrypt      = true
  }
}