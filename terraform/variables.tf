# Deploy resources in the configured AWS region.
variable "aws_region" {
  description = "AWS region for the tracker infrastructure."
  type        = string
  default     = "eu-north-1"
}

# Prefix resources with the project name.
variable "project_name" {
  description = "Name prefix applied to tracker resources."
  type        = string
  default     = "tracker"
}

# Select this many Availability Zones.
variable "availability_zone_count" {
  description = "Number of Availability Zones to use."
  type        = number
  default     = 2

  validation {
    condition     = var.availability_zone_count >= 2
    error_message = "availability_zone_count must be at least 2."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the tracker VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_application_subnet_cidrs" {
  description = "CIDR blocks for private application subnets."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "private_database_subnet_cidrs" {
  description = "CIDR blocks for private database subnets."
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

# Production hostname covered by ACM.
variable "domain_name" {
  description = "Production application domain."
  type        = string
  default     = "ayusuf-dev.dev"
}

# Cloudflare zone used for application DNS.
variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for the production domain."
  type        = string
}

# Cloudflare API token used by Terraform.
variable "cloudflare_api_token" {
  description = "Cloudflare API token."
  type        = string
  sensitive   = true
}

# ECS cluster name.
variable "cluster_name" {
  description = "ECS cluster name."
  type        = string
  default     = "tracker-cluster"
}

# Enable ECS Container Insights.
variable "container_insights_enabled" {
  description = "Whether ECS Container Insights is enabled."
  type        = bool
  default     = true
}

# PostgreSQL database name.
variable "database_name" {
  description = "Initial PostgreSQL database name."
  type        = string
  default     = "project_tracker"
}

# PostgreSQL master username.
variable "database_username" {
  description = "RDS master username."
  type        = string
  default     = "postgres"
}

# RDS instance class.
variable "database_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t3.micro"
}

# RDS allocated storage in GiB.
variable "allocated_storage" {
  description = "RDS allocated storage in GiB."
  type        = number
  default     = 20
}

# RDS automated backup retention.
variable "backup_retention_period" {
  description = "RDS automated backup retention in days."
  type        = number
  default     = 0
}

# Protect the RDS instance from accidental deletion.
variable "deletion_protection" {
  description = "Whether RDS deletion protection is enabled."
  type        = bool
  default     = true
}

# Immutable backend ECR image digest.
variable "backend_image_digest" {
  description = "Immutable backend ECR image digest."
  type        = string

  validation {
    condition     = can(regex("^sha256:[a-f0-9]{64}$", var.backend_image_digest))
    error_message = "backend_image_digest must be a valid SHA-256 image digest."
  }
}

# Immutable frontend ECR image digest.
variable "frontend_image_digest" {
  description = "Immutable frontend ECR image digest."
  type        = string

  validation {
    condition     = can(regex("^sha256:[a-f0-9]{64}$", var.frontend_image_digest))
    error_message = "frontend_image_digest must be a valid SHA-256 image digest."
  }
}

# CloudWatch log groups used by ECS containers.
variable "backend_log_group_name" {
  description = "CloudWatch log group for the backend."
  type        = string
  default     = "/ecs/tracker-backend"
}

variable "frontend_log_group_name" {
  description = "CloudWatch log group for the frontend."
  type        = string
  default     = "/ecs/tracker-frontend"
}

# Desired backend task count.
variable "backend_desired_count" {
  description = "Desired number of backend ECS tasks."
  type        = number
  default     = 1
}

# Desired frontend task count.
variable "frontend_desired_count" {
  description = "Desired number of frontend ECS tasks."
  type        = number
  default     = 1
}