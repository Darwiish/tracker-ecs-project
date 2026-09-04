variable "project_name" {
  description = "Name prefix for VPC endpoints."
  type        = string
}

variable "aws_region" {
  description = "AWS region where the endpoints are created."
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC containing the endpoints."
  type        = string
}

variable "private_application_subnet_ids" {
  description = "Private application subnets for interface endpoints."
  type        = list(string)
}

variable "private_application_route_table_ids" {
  description = "Private application route tables for the S3 gateway endpoint."
  type        = list(string)
}

variable "endpoint_security_group_id" {
  description = "Security group attached to interface endpoints."
  type        = string
}