provider "aws" {
  # Deploy the bootstrap bucket in Stockholm by default.
  region = var.aws_region

  # Apply consistent ownership tags to supported AWS resources.
  default_tags {
    tags = {
      ManagedBy = "Terraform"
      Purpose   = "Terraform state bootstrap"
      Project   = "tracker"
    }
  }
}