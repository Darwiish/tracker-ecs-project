# Project name used as the IAM resource name prefix.
variable "project_name" {
  description = "Name prefix for IAM roles and policies."
  type        = string
}

# ECR repositories the ECS tasks can pull images from.
variable "ecr_repository_arns" {
  description = "ECR repository ARNs allowed for image pulls."
  type        = map(string)
}

# CloudWatch log groups the ECS tasks can write to.
variable "log_group_arns" {
  description = "CloudWatch log group ARNs allowed for task logging."
  type        = map(string)
}

# Secrets the ECS tasks can retrieve from Secrets Manager.
variable "secret_arns" {
  description = "Secrets Manager ARNs allowed for task injection."
  type        = list(string)
}

# Pass the Terraform state bucket ARN to the IAM module.
variable "terraform_state_bucket_arn" {
  description = "ARN of the S3 bucket storing Terraform state."
  type        = string
}