provider "aws" {
  # Deploy resources in the configured AWS region.
  region = var.aws_region

  default_tags {
    tags = {
      ManagedBy = "Terraform"
      Project   = "tracker"
    }
  }
}