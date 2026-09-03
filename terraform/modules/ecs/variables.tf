# ECS cluster name.
variable "cluster_name" {
  description = "ECS cluster name."
  type        = string
}

# Enable or disable ECS Container Insights.
variable "container_insights_enabled" {
  description = "Whether ECS Container Insights is enabled."
  type        = bool
}

# AWS region used for CloudWatch logging.
variable "aws_region" {
  description = "AWS region used by CloudWatch logging."
  type        = string
}

# Backend ECR repository URL.
variable "backend_image_repository_url" {
  description = "Backend ECR repository URL."
  type        = string
}

# Frontend ECR repository URL.
variable "frontend_image_repository_url" {
  description = "Frontend ECR repository URL."
  type        = string
}

# Immutable backend ECR image digest.
variable "backend_image_digest" {
  description = "Immutable backend ECR image digest."
  type        = string
}

# Immutable frontend ECR image digest.
variable "frontend_image_digest" {
  description = "Immutable frontend ECR image digest."
  type        = string
}

# IAM role used by ECS to pull images and write logs.
variable "task_execution_role_arn" {
  description = "Existing IAM role ARN for ECS task execution."
  type        = string
}

# IAM role used by the application containers.
variable "task_role_arn" {
  description = "Existing IAM role ARN for application tasks."
  type        = string
}

# CloudWatch log group for the backend.
variable "backend_log_group_name" {
  description = "Existing CloudWatch log group for the backend."
  type        = string
}

# CloudWatch log group for the frontend.
variable "frontend_log_group_name" {
  description = "Existing CloudWatch log group for the frontend."
  type        = string
}

# Private RDS endpoint used by the backend.
variable "rds_endpoint" {
  description = "Private RDS endpoint for the backend."
  type        = string
}

# PostgreSQL database name used by the backend.
variable "database_name" {
  description = "PostgreSQL database name."
  type        = string
}

# ARN of the RDS-managed database credentials secret.
variable "rds_master_user_secret_arn" {
  description = "ARN of the RDS-managed credential secret."
  type        = string
}

# ARN of the JWT signing secret.
variable "jwt_secret_arn" {
  description = "ARN of the JWT signing secret."
  type        = string
}

# Private subnets where ECS task ENIs are created.
variable "private_application_subnet_ids" {
  description = "Private subnets for ECS task ENIs."
  type        = list(string)
}

# Security group attached to backend ECS tasks.
variable "backend_security_group_id" {
  description = "Existing backend task security group ID."
  type        = string
}

# Security group attached to frontend ECS tasks.
variable "frontend_security_group_id" {
  description = "Existing frontend task security group ID."
  type        = string
}

# ALB target group for backend tasks.
variable "backend_target_group_arn" {
  description = "Backend ALB target group ARN."
  type        = string
}

# ALB target group for frontend tasks.
variable "frontend_target_group_arn" {
  description = "Frontend ALB target group ARN."
  type        = string
}

# Desired number of backend ECS tasks.
variable "backend_desired_count" {
  description = "Desired number of backend tasks."
  type        = number
}

# Desired number of frontend ECS tasks.
variable "frontend_desired_count" {
  description = "Desired number of frontend tasks."
  type        = number
}