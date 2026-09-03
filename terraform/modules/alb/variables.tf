# Project name used in ALB resource names.
variable "project_name" {
  description = "Project name used in ALB resource names."
  type        = string
}

# Existing VPC used by the ALB and target groups.
variable "vpc_id" {
  description = "VPC ID for the ALB target groups."
  type        = string
}

# Public subnets used by the internet-facing ALB.
variable "public_subnet_ids" {
  description = "Public subnet IDs for the ALB."
  type        = list(string)
}

# Existing security group assigned to the ALB.
variable "alb_security_group_id" {
  description = "Security group ID for the ALB."
  type        = string
}

# Validated ACM certificate used by HTTPS.
variable "certificate_arn" {
  description = "ACM certificate ARN for the HTTPS listener."
  type        = string
}