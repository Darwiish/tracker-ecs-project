# Deploy resources in the configured AWS region.
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      ManagedBy = "Terraform"
      Project   = "tracker"
    }
  }
}

# Manage DNS records through Cloudflare.
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}